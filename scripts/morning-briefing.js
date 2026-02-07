#!/usr/bin/env node
/**
 * Morning Briefing Assembler (F2)
 * Gathers Calendar, Todoist, HubSpot, Gmail, LinkedIn data
 * Sends formatted daily briefing via Telegram gateway
 *
 * Cron: 30 5 * * * (5:30 UTC = 8:30 AM Riyadh)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
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
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN ||
  (() => { try { return fs.readFileSync(path.join(WORKSPACE, 'config/hubspot-token.txt'), 'utf-8').trim(); } catch { return ''; } })();

const today = new Date();
const dateStr = today.toISOString().split('T')[0];
const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

function sendTelegram(message) {
  if (eb) {
    eb.notify(message, { topic: 'briefing.daily', source: 'morning-briefing.js' });
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

// 1. Calendar
function getCalendar() {
  try {
    const raw = execSync('python3 /root/.openclaw/workspace/scripts/calendar_summary.py', {
      encoding: 'utf8', timeout: 30000
    });
    const lines = raw.trim().split('\n').filter(Boolean).slice(0, 5);
    return { count: lines.length, items: lines };
  } catch (e) {
    return { count: 0, items: ['(Calendar unavailable)'], error: true };
  }
}

// 2. Todoist
function getTodoist() {
  try {
    const raw = execSync('/usr/bin/todoist tasks -f "overdue | today"', {
      encoding: 'utf8', timeout: 15000
    });
    const lines = raw.trim().split('\n').filter(Boolean);
    const overdue = lines.filter(l => /overdue/i.test(l)).length;
    const todayCount = lines.length - overdue;
    return { overdue, today: todayCount, items: lines.slice(0, 5) };
  } catch (e) {
    return { overdue: 0, today: 0, items: ['(Todoist unavailable)'], error: true };
  }
}

// 3. HubSpot stale deals
function getHubSpotStale() {
  if (!HUBSPOT_TOKEN) return { count: 0, items: ['(HubSpot unavailable — no token)'], error: true };

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const body = JSON.stringify({
      filterGroups: [{
        filters: [
          { propertyName: 'hs_lastmodifieddate', operator: 'LT', value: sevenDaysAgo },
          { propertyName: 'dealstage', operator: 'NOT_IN', values: ['closedwon', 'closedlost'] }
        ]
      }],
      properties: ['dealname', 'amount', 'dealstage', 'hs_lastmodifieddate'],
      limit: 10
    });

    const result = execSync(`curl -s -X POST "https://api.hubapi.com/crm/v3/objects/deals/search" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${HUBSPOT_TOKEN}" \
      -d '${body.replace(/'/g, "'\\''")}' \
      --max-time 15`, { encoding: 'utf8', timeout: 20000 });

    const data = JSON.parse(result);
    const deals = (data.results || []).map(d => {
      const p = d.properties;
      return `${p.dealname} (SAR ${p.amount || '?'})`;
    });
    return { count: deals.length, items: deals.slice(0, 3) };
  } catch (e) {
    return { count: 0, items: ['(HubSpot unavailable)'], error: true };
  }
}

// 4. Gmail
function getGmail() {
  try {
    const raw = execSync('python3 /root/.openclaw/workspace/scripts/gmail_summary.py', {
      encoding: 'utf8', timeout: 30000
    });
    const lines = raw.trim().split('\n').filter(Boolean).slice(0, 3);
    return { count: lines.length, items: lines };
  } catch (e) {
    return { count: 0, items: ['(Gmail unavailable)'], error: true };
  }
}

// 5. LinkedIn
function getLinkedIn() {
  try {
    const intelFile = path.join(WORKSPACE, `skills/linkedin-intel/output/${dateStr}-intel.md`);
    if (!fs.existsSync(intelFile)) return { summary: 'No report today' };
    const content = fs.readFileSync(intelFile, 'utf-8');
    const lines = content.trim().split('\n').slice(0, 10).join('\n');
    return { summary: lines || 'No report today' };
  } catch (e) {
    return { summary: 'No report today' };
  }
}

// Assemble briefing
const cal = getCalendar();
const tasks = getTodoist();
const pipeline = getHubSpotStale();
const gmail = getGmail();
const linkedin = getLinkedIn();

const briefing = `\u{1F305} Daily Briefing \u{2014} ${dateStr} (${dayName})

\u{1F4C5} CALENDAR: ${cal.count} events
${cal.items.join('\n')}

\u{2705} TASKS: ${tasks.overdue} overdue, ${tasks.today} due today
${tasks.items.join('\n')}

\u{1F4CA} PIPELINE: ${pipeline.count} stale deals (>7d)
${pipeline.items.join('\n')}

\u{1F4E7} INBOX: ${gmail.count} recent
${gmail.items.join('\n')}

\u{1F50D} LINKEDIN: ${linkedin.summary}`;

console.log(briefing);
sendTelegram(briefing);
console.log('\nBriefing sent to Telegram.');
