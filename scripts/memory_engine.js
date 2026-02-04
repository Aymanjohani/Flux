#!/usr/bin/env node
/**
 * Flux-Lite Memory Engine
 * Serverless vector memory using LanceDB
 */

const fs = require('fs').promises;
const path = require('path');
const lancedb = require('vectordb');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const DB_PATH = path.join(__dirname, '../memory/vector_db');
const MEMORY_PATH = path.join(__dirname, '../memory');
const SEMANTIC_PATH = path.join(MEMORY_PATH, 'semantic');
const TABLE_NAME = 'memory_chunks';

// Initialize Gemini for embeddings only
let genAI;
let embeddingModel;

async function initEmbeddings() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
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
 * Generate embedding vector for text
 */
async function embed(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
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
    lastUpdated: new Date().toISOString()
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
        lastUpdated: chunk.lastUpdated
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
 * Retrieve relevant chunks from the vector database
 */
async function retrieve(query, options = {}) {
  try {
    await initEmbeddings();
    
    const limit = options.limit || 5;
    const scoreThreshold = options.scoreThreshold || 0.5;
    
    console.log(`🔍 Searching for: "${query}"`);
    
    // Generate query embedding
    const queryVector = await embed(query);
    
    // Connect to database
    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();
    
    if (!tableNames.includes(TABLE_NAME)) {
      console.log('   ⚠️  No memory index found');
      return { results: [] };
    }
    
    const table = await db.openTable(TABLE_NAME);
    
    // Perform vector search
    const results = await table
      .search(queryVector)
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
        chunkIndex: r.chunkIndex
      }))
      .filter(r => r.score >= scoreThreshold);
    
    console.log(`   Found ${formattedResults.length} relevant chunks`);
    
    return {
      query,
      results: formattedResults,
      count: formattedResults.length
    };
  } catch (error) {
    console.error(`❌ Error retrieving:`, error.message);
    throw error;
  }
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

    console.log(`   🧠 Analyzing with Gemini Flash...`);

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

    // Write consolidated output to semantic memory
    const consolidatedFile = path.join(SEMANTIC_PATH, `consolidated-${dateStr}.md`);

    let consolidatedContent = `# Consolidated Memory: ${dateStr}\n\n`;
    consolidatedContent += `*Auto-generated by dream() at ${new Date().toISOString()}*\n\n`;

    if (extracted.facts?.length > 0) {
      consolidatedContent += `## Facts\n\n`;
      for (const fact of extracted.facts) {
        consolidatedContent += `- **[${fact.category}]** ${fact.key}: ${fact.value}\n`;
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
      console.log(`\n${idx + 1}. [${r.source}] ${r.header} (score: ${r.score.toFixed(3)})`);
      console.log(`   ${r.text.substring(0, 150)}...`);
    });
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
  } else {
    console.log('Flux-Lite Memory Engine');
    console.log('Usage:');
    console.log('  memory_engine.js ingest <file-path>   - Ingest a file into memory');
    console.log('  memory_engine.js retrieve <query>     - Search memory');
    console.log('  memory_engine.js dream [days-back]    - Consolidate episodic → semantic');
    console.log('  memory_engine.js rebuild              - Rebuild vector DB from semantic/');
    console.log('  memory_engine.js delete <pattern>     - Delete chunks by source pattern');
  }
}

// Export for use as module
module.exports = { ingest, retrieve, embed, chunkMarkdown, dream, rebuild, deleteBySource };

// Run CLI if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
