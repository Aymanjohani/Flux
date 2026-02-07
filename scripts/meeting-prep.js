#!/usr/bin/env node
/**
 * Meeting Prep Automation (F6)
 * For each of today's calendar events:
 * - Classify internal vs external
 * - For external: search HubSpot companies/deals, scan meeting notes, get memory context
 * - Format briefing and send via Telegram
 *
 * Cron: 35 5 * * * (5:35 UTC = 8:35 AM Riyadh, right after morning briefing)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Event bus (with fallback to direct curl)
let eb;
try {
  eb = require('./event-bus');
} catch (e) {
  console.error('event-bus not available, using direct curl fallback');
}

const WORKSPACE = '/root/.openclaw/workspace';
const GATEWAY_URL = 'http://127.0.0.1:18789';
const TEAM_FILE = path.join(WORKSPACE, 'config/todoist-team.json');
const MEETINGS_DIR = path.join(WORKSPACE, 'meetings');
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN ||
  (() => { try { return fs.readFileSync(path.join(WORKSPACE, 'config/hubspot-token.txt'), 'utf-8').trim(); } catch { return ''; } })();

function sendTelegram(message, companyName) {
  if (eb) {
    const safeName = (companyName || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    eb.notify(message, { topic: `briefing.meeting.${safeName}`, source: 'meeting-prep.js' });
    return;
  }
  try {
    execSync(`curl -s -X POST "${GATEWAY_URL}/api/notify" -H "Content-Type: application/json" -d ${JSON.stringify(JSON.stringify({ message }))} --max-time 10`, {
      encoding: 'utf8', timeout: 15000
    });
  } catch (e) {
    console.error('Telegram send failed:', e.message);
  }
}

// Load team names for internal/external classification
function getTeamNames() {
  try {
    const team = JSON.parse(fs.readFileSync(TEAM_FILE, 'utf-8'));
    return (team.members || []).map(m => m.name.toLowerCase());
  } catch {
    return [];
  }
}

// Get today's calendar events
function getCalendarEvents() {
  try {
    const raw = execSync('python3 /root/.openclaw/workspace/scripts/calendar_summary.py', {
      encoding: 'utf8', timeout: 30000
    });
    return raw.trim().split('\n').filter(Boolean);
  } catch (e) {
    console.error('Calendar fetch failed:', e.message);
    return [];
  }
}

// Search HubSpot companies by name
function searchHubSpotCompany(name) {
  if (!HUBSPOT_TOKEN) return null;
  try {
    const body = JSON.stringify({
      filterGroups: [{
        filters: [{ propertyName: 'name', operator: 'CONTAINS_TOKEN', value: name }]
      }],
      properties: ['name', 'domain', 'industry', 'city', 'phone'],
      limit: 3
    });
    const result = execSync(`curl -s -X POST "https://api.hubapi.com/crm/v3/objects/companies/search" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${HUBSPOT_TOKEN}" \
      -d '${body.replace(/'/g, "'\\''")}' \
      --max-time 15`, { encoding: 'utf8', timeout: 20000 });
    const data = JSON.parse(result);
    return (data.results || []).map(c => c.properties);
  } catch {
    return null;
  }
}

// Search HubSpot deals for company
function searchHubSpotDeals(companyName) {
  if (!HUBSPOT_TOKEN) return [];
  try {
    const body = JSON.stringify({
      filterGroups: [{
        filters: [{ propertyName: 'dealname', operator: 'CONTAINS_TOKEN', value: companyName }]
      }],
      properties: ['dealname', 'amount', 'dealstage', 'closedate'],
      limit: 5
    });
    const result = execSync(`curl -s -X POST "https://api.hubapi.com/crm/v3/objects/deals/search" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${HUBSPOT_TOKEN}" \
      -d '${body.replace(/'/g, "'\\''")}' \
      --max-time 15`, { encoding: 'utf8', timeout: 20000 });
    const data = JSON.parse(result);
    return (data.results || []).map(d => d.properties);
  } catch {
    return [];
  }
}

// Scan meetings directory for previous notes
function findPreviousMeetingNotes(companyName) {
  if (!fs.existsSync(MEETINGS_DIR)) return [];
  try {
    const files = fs.readdirSync(MEETINGS_DIR).filter(f => f.endsWith('.md'));
    const matches = [];
    const searchTerm = companyName.toLowerCase();
    for (const file of files) {
      if (file.toLowerCase().includes(searchTerm)) {
        matches.push(file);
      } else {
        // Check content
        try {
          const content = fs.readFileSync(path.join(MEETINGS_DIR, file), 'utf-8');
          if (content.toLowerCase().includes(searchTerm)) {
            matches.push(file);
          }
        } catch {}
      }
    }
    return matches.slice(0, 3);
  } catch {
    return [];
  }
}

// Get memory context via memory_engine
function getMemoryContext(topic) {
  try {
    const raw = execSync(`node /root/.openclaw/workspace/scripts/memory_engine.js context "${topic.replace(/"/g, '')}"`, {
      encoding: 'utf8', timeout: 30000,
      env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY || getOpenAIKey() }
    });
    return raw.trim();
  } catch {
    return '';
  }
}

function getOpenAIKey() {
  try {
    const config = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf-8'));
    return config.env?.vars?.OPENAI_API_KEY || '';
  } catch {
    return '';
  }
}

// Extract company name from event summary (best-effort)
function extractCompanyName(eventSummary) {
  // Remove common prefixes/suffixes
  let name = eventSummary
    .replace(/^(meeting|call|sync|review|discussion|catch[- ]?up|intro)\s*(with|:|-)\s*/i, '')
    .replace(/\s*(meeting|call|sync|review|discussion)$/i, '')
    .trim();

  // Take first meaningful word/phrase (before "re:", "about", etc.)
  name = name.replace(/\s*(re:|about|regarding|for)\s*.*/i, '').trim();

  return name || eventSummary;
}

function main() {
  const events = getCalendarEvents();
  if (events.length === 0) {
    console.log('No meetings today.');
    return;
  }

  const teamNames = getTeamNames();
  let preppedCount = 0;

  for (const event of events) {
    // Check if internal: event mentions a team member name
    const eventLower = event.toLowerCase();
    const isInternal = teamNames.some(name => eventLower.includes(name));

    if (isInternal) {
      console.log(`[Internal] ${event} — skipping prep`);
      continue;
    }

    // External meeting — prepare briefing
    const companyName = extractCompanyName(event);
    console.log(`\n[External] ${event} → Company: "${companyName}"`);

    let briefing = `\u{1F4C4} Meeting Prep: ${event}\n`;

    // HubSpot company info
    const companies = searchHubSpotCompany(companyName);
    if (companies && companies.length > 0) {
      const c = companies[0];
      briefing += `\n\u{1F3E2} Company: ${c.name || companyName}`;
      if (c.industry) briefing += ` | Industry: ${c.industry}`;
      if (c.city) briefing += ` | City: ${c.city}`;
      briefing += '\n';
    }

    // HubSpot deals
    const deals = searchHubSpotDeals(companyName);
    if (deals.length > 0) {
      briefing += `\n\u{1F4B0} Active Deals:\n`;
      for (const d of deals) {
        briefing += `- ${d.dealname} (SAR ${d.amount || '?'}, stage: ${d.dealstage || '?'})\n`;
      }
    }

    // Previous meeting notes
    const prevNotes = findPreviousMeetingNotes(companyName);
    if (prevNotes.length > 0) {
      briefing += `\n\u{1F4DD} Previous Meetings: ${prevNotes.join(', ')}\n`;
    }

    // Memory context
    const memContext = getMemoryContext(companyName);
    if (memContext && !memContext.includes('No context found')) {
      briefing += `\n\u{1F9E0} Memory Context:\n${memContext.substring(0, 500)}\n`;
    }

    console.log(briefing);
    sendTelegram(briefing, companyName);
    preppedCount++;
  }

  if (preppedCount === 0) {
    console.log('No external meetings to prep.');
  } else {
    console.log(`\nSent ${preppedCount} meeting prep briefings.`);
  }
}

main();
