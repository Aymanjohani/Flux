#!/usr/bin/env node
/**
 * Flux-Lite Memory Engine
 * Serverless vector memory using LanceDB
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const lancedb = require('vectordb');
const { MetricType } = require('vectordb');

const DB_PATH = path.join(__dirname, '../memory/vector_db');
const MEMORY_PATH = path.join(__dirname, '../memory');
const SEMANTIC_PATH = path.join(MEMORY_PATH, 'semantic');
const TABLE_NAME = 'memory_chunks';
const RELATIONSHIPS_FILE = path.join(SEMANTIC_PATH, 'relationships.json');

/**
 * Write JSON to a file with mkdir-based atomic locking.
 * Compatible with bash file-lock.sh: same /tmp/openclaw-locks/ directory,
 * same mkdir protocol, same 5-minute stale detection threshold.
 *
 * @param {string} filePath - Absolute path to the JSON file
 * @param {object} data - Object to serialize as JSON
 */
async function lockedWriteJSON(filePath, data) {
  const lockDir = '/tmp/openclaw-locks';
  const lockName = filePath.replace(/\//g, '_').replace(/^_/, '') + '.lock';
  const lockPath = path.join(lockDir, lockName);

  await fs.mkdir(lockDir, { recursive: true });

  const maxWait = 30;
  let acquired = false;
  for (let i = 0; i < maxWait; i++) {
    try {
      await fs.mkdir(lockPath);
      // Got lock — write pid
      await fs.writeFile(path.join(lockPath, 'pid'), String(process.pid));
      acquired = true;
      break;
    } catch (e) {
      if (i === maxWait - 1) throw new Error(`Lock timeout: ${filePath}`);
      // Check stale (>5 min)
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > 300000) {
          await fs.rm(lockPath, { recursive: true });
          continue;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!acquired) throw new Error(`Lock not acquired: ${filePath}`);

  try {
    const content = JSON.stringify(data, null, 2);
    const tmpFile = filePath + '.tmp';
    await fs.writeFile(tmpFile, content);
    await fs.rename(tmpFile, filePath); // atomic on same filesystem
  } finally {
    await fs.rm(lockPath, { recursive: true }).catch(() => {});
  }
}

// Embedding config - OpenAI text-embedding-3-small (1536 dims)
const EMBEDDING_MODEL = 'text-embedding-3-small';
let openaiApiKey;

async function initEmbeddings() {
  if (openaiApiKey) return;

  // Try env var first, then read from openclaw.json
  openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    try {
      const config = JSON.parse(await fs.readFile(path.join(__dirname, '../../openclaw.json'), 'utf-8'));
      openaiApiKey = config.env?.vars?.OPENAI_API_KEY;
    } catch (e) {}
  }
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not found in env or openclaw.json');
  }
}

/**
 * Call LLM for text analysis (used in dream consolidation)
 * Primary: Claude (Sonnet) via claude CLI
 * Fallback: OpenAI via gateway API (uses OAuth)
 */
async function callLLM(prompt) {
  const { execSync } = require('child_process');
  const tmpFile = `/tmp/memory-prompt-${Date.now()}.txt`;
  const GATEWAY_URL = 'http://127.0.0.1:18789';

  // Try Claude CLI first
  try {
    await fs.writeFile(tmpFile, prompt);
    const result = execSync(`cat ${tmpFile} | claude -p --model sonnet --no-session-persistence`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,  // 2 minute timeout
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await fs.unlink(tmpFile).catch(() => {});
    return result.trim();
  } catch (claudeError) {
    console.error('⚠️  Claude failed, falling back to OpenAI via gateway:', claudeError.message);

    // Fallback to OpenAI via gateway
    try {
      const { execSync: execSyncFallback } = require('child_process');
      const response = execSyncFallback(`curl -s -X POST "${GATEWAY_URL}/api/complete" \
        -H "Content-Type: application/json" \
        -d '${JSON.stringify({ prompt, max_tokens: 2000, model: 'openai' }).replace(/'/g, "'\\''")}' \
        --max-time 120`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      await fs.unlink(tmpFile).catch(() => {});
      const parsed = JSON.parse(response);
      return (parsed.completion || parsed.text || '').trim();
    } catch (openaiError) {
      await fs.unlink(tmpFile).catch(() => {});
      throw new Error(`LLM call failed. Claude: ${claudeError.message}, OpenAI: ${openaiError.message}`);
    }
  }
}

/**
 * Generate embedding vector for text via OpenAI API
 */
async function embed(text) {
  await initEmbeddings();
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: EMBEDDING_MODEL, input: text });
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(`OpenAI embed error: ${parsed.error.message}`));
          if (!parsed.data?.[0]?.embedding) return reject(new Error('No embedding in response'));
          resolve(parsed.data[0].embedding);
        } catch (e) {
          reject(new Error(`Failed to parse embedding response: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Split markdown into logical chunks
 * Uses headers as natural boundaries
 */
function chunkMarkdown(content, filePath) {
  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = { text: '', header: '', startLine: 0 };
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    
    // Check if line is a header
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous chunk if it has content
      if (currentChunk.text.trim()) {
        chunks.push({
          ...currentChunk,
          text: currentChunk.text.trim(),
          endLine: lineNum - 1
        });
      }
      
      // Start new chunk
      currentChunk = {
        text: line + '\n',
        header: headerMatch[2],
        level: headerMatch[1].length,
        startLine: lineNum
      };
    } else {
      currentChunk.text += line + '\n';
    }
  }
  
  // Add final chunk
  if (currentChunk.text.trim()) {
    chunks.push({
      ...currentChunk,
      text: currentChunk.text.trim(),
      endLine: lineNum
    });
  }

  // Add metadata to each chunk
  return chunks.map((chunk, idx) => ({
    text: chunk.text,
    source: filePath,
    header: chunk.header || '(no header)',
    chunkIndex: idx,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    lastUpdated: new Date().toISOString(),
    confidence: 'medium'  // default for ingested files
  }));
}

/**
 * Ingest a markdown file into the vector database
 * @param {string} filePath - Path to the file to read
 * @param {object} options - Optional settings
 * @param {string} options.sourceTag - Custom source identifier (for dedup isolation)
 */
async function ingest(filePath, options = {}) {
  try {
    await initEmbeddings();

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    // Use sourceTag if provided, otherwise use filePath
    const sourceId = options.sourceTag || filePath;

    console.log(`📥 Ingesting: ${filePath}${options.sourceTag ? ` (source: ${sourceId})` : ''}`);

    // Read file
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Split into chunks (use sourceId for the source field)
    const chunks = chunkMarkdown(content, sourceId);
    console.log(`   Split into ${chunks.length} chunks`);
    
    // Generate embeddings for each chunk
    const records = [];
    for (const chunk of chunks) {
      const vector = await embed(chunk.text);
      records.push({
        vector,
        text: chunk.text,
        source: chunk.source,
        header: chunk.header,
        chunkIndex: chunk.chunkIndex,
        lastUpdated: chunk.lastUpdated,
        confidence: chunk.confidence || 'medium'
      });
    }
    
    // Connect to LanceDB
    const db = await lancedb.connect(DB_PATH);
    
    // Check if table exists
    const tableNames = await db.tableNames();
    
    if (tableNames.includes(TABLE_NAME)) {
      // Open existing table
      const table = await db.openTable(TABLE_NAME);

      // Delete existing chunks for this source to prevent duplicates
      // Uses sourceId (not filePath) so custom sourceTag isolates new chunks from old
      try {
        const beforeCount = await table.countRows();
        await table.delete(`source = '${sourceId}'`);
        const afterCount = await table.countRows();
        const deleted = beforeCount - afterCount;
        if (deleted > 0) {
          console.log(`   🗑️  Removed ${deleted} old chunks for this source`);
        }
      } catch (delErr) {
        // Ignore delete errors (source may not exist)
      }

      // Add new chunks
      await table.add(records);
      console.log(`   ✅ Added ${records.length} chunks to existing table`);
    } else {
      // Create new table
      await db.createTable(TABLE_NAME, records);
      console.log(`   ✅ Created table and added ${records.length} chunks`);
    }
    
    return { success: true, chunksAdded: records.length };
  } catch (error) {
    console.error(`❌ Error ingesting ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Apply temporal decay to search results
 * @param {Array} results - Results with score and lastUpdated
 * @param {number} decayWeight - Blend weight for recency (default 0.15)
 * @param {number} halfLifeDays - Days until temporal bonus halves (default 30)
 * @returns {Array} Re-scored and re-sorted results
 */
function applyTemporalDecay(results, decayWeight = 0.15, halfLifeDays = 30) {
  const now = Date.now();
  const decayConstant = Math.LN2 / (halfLifeDays * 86400000);

  return results.map(r => {
    let temporalScore = 0;
    if (r.lastUpdated) {
      const ageMs = Math.max(0, now - new Date(r.lastUpdated).getTime());
      if (!isNaN(ageMs)) temporalScore = Math.exp(-decayConstant * ageMs);
    }
    return {
      ...r,
      score: r.score * (1 - decayWeight) + temporalScore * decayWeight,
      _originalScore: r.score,
      _temporalScore: temporalScore
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Retrieve relevant chunks from the vector database
 */
async function retrieve(query, options = {}) {
  try {
    await initEmbeddings();
    
    const limit = options.limit || 5;
    const scoreThreshold = options.scoreThreshold || 0.5;
    
    if (!options._silent) console.log(`🔍 Searching for: "${query}"`);

    // Generate query embedding
    const queryVector = await embed(query);

    // Connect to database
    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();

    if (!tableNames.includes(TABLE_NAME)) {
      if (!options._silent) console.log('   ⚠️  No memory index found');
      return { results: [] };
    }

    const table = await db.openTable(TABLE_NAME);

    // Perform vector search
    const results = await table
      .search(queryVector)
      .metricType(MetricType.Cosine)
      .limit(limit)
      .execute();

    // Filter by score threshold and format results
    // Note: vectordb uses cosine distance [0, 2], where lower = more similar
    // Convert to similarity score: score = 1 - (distance / 2)
    const formattedResults = results
      .map(r => ({
        text: r.text,
        source: r.source,
        header: r.header,
        distance: r._distance,
        score: Math.max(0, 1 - (r._distance / 2)), // Normalize to 0-1 range
        chunkIndex: r.chunkIndex,
        lastUpdated: r.lastUpdated,
        confidence: r.confidence || 'medium'
      }))
      .filter(r => r.score >= scoreThreshold);

    // Apply temporal decay
    const decayWeight = options.decayWeight ?? 0.15;
    const decayed = decayWeight > 0
      ? applyTemporalDecay(formattedResults, decayWeight, options.halfLifeDays ?? 30)
      : formattedResults;

    // Confidence boost (opt-in)
    if (options.boostHighConfidence) {
      for (const r of decayed) {
        if (r.confidence === 'high') r.score = Math.min(r.score * 1.1, 1.0);
      }
      decayed.sort((a, b) => b.score - a.score);
    }

    // Hybrid fallback: keyword search when vector yields < 2 results
    if (decayed.length < 2) {
      try {
        const kwResults = await grepSemanticFiles(query, limit - decayed.length);
        const seen = new Set(decayed.map(r => r.source));
        for (const kr of kwResults) {
          if (!seen.has(kr.source)) { decayed.push(kr); seen.add(kr.source); }
        }
      } catch { /* keyword fallback is best-effort */ }
    }

    if (!options._silent) console.log(`   Found ${decayed.length} relevant chunks`);

    return {
      query,
      results: decayed,
      count: decayed.length
    };
  } catch (error) {
    console.error(`❌ Error retrieving:`, error.message);
    throw error;
  }
}

/**
 * Keyword fallback - grep semantic files for exact matches
 * Called when vector search returns insufficient results
 * @param {string} query - Search terms
 * @param {number} limit - Max results
 * @returns {Array} Matching snippets with source/header/score
 */
async function grepSemanticFiles(query, limit = 3) {
  const { execSync } = require('child_process');
  const results = [];
  const searchDirs = [SEMANTIC_PATH, path.join(MEMORY_PATH, 'context-hierarchy/chapters')];
  const safeQuery = query.replace(/["`$\\]/g, '');

  for (const dir of searchDirs) {
    try { await fs.access(dir); } catch { continue; }
    try {
      const files = execSync(
        `grep -ril "${safeQuery}" "${dir}/"*.md 2>/dev/null | head -5`,
        { encoding: 'utf8', timeout: 5000 }
      ).trim().split('\n').filter(Boolean);

      for (const file of files) {
        if (results.length >= limit) break;
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        const lowerQ = safeQuery.toLowerCase();
        const matchIdx = lines.findIndex(l => l.toLowerCase().includes(lowerQ));
        if (matchIdx === -1) continue;

        const snippet = lines.slice(Math.max(0, matchIdx - 2), matchIdx + 8).join('\n');
        let header = '(grep match)';
        for (let i = matchIdx; i >= 0; i--) {
          const h = lines[i].match(/^#{1,6}\s+(.+)$/);
          if (h) { header = h[1]; break; }
        }

        results.push({
          text: snippet,
          source: path.relative(path.join(__dirname, '..'), file),
          header,
          score: 0.45,
          matchType: 'keyword'
        });
      }
    } catch { /* grep failed, continue */ }
  }
  return results;
}

/**
 * Extract entity relationships from dream() output into adjacency list
 */
async function extractRelationships(extracted, dateStr) {
  let rels = {};
  try { rels = JSON.parse(await fs.readFile(RELATIONSHIPS_FILE, 'utf-8')); } catch {}

  let count = 0;
  function addRel(e1, e2, type) {
    e1 = e1.trim(); e2 = e2.trim();
    if (!e1 || !e2 || e1 === e2) return;
    if (!rels[e1]) rels[e1] = [];
    if (!rels[e2]) rels[e2] = [];
    if (rels[e1].some(r => r.target === e2 && r.type === type)) return;
    rels[e1].push({ target: e2, type, since: dateStr });
    rels[e2].push({ target: e1, type: type + '_inv', since: dateStr });
    count++;
  }

  for (const f of (extracted.facts || [])) {
    if (f.category === 'person') addRel(f.key, f.value.substring(0, 50), 'person_fact');
    if (f.category === 'project') addRel('IIoT Solutions', f.key, 'project');
    if (f.category === 'company') addRel('IIoT Solutions', f.key, 'company_attr');
  }
  for (const d of (extracted.decisions || [])) {
    if (d.topic) addRel(d.topic, `decision_${dateStr}`, 'decided');
  }
  for (const p of (extracted.user_preferences || [])) {
    if (p.user) addRel(p.user, (p.preference || '').substring(0, 50), 'prefers');
  }

  if (count > 0) {
    await fs.writeFile(RELATIONSHIPS_FILE, JSON.stringify(rels, null, 2));
    console.log(`   🕸️  ${count} new relationships (${Object.keys(rels).length} entities)`);
  }
  return { newCount: count, totalEntities: Object.keys(rels).length };
}

/**
 * BFS traversal of entity relationships
 */
async function getRelated(entity, options = {}) {
  const depth = options.depth || 1;
  let rels;
  try { rels = JSON.parse(await fs.readFile(RELATIONSHIPS_FILE, 'utf-8')); }
  catch { return { entity, relations: [], hops: {} }; }

  const key = Object.keys(rels).find(k => k.toLowerCase() === entity.toLowerCase());
  if (!key) return { entity, relations: [], hops: {} };

  const visited = new Set([key]);
  const hops = { [key]: 0 };
  const all = [];
  let frontier = [key];

  for (let d = 1; d <= depth; d++) {
    const next = [];
    for (const cur of frontier) {
      for (const r of (rels[cur] || [])) {
        all.push({ from: cur, to: r.target, type: r.type, since: r.since, hop: d });
        if (!visited.has(r.target)) {
          visited.add(r.target); hops[r.target] = d; next.push(r.target);
        }
      }
    }
    frontier = next;
  }
  return { entity: key, relations: all, hops };
}

/**
 * Detect and resolve contradictions between new facts and state.json
 * @param {Array} newFacts - From dream() extraction: [{category, key, value, confidence}]
 * @returns {Object} { contradictions: [...], updatedState }
 */
async function detectContradictions(newFacts) {
  const STATE_FILE = path.join(MEMORY_PATH, 'state.json');
  let state;
  try { state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8')); }
  catch { return { contradictions: [], updatedState: null }; }

  const contradictions = [];
  const now = new Date().toISOString();
  if (!state.invalidated) state.invalidated = [];

  for (const fact of newFacts) {
    const key = `${fact.category}.${fact.key}`;
    const existing = state.facts[key];
    if (!existing) continue;
    if (existing.value.toLowerCase().trim() === fact.value.toLowerCase().trim()) continue;

    // Same key, different value = contradiction
    contradictions.push({
      key, oldValue: existing.value, newValue: fact.value,
      confidence: fact.confidence || 'medium', method: 'exact_key'
    });
    state.invalidated.push({
      key, oldValue: existing.value, invalidatedAt: now,
      reason: `Superseded (${fact.confidence || 'medium'}): ${fact.value}`
    });
    state.facts[key] = {
      value: fact.value, updatedAt: now,
      source: `dream() (was: ${existing.value})`,
      confidence: fact.confidence || 'medium'
    };
    console.log(`   ⚡ Contradiction [${key}]: "${existing.value}" → "${fact.value}"`);
  }

  // Fuzzy check via LLM for unmatched facts (batched, only if 3+)
  const unmatched = newFacts.filter(f => !contradictions.some(c => c.key === `${f.category}.${f.key}`));
  if (unmatched.length >= 3 && Object.keys(state.facts).length > 0) {
    try {
      const existingSummary = Object.entries(state.facts).slice(0, 30)
        .map(([k, v]) => `${k}: ${v.value}`).join('\n');
      const newSummary = unmatched.map(f => `${f.category}.${f.key}: ${f.value}`).join('\n');

      const resp = await callLLM(
        `Compare NEW facts against EXISTING. Return JSON array of contradictions only.\n\nEXISTING:\n${existingSummary}\n\nNEW:\n${newSummary}\n\nReturn ONLY: [{"existingKey":"x","newKey":"y","reason":"z"}] or []`
      );
      const llmResult = JSON.parse(resp.replace(/^```json?\n?/i, '').replace(/\n?```$/i, ''));

      for (const c of llmResult) {
        if (!state.facts[c.existingKey]) continue;
        const newFact = unmatched.find(f => `${f.category}.${f.key}` === c.newKey);
        if (!newFact) continue;

        contradictions.push({ key: c.existingKey, oldValue: state.facts[c.existingKey].value,
          newValue: newFact.value, reason: c.reason, method: 'llm_fuzzy' });
        state.invalidated.push({ key: c.existingKey, oldValue: state.facts[c.existingKey].value,
          invalidatedAt: now, reason: `LLM: ${c.reason}` });
        state.facts[c.existingKey] = { value: newFact.value, updatedAt: now,
          source: 'dream() - LLM resolution', confidence: newFact.confidence || 'medium' };
        console.log(`   ⚡ Contradiction [LLM]: ${c.existingKey} — ${c.reason}`);
      }
    } catch { console.log('   Note: LLM fuzzy check skipped'); }
  }

  if (contradictions.length > 0) {
    state.updatedAt = now;
    await lockedWriteJSON(STATE_FILE, state);
  }
  return { contradictions, updatedState: state };
}

/**
 * Dream - Consolidate episodic memory into semantic memory
 * Reads daily logs, extracts facts/preferences, updates semantic files
 */
async function dream(options = {}) {
  try {
    await initEmbeddings();

    const daysBack = options.daysBack || 1;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);
    const dateStr = targetDate.toISOString().split('T')[0];

    console.log(`🌙 Dream consolidation for ${dateStr}`);

    // Find the episodic log file
    const episodicFile = path.join(MEMORY_PATH, `${dateStr}.md`);

    let episodicContent;
    try {
      episodicContent = await fs.readFile(episodicFile, 'utf-8');
      console.log(`   📖 Read episodic log: ${episodicFile}`);
    } catch (err) {
      console.log(`   ⚠️  No episodic log found for ${dateStr}`);
      return { success: false, reason: 'no_episodic_log' };
    }

    // Use LLM to extract structured information
    const extractionPrompt = `Analyze this daily log and extract structured information.

<daily_log>
${episodicContent}
</daily_log>

Extract and return a JSON object with these categories:

{
  "facts": [
    {"category": "project|tech|company|person", "key": "short_key", "value": "the fact", "confidence": "high|medium"}
  ],
  "user_preferences": [
    {"user": "name", "preference": "description", "source": "how you know this"}
  ],
  "decisions": [
    {"topic": "what", "decision": "what was decided", "date": "${dateStr}"}
  ],
  "action_items": [
    {"task": "description", "status": "pending|done", "assignee": "who"}
  ],
  "learnings": [
    {"topic": "what", "lesson": "what was learned"}
  ]
}

Only include items that are clearly stated or strongly implied. Be conservative - quality over quantity.
Return ONLY the JSON object, no markdown code blocks or other text.`;

    console.log(`   🧠 Analyzing with LLM...`);

    const responseText = await callLLM(extractionPrompt);

    let extracted;
    try {
      // Handle potential markdown code blocks
      const jsonStr = responseText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
      extracted = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error(`   ❌ Failed to parse LLM response as JSON`);
      console.error(`   Response: ${responseText.substring(0, 200)}...`);
      return { success: false, reason: 'parse_error' };
    }

    console.log(`   ✅ Extracted:`);
    console.log(`      - ${extracted.facts?.length || 0} facts`);
    console.log(`      - ${extracted.user_preferences?.length || 0} user preferences`);
    console.log(`      - ${extracted.decisions?.length || 0} decisions`);
    console.log(`      - ${extracted.action_items?.length || 0} action items`);
    console.log(`      - ${extracted.learnings?.length || 0} learnings`);

    // Contradiction detection
    if (extracted.facts?.length > 0) {
      try {
        const { contradictions } = await detectContradictions(extracted.facts);
        if (contradictions.length > 0)
          console.log(`   ⚡ Resolved ${contradictions.length} contradiction(s)`);
      } catch (e) { console.log('   Note: Contradiction check failed:', e.message); }
    }

    // Persist high-confidence facts to state.json
    if (extracted.facts?.length > 0) {
      try {
        const STATE_FILE = path.join(MEMORY_PATH, 'state.json');
        let state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
        let added = 0;
        for (const f of extracted.facts) {
          const key = `${f.category}.${f.key}`;
          if (!state.facts[key] && f.confidence === 'high') {
            state.facts[key] = { value: f.value, updatedAt: new Date().toISOString(),
              source: `dream()`, confidence: 'high' };
            added++;
          }
        }
        if (added > 0) {
          state.updatedAt = new Date().toISOString();
          await lockedWriteJSON(STATE_FILE, state);
          console.log(`   📊 Added ${added} high-confidence facts to state.json`);
        }
      } catch (e) { console.log('   Note: Fact persistence failed:', e.message); }
    }

    // Relationship extraction
    try { await extractRelationships(extracted, dateStr); }
    catch (e) { console.log('   Note: Relationship extraction failed:', e.message); }

    // Write consolidated output to semantic memory
    const consolidatedFile = path.join(SEMANTIC_PATH, `consolidated-${dateStr}.md`);

    let consolidatedContent = `# Consolidated Memory: ${dateStr}\n\n`;
    consolidatedContent += `*Auto-generated by dream() at ${new Date().toISOString()}*\n\n`;

    if (extracted.facts?.length > 0) {
      consolidatedContent += `## Facts\n\n`;
      for (const fact of extracted.facts) {
        consolidatedContent += `- **[${fact.category}]** ${fact.key}: ${fact.value} (confidence: ${fact.confidence || 'medium'})\n`;
      }
      consolidatedContent += `\n`;
    }

    if (extracted.user_preferences?.length > 0) {
      consolidatedContent += `## User Preferences\n\n`;
      for (const pref of extracted.user_preferences) {
        consolidatedContent += `- **${pref.user}**: ${pref.preference} _(${pref.source})_\n`;
      }
      consolidatedContent += `\n`;
    }

    if (extracted.decisions?.length > 0) {
      consolidatedContent += `## Decisions\n\n`;
      for (const dec of extracted.decisions) {
        consolidatedContent += `- **${dec.topic}**: ${dec.decision}\n`;
      }
      consolidatedContent += `\n`;
    }

    if (extracted.learnings?.length > 0) {
      consolidatedContent += `## Learnings\n\n`;
      for (const learn of extracted.learnings) {
        consolidatedContent += `- **${learn.topic}**: ${learn.lesson}\n`;
      }
      consolidatedContent += `\n`;
    }

    if (extracted.action_items?.length > 0) {
      consolidatedContent += `## Action Items\n\n`;
      for (const item of extracted.action_items) {
        const status = item.status === 'done' ? '✅' : '⬜';
        consolidatedContent += `- ${status} ${item.task}`;
        if (item.assignee) consolidatedContent += ` (@${item.assignee})`;
        consolidatedContent += `\n`;
      }
      consolidatedContent += `\n`;
    }

    await fs.writeFile(consolidatedFile, consolidatedContent);
    console.log(`   📝 Written: ${consolidatedFile}`);

    // Ingest the consolidated file into vector DB
    await ingest(consolidatedFile);

    // Append learnings to lessons-learned.md (living document)
    if (extracted.learnings?.length > 0) {
      const lessonsFileAbs = path.join(SEMANTIC_PATH, 'lessons-learned.md');
      const lessonsFileRel = 'memory/semantic/lessons-learned.md';  // Consistent relative path
      try {
        let lessonsContent = await fs.readFile(lessonsFileAbs, 'utf-8');

        // Build new section with date header
        let newSection = `\n## ${dateStr}\n\n`;

        // Group learnings by topic if possible
        const byTopic = {};
        for (const learn of extracted.learnings) {
          const topic = learn.topic || 'General';
          if (!byTopic[topic]) byTopic[topic] = [];
          byTopic[topic].push(learn.lesson);
        }

        for (const [topic, lessons] of Object.entries(byTopic)) {
          newSection += `### ${topic}\n`;
          for (const lesson of lessons) {
            newSection += `- ${lesson}\n`;
          }
          newSection += `\n`;
        }

        // Append to end of file
        lessonsContent += newSection;
        await fs.writeFile(lessonsFileAbs, lessonsContent);
        console.log(`   📚 Appended ${extracted.learnings.length} learnings to lessons-learned.md`);

        // Re-ingest with isolated sourceTag to preserve old chunks
        // Old chunks: memory/semantic/lessons-learned.md (672 historical - untouched)
        // New chunks: memory/semantic/lessons-learned.md@v2 (new system)
        await ingest(lessonsFileRel, { sourceTag: lessonsFileRel + '@v2' });
      } catch (err) {
        console.error(`   ⚠️  Could not update lessons-learned.md: ${err.message}`);
      }

      // Auto-compact if lessons file exceeds 500 lines
      try {
        const lessonsLineCount = (await fs.readFile(lessonsFileAbs, 'utf-8')).split('\n').length;
        if (lessonsLineCount > 500) {
          console.log(`   📦 Compacting lessons (${lessonsLineCount} lines)...`);
          const result = await compactLessons();
          console.log(`   📦 ${result.beforeLines} → ${result.afterLines} lines`);
        }
      } catch (compactErr) {
        console.log(`   ⚠️  Lessons compaction skipped: ${compactErr.message}`);
      }
    }

    // Update index
    const indexFile = path.join(SEMANTIC_PATH, 'index.md');
    try {
      let indexContent = await fs.readFile(indexFile, 'utf-8');
      const newEntry = `- [${dateStr}](consolidated-${dateStr}.md) - Auto-consolidated\n`;
      if (!indexContent.includes(newEntry)) {
        indexContent = indexContent.replace(
          /## Consolidated Logs\n/,
          `## Consolidated Logs\n${newEntry}`
        );
        await fs.writeFile(indexFile, indexContent);
        console.log(`   📋 Updated index`);
      }
    } catch (err) {
      // Create index if it doesn't exist
      const indexContent = `# Semantic Memory Index\n\n## Consolidated Logs\n- [${dateStr}](consolidated-${dateStr}.md) - Auto-consolidated\n`;
      await fs.writeFile(indexFile, indexContent);
      console.log(`   📋 Created index`);
    }

    console.log(`   ✨ Dream consolidation complete`);

    return {
      success: true,
      date: dateStr,
      extracted,
      outputFile: consolidatedFile
    };
  } catch (error) {
    console.error(`❌ Error in dream():`, error.message);
    throw error;
  }
}

/**
 * Delete chunks from vector database by source file pattern
 * Supports exact match or glob-like patterns
 */
async function deleteBySource(sourcePattern) {
  try {
    console.log(`🗑️  Deleting chunks matching: ${sourcePattern}`);

    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();

    if (!tableNames.includes(TABLE_NAME)) {
      console.log('   ⚠️  No table exists yet');
      return { success: true, deleted: 0 };
    }

    const table = await db.openTable(TABLE_NAME);

    // Build filter - support wildcards by converting to SQL LIKE pattern
    let filter;
    if (sourcePattern.includes('*')) {
      // Convert glob to SQL LIKE: summaries/* -> summaries/%
      const likePattern = sourcePattern.replace(/\*/g, '%');
      filter = `source LIKE '${likePattern}'`;
    } else {
      filter = `source = '${sourcePattern}'`;
    }

    // Count matching rows first
    const beforeCount = await table.countRows();

    // Delete matching rows
    await table.delete(filter);

    const afterCount = await table.countRows();
    const deleted = beforeCount - afterCount;

    console.log(`   ✅ Deleted ${deleted} chunks (${beforeCount} → ${afterCount})`);

    return { success: true, deleted };
  } catch (error) {
    console.error(`❌ Error deleting:`, error.message);
    throw error;
  }
}

/**
 * Assemble rich context from all memory sources for a topic
 */
async function getContextFor(topic, options = {}) {
  const maxChunks = options.maxChunks || 3;
  const includeFacts = options.includeFacts !== false;
  const includeGrep = options.includeGrep || false;
  const parts = [];
  const sources = [];
  let factCount = 0, chunkCount = 0;

  // 1. Vector search
  try {
    const vr = await retrieve(topic, { limit: maxChunks, scoreThreshold: 0.4, _silent: true });
    if (vr.results.length > 0) {
      chunkCount = vr.results.length;
      parts.push('### Memory Chunks\n' + vr.results.map(r => {
        sources.push(r.source);
        return `- **[${r.source}]** ${r.header}: ${r.text.substring(0, 300)}`;
      }).join('\n'));
    }
  } catch {}

  // 2. State.json facts
  if (includeFacts) {
    try {
      const state = JSON.parse(await fs.readFile(path.join(MEMORY_PATH, 'state.json'), 'utf-8'));
      const tl = topic.toLowerCase();
      const matches = Object.entries(state.facts)
        .filter(([k, v]) => k.toLowerCase().includes(tl) || v.value.toLowerCase().includes(tl))
        .slice(0, 5);
      if (matches.length > 0) {
        factCount = matches.length;
        parts.push('### Known Facts\n' + matches.map(([k, v]) => {
          sources.push('state.json');
          return `- **${k}**: ${v.value} _(${v.updatedAt})_`;
        }).join('\n'));
      }
    } catch {}
  }

  // 3. Grep fallback (opt-in)
  if (includeGrep) {
    try {
      const gr = await grepSemanticFiles(topic, 2);
      if (gr.length > 0) {
        parts.push('### Keyword Matches\n' + gr.map(r => {
          sources.push(r.source);
          return `- **[${r.source}]** ${r.header}: ${r.text.substring(0, 200)}`;
        }).join('\n'));
      }
    } catch {}
  }

  const context = parts.length > 0 ? `## Context: ${topic}\n\n${parts.join('\n\n')}` : '';
  return { context, sources: [...new Set(sources)], factCount, chunkCount, isEmpty: parts.length === 0 };
}

/**
 * Compact lessons-learned.md: deduplicate, compress, archive old entries
 * Three-tier design: Active (<14d + CRITICAL/RECURRING) → Archive (themed) → Vector (all)
 * @param {object} options
 * @param {boolean} options.dryRun - Preview without writing
 * @returns {object} { beforeLines, afterLines, archivedCount, mergedCount }
 */
async function compactLessons(options = {}) {
  const dryRun = options.dryRun || false;
  const lessonsFile = path.join(SEMANTIC_PATH, 'lessons-learned.md');
  const archiveFile = path.join(SEMANTIC_PATH, 'lessons-archive.md');

  const content = await fs.readFile(lessonsFile, 'utf-8');
  const lines = content.split('\n');
  const beforeLines = lines.length;

  console.log(`📦 Lessons compaction${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`   📄 Current: ${beforeLines} lines`);

  // Parse into sections by ## date headers
  const sections = [];
  let current = null;
  let preamble = [];

  for (const line of lines) {
    const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      if (current) sections.push(current);
      current = { date: dateMatch[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);

  // Classify: keep (≤14 days or CRITICAL/RECURRING) vs archive
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - 14);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const keepSections = [];
  const archiveSections = [];

  for (const section of sections) {
    const text = section.lines.join('\n');
    const hasCritical = /\[CRITICAL\]/i.test(text);
    const hasRecurring = /\[RECURRING\]/i.test(text);
    const isRecent = section.date >= cutoffStr;

    if (isRecent || hasCritical || hasRecurring) {
      keepSections.push(section);
    } else {
      archiveSections.push(section);
    }
  }

  console.log(`   📊 Keep: ${keepSections.length} sections, Archive: ${archiveSections.length} sections`);

  if (archiveSections.length === 0 && keepSections.length <= 10) {
    console.log(`   ✅ Nothing to compact`);
    return { beforeLines, afterLines: beforeLines, archivedCount: 0, mergedCount: 0 };
  }

  let mergedCount = 0;

  // LLM call to deduplicate + compress kept entries
  if (keepSections.length > 0) {
    const keepText = keepSections.map(s => s.lines.join('\n')).join('\n\n');
    try {
      const dedupePrompt = `You are compacting a lessons-learned file. Merge near-duplicate lessons, tag entries appearing 3+ times as [RECURRING], compress verbose entries to 2-3 bullets. Keep date headers.

INPUT:
${keepText}

Return ONLY the compacted markdown text. Preserve ## date headers and ### topic sub-headers. Keep [CRITICAL] and [RECURRING] tags. Remove true duplicates.`;

      const compacted = await callLLM(dedupePrompt);
      if (compacted && compacted.length > 50) {
        const compactedLines = compacted.split('\n');
        mergedCount = keepSections.reduce((sum, s) => sum + s.lines.length, 0) - compactedLines.length;
        // Re-parse compacted back into sections
        keepSections.length = 0;
        let cur = null;
        for (const line of compactedLines) {
          const dm = line.match(/^## (\d{4}-\d{2}-\d{2})/);
          if (dm) {
            if (cur) keepSections.push(cur);
            cur = { date: dm[1], lines: [line] };
          } else if (cur) {
            cur.lines.push(line);
          }
        }
        if (cur) keepSections.push(cur);
        console.log(`   🔀 LLM merged ${mergedCount > 0 ? mergedCount : 0} lines`);
      }
    } catch (e) {
      console.log(`   ⚠️  LLM dedup skipped: ${e.message}`);
    }
  }

  // LLM call to group archive candidates by theme
  let themedArchive = '';
  if (archiveSections.length > 0) {
    const archiveText = archiveSections.map(s => s.lines.join('\n')).join('\n\n');
    try {
      const themePrompt = `Group these older lessons-learned entries by theme. Create themed sections with ## Theme Name headers. Preserve the individual lessons as bullets. Deduplicate identical lessons.

INPUT:
${archiveText}

Return ONLY the themed markdown. Use ## headers for themes (e.g., ## API & Integration, ## Memory Architecture, ## Process & Communication).`;

      themedArchive = await callLLM(themePrompt);
      if (!themedArchive || themedArchive.length < 50) {
        // Fallback: just concatenate
        themedArchive = archiveText;
      }
    } catch (e) {
      console.log(`   ⚠️  LLM theme grouping skipped: ${e.message}`);
      themedArchive = archiveSections.map(s => s.lines.join('\n')).join('\n\n');
    }
  }

  if (dryRun) {
    const newContent = preamble.join('\n') + '\n\n' + keepSections.map(s => s.lines.join('\n')).join('\n\n');
    const afterLines = newContent.split('\n').length;
    console.log(`   📋 DRY RUN: Would reduce ${beforeLines} → ${afterLines} lines`);
    console.log(`   📋 Would archive ${archiveSections.length} sections to lessons-archive.md`);
    return { beforeLines, afterLines, archivedCount: archiveSections.length, mergedCount: Math.max(0, mergedCount), dryRun: true };
  }

  // Write archive file (append to existing)
  if (themedArchive) {
    const archiveTmp = archiveFile + '.tmp';
    let existingArchive = '';
    try { existingArchive = await fs.readFile(archiveFile, 'utf-8'); } catch {}

    const archiveContent = existingArchive
      ? existingArchive + `\n\n---\n\n# Archived: ${now.toISOString().split('T')[0]}\n\n` + themedArchive
      : `# Lessons Learned Archive\n\n*Auto-archived by compactLessons() — ${now.toISOString()}*\n\n` + themedArchive;

    await fs.writeFile(archiveTmp, archiveContent);
    if (archiveContent.length > 0) {
      await fs.rename(archiveTmp, archiveFile);
      console.log(`   📦 Archive written: ${archiveFile}`);
    }
  }

  // Write new lessons-learned.md (kept + merged entries)
  const lessonsTmp = lessonsFile + '.tmp';
  const newContent = preamble.join('\n') + '\n\n' + keepSections.map(s => s.lines.join('\n')).join('\n\n') + '\n';
  await fs.writeFile(lessonsTmp, newContent);
  if (newContent.length > 0) {
    await fs.rename(lessonsTmp, lessonsFile);
  }

  const afterLines = newContent.split('\n').length;
  console.log(`   ✅ Compacted: ${beforeLines} → ${afterLines} lines`);

  // Re-ingest both files with separate sourceTags
  try {
    await ingest('memory/semantic/lessons-learned.md', { sourceTag: 'memory/semantic/lessons-learned.md@v2' });
    if (themedArchive) {
      await ingest('memory/semantic/lessons-archive.md', { sourceTag: 'memory/semantic/lessons-archive.md' });
    }
    console.log(`   🔄 Re-ingested into vector DB`);
  } catch (e) {
    console.log(`   ⚠️  Re-ingestion failed: ${e.message}`);
  }

  return { beforeLines, afterLines, archivedCount: archiveSections.length, mergedCount: Math.max(0, mergedCount) };
}

/**
 * Clear and rebuild the vector database from semantic files
 */
async function rebuild() {
  try {
    console.log('🔄 Rebuilding vector database...');

    // Remove existing database
    try {
      await fs.rm(DB_PATH, { recursive: true });
      console.log('   Cleared old database');
    } catch (err) {
      // Database might not exist
    }

    // Find all markdown files in semantic directory
    const files = await fs.readdir(SEMANTIC_PATH);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`   Found ${mdFiles.length} files to ingest`);

    for (const file of mdFiles) {
      const filePath = path.join(SEMANTIC_PATH, file);
      await ingest(filePath);
    }

    console.log('   ✅ Rebuild complete');
    return { success: true, filesIngested: mdFiles.length };
  } catch (error) {
    console.error(`❌ Error in rebuild():`, error.message);
    throw error;
  }
}

/**
 * Load a user communication profile from memory/users/{name}.md
 * @param {string} name - User name (case-insensitive, maps to filename)
 * @returns {object} { found, name, content, path }
 */
async function getUserProfile(name) {
  const profilePath = path.join(MEMORY_PATH, 'users', `${name.toLowerCase()}.md`);
  try {
    const content = await fs.readFile(profilePath, 'utf-8');
    return { found: true, name, content, path: profilePath };
  } catch {
    return { found: false, name, content: null, path: profilePath };
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'ingest') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Usage: memory_engine.js ingest <file-path>');
      process.exit(1);
    }
    await ingest(filePath);
  } else if (command === 'retrieve' || command === 'search') {
    const query = args.slice(1).join(' ');
    if (!query) {
      console.error('Usage: memory_engine.js retrieve <query>');
      process.exit(1);
    }
    const result = await retrieve(query);
    console.log('\n📋 Results:');
    result.results.forEach((r, idx) => {
      const tag = r.matchType === 'keyword' ? ' [keyword]' : '';
      console.log(`\n${idx + 1}. [${r.source}] ${r.header} (score: ${r.score.toFixed(3)}${tag})`);
      console.log(`   ${r.text.substring(0, 150)}...`);
    });
  } else if (command === 'context') {
    const topic = args.slice(1).join(' ');
    if (!topic) { console.error('Usage: memory_engine.js context <topic>'); process.exit(1); }
    const result = await getContextFor(topic, { includeGrep: true });
    if (result.isEmpty) console.log(`No context found for: "${topic}"`);
    else { console.log(result.context); console.log(`\nSources: ${result.sources.join(', ')}`); }
  } else if (command === 'related') {
    const entity = args.slice(1).join(' ');
    if (!entity) { console.error('Usage: memory_engine.js related <entity>'); process.exit(1); }
    const result = await getRelated(entity, { depth: 2 });
    if (result.relations.length === 0) console.log(`No relationships for: "${entity}"`);
    else {
      console.log(`🕸️  Relationships for: ${result.entity}\n`);
      result.relations.forEach(r => {
        console.log(`  ${r.hop > 1 ? '→→' : '→'} ${r.from} --[${r.type}]--> ${r.to} (${r.since})`);
      });
    }
  } else if (command === 'dream') {
    const daysBack = parseInt(args[1]) || 1;
    await dream({ daysBack });
  } else if (command === 'rebuild') {
    await rebuild();
  } else if (command === 'delete') {
    const pattern = args[1];
    if (!pattern) {
      console.error('Usage: memory_engine.js delete <source-pattern>');
      console.error('Examples:');
      console.error('  memory_engine.js delete "memory/summaries/*"');
      console.error('  memory_engine.js delete "memory/summaries/2026-02-04-0600.md"');
      process.exit(1);
    }
    await deleteBySource(pattern);
  } else if (command === 'compact-lessons') {
    const dryRun = args.includes('--dry-run');
    const result = await compactLessons({ dryRun });
    if (!dryRun) {
      console.log(`\n📦 Result: ${result.beforeLines} → ${result.afterLines} lines, ${result.archivedCount} sections archived`);
    }
  } else if (command === 'profile') {
    const name = args[1];
    if (!name) { console.error('Usage: memory_engine.js profile <name>'); process.exit(1); }
    const result = await getUserProfile(name);
    if (result.found) {
      console.log(`👤 Profile: ${result.name}\n`);
      console.log(result.content);
    } else {
      console.log(`❌ No profile found for: ${name} (expected: ${result.path})`);
    }
  } else {
    console.log('Flux-Lite Memory Engine');
    console.log('Usage:');
    console.log('  memory_engine.js ingest <file-path>     - Ingest a file into memory');
    console.log('  memory_engine.js retrieve <query>       - Search memory');
    console.log('  memory_engine.js context <topic>        - Assemble context from all sources');
    console.log('  memory_engine.js related <entity>       - Find entity relationships');
    console.log('  memory_engine.js dream [days-back]      - Consolidate episodic → semantic');
    console.log('  memory_engine.js rebuild                - Rebuild vector DB from semantic/');
    console.log('  memory_engine.js delete <pattern>       - Delete chunks by source pattern');
    console.log('  memory_engine.js compact-lessons [--dry-run] - Compact lessons-learned.md');
    console.log('  memory_engine.js profile <name>         - Show user communication profile');
  }
}

// Export for use as module
module.exports = {
  ingest, retrieve, embed, chunkMarkdown, dream, rebuild, deleteBySource,
  grepSemanticFiles, detectContradictions, applyTemporalDecay,
  getContextFor, extractRelationships, getRelated,
  compactLessons, getUserProfile, lockedWriteJSON
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
