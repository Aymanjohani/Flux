#!/usr/bin/env node
/**
 * Session Cleanup Script
 *
 * Deletes stale hook/cron sessions, prunes old archived transcripts,
 * and reports orphaned JSONL files.
 *
 * Usage:
 *   node scripts/session-cleanup.js [--dry-run]
 *
 * Designed for system crontab (not OpenClaw cron, which would create
 * its own sessions to clean up).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---

const SESSIONS_DIR = '/root/.openclaw/agents/main/sessions';
const PRUNE_DELETED_AFTER_DAYS = 7;
const EXECUTION_TIMEOUT_MS = 60000;

// Idle thresholds (most specific prefix wins)
const THRESHOLDS = [
  { prefix: 'hook:gmail:',  ms: 1 * 3600000, label: 'hook:gmail' },
  { prefix: 'hook:',        ms: 2 * 3600000, label: 'hook' },
  { prefix: 'cron:',        ms: 6 * 3600000, label: 'cron' },
];

// Sessions matching these patterns are never deleted
const SAFE_PATTERNS = [
  /^agent:.*:main$/,
  /telegram:dm:/,
  /telegram:group:/,
];

const DRY_RUN = process.argv.includes('--dry-run');
const PREFIX = '[session-cleanup]';

// --- Event bus (optional, best-effort) ---

let logEvent;
try {
  logEvent = require('./event-bus').logEvent;
} catch {
  logEvent = () => {};
}

// --- Helpers ---

function log(msg) {
  console.log(`${PREFIX} ${msg}`);
}

function warn(msg) {
  console.warn(`${PREFIX} WARN: ${msg}`);
}

/**
 * Call a gateway RPC method, return parsed JSON or null on failure.
 */
function gatewayCall(method, params = {}) {
  try {
    const paramsJson = JSON.stringify(params);
    const out = execSync(
      `openclaw gateway call ${method} --params '${paramsJson}' --json --timeout 15000`,
      { encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return JSON.parse(out.trim());
  } catch (e) {
    warn(`gateway call ${method} failed: ${e.message}`);
    return null;
  }
}

/**
 * Classify a session key. Returns { action, threshold, label } or null for safe.
 */
function classifySession(key) {
  // Strip the agent:main: prefix that the gateway prepends for matching
  const normalized = key.replace(/^agent:main:/, '');

  // Check safe patterns first (on full key)
  for (const pat of SAFE_PATTERNS) {
    if (pat.test(key)) return { action: 'keep' };
  }

  // Match thresholds (most specific prefix first — array is ordered)
  for (const t of THRESHOLDS) {
    if (normalized.startsWith(t.prefix)) {
      return { action: 'delete-if-stale', threshold: t.ms, label: t.label };
    }
  }

  return { action: 'unknown' };
}

// --- Phase 1: Delete stale sessions ---

async function deleteStaleSessionsPhase() {
  const result = gatewayCall('sessions.list');
  if (!result || !result.sessions) {
    warn('Could not list sessions, skipping phase 1');
    return { checked: 0, deleted: 0, breakdown: {}, sessions: [] };
  }

  const sessions = result.sessions;
  const now = Date.now();
  let deleted = 0;
  const breakdown = {};

  for (const s of sessions) {
    const cls = classifySession(s.key);

    if (cls.action === 'keep') continue;

    if (cls.action === 'unknown') {
      warn(`Unknown session pattern: ${s.key}`);
      logEvent('system.session-cleanup.unknown', {
        summary: `Unknown session pattern: ${s.key}`,
        session_key: s.key,
      }, { source: 'session-cleanup' });
      continue;
    }

    // action === 'delete-if-stale'
    const idle = now - s.updatedAt;
    if (idle < cls.threshold) continue;

    const idleMinutes = Math.round(idle / 60000);

    if (DRY_RUN) {
      log(`[dry-run] Would delete: ${s.key} (idle ${idleMinutes}m, threshold ${cls.threshold / 3600000}h)`);
    } else {
      const delResult = gatewayCall('sessions.delete', { key: s.key });
      if (delResult && delResult.ok) {
        log(`Deleted: ${s.key} (idle ${idleMinutes}m)`);
      } else {
        warn(`Failed to delete: ${s.key}`);
        continue; // Don't count as deleted
      }
    }

    deleted++;
    breakdown[cls.label] = (breakdown[cls.label] || 0) + 1;
  }

  return { checked: sessions.length, deleted, breakdown, sessions };
}

// --- Phase 2: Prune old archived transcripts ---

function pruneArchivedTranscriptsPhase() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    warn(`Sessions directory not found: ${SESSIONS_DIR}`);
    return 0;
  }

  const files = fs.readdirSync(SESSIONS_DIR);
  const now = Date.now();
  const maxAge = PRUNE_DELETED_AFTER_DAYS * 24 * 3600000;
  let pruned = 0;

  for (const f of files) {
    // Match *.jsonl.deleted.* pattern
    if (!f.includes('.jsonl.deleted.')) continue;

    const fullPath = path.join(SESSIONS_DIR, f);
    try {
      const stat = fs.statSync(fullPath);
      const age = now - stat.mtimeMs;
      if (age > maxAge) {
        if (DRY_RUN) {
          log(`[dry-run] Would prune: ${f} (${Math.round(age / 86400000)}d old)`);
        } else {
          fs.unlinkSync(fullPath);
          log(`Pruned: ${f}`);
        }
        pruned++;
      }
    } catch (e) {
      warn(`Error checking ${f}: ${e.message}`);
    }
  }

  return pruned;
}

// --- Phase 3: Report orphaned JSONL files ---

function reportOrphanedFilesPhase(activeSessions) {
  if (!fs.existsSync(SESSIONS_DIR)) return 0;

  // Build set of active session IDs
  const activeIds = new Set(activeSessions.map(s => s.sessionId));

  const files = fs.readdirSync(SESSIONS_DIR);
  let orphans = 0;

  for (const f of files) {
    // Only check plain *.jsonl files (not .deleted.*, .gz, sessions.json, etc.)
    if (!f.endsWith('.jsonl')) continue;

    // Extract UUID from filename (e.g. "092f5cc7-af04-4708-9648-8ccd1ab4fe53.jsonl")
    const id = f.replace('.jsonl', '');
    if (!activeIds.has(id)) {
      orphans++;
    }
  }

  return orphans;
}

// --- Main ---

async function main() {
  const startTime = Date.now();

  // Set execution timeout
  const timer = setTimeout(() => {
    warn('Execution timeout (60s) reached, aborting');
    process.exit(1);
  }, EXECUTION_TIMEOUT_MS);

  if (DRY_RUN) log('--- DRY RUN MODE ---');

  // Phase 1
  const phase1 = await deleteStaleSessionsPhase();
  const breakdownStr = Object.entries(phase1.breakdown)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ') || 'none';

  log(`Checked ${phase1.checked} sessions, deleted ${phase1.deleted} stale (${breakdownStr})`);

  // Phase 2
  const pruned = pruneArchivedTranscriptsPhase();
  log(`Pruned ${pruned} archived transcripts (>${PRUNE_DELETED_AFTER_DAYS}d)`);

  // Phase 3
  const orphans = reportOrphanedFilesPhase(phase1.sessions);
  log(`Found ${orphans} orphan JSONL files (report only)`);

  // Log summary to event bus
  const elapsed = Date.now() - startTime;
  const summary = `Cleanup: ${phase1.deleted} deleted, ${pruned} pruned, ${orphans} orphans (${elapsed}ms)`;

  logEvent('system.session-cleanup', {
    summary,
    dry_run: DRY_RUN,
    sessions_checked: phase1.checked,
    sessions_deleted: phase1.deleted,
    breakdown: phase1.breakdown,
    transcripts_pruned: pruned,
    orphan_files: orphans,
    elapsed_ms: elapsed,
  }, { source: 'session-cleanup' });

  clearTimeout(timer);
}

main().catch(e => {
  console.error(`${PREFIX} Fatal error: ${e.message}`);
  process.exit(1);
});
