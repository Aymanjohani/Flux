#!/usr/bin/env node
/**
 * Personal Morning Briefing (F2b)
 * Sends each team member a personalized DM with their tasks and deals.
 *
 * Cron: 0 5 * * * (5:00 UTC = 8:00 AM Riyadh)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const eb = require('./event-bus');

const WORKSPACE = '/root/.openclaw/workspace';
const TODOIST_TOKEN = (() => {
  try {
    const config = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf-8'));
    return config.env.vars.TODOIST_API_TOKEN || '';
  } catch { return ''; }
})();
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN ||
  (() => { try { return fs.readFileSync(path.join(WORKSPACE, 'config/hubspot-token.txt'), 'utf-8').trim(); } catch { return ''; } })();

const team = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'config/todoist-team.json'), 'utf-8')).team;

const today = new Date();
const dateStr = today.toISOString().split('T')[0];
const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

/**
 * Fetch all overdue + today tasks from Todoist (single API call, cached)
 */
let _taskCache = null;
function fetchAllTasks() {
  if (_taskCache !== null) return _taskCache;
  try {
    const result = execSync(
      `curl -s -H "Authorization: Bearer ${TODOIST_TOKEN}" "https://api.todoist.com/rest/v2/tasks?filter=overdue%20%7C%20today" --max-time 15`,
      { encoding: 'utf8', timeout: 20000 }
    );
    _taskCache = JSON.parse(result);
  } catch (e) {
    console.error('[personal-briefing] Failed to fetch Todoist tasks:', e.message);
    _taskCache = [];
  }
  return _taskCache;
}

/**
 * Get tasks assigned to a specific member
 */
function getTasksForMember(todoistId) {
  const allTasks = fetchAllTasks();
  if (!todoistId) return { overdue: [], today: [] };

  const memberTasks = allTasks.filter(t => t.assignee_id === todoistId);
  const overdue = memberTasks.filter(t => t.due && t.due.date < dateStr);
  const todayTasks = memberTasks.filter(t => !overdue.includes(t));

  return { overdue, today: todayTasks };
}

/**
 * Format a single task line
 */
function formatTask(task) {
  const priority = task.priority > 1 ? ` [P${5 - task.priority}]` : '';
  const dueDate = task.due ? ` (${task.due.date})` : '';
  return `- ${task.content}${priority}${dueDate}`;
}

/**
 * Fetch open deals for a HubSpot owner
 */
function getDealsForOwner(ownerId) {
  if (!HUBSPOT_TOKEN || !ownerId) return [];

  try {
    const body = JSON.stringify({
      filterGroups: [{
        filters: [
          { propertyName: 'hubspot_owner_id', operator: 'EQ', value: ownerId },
          { propertyName: 'dealstage', operator: 'NOT_IN', values: ['closedwon', 'closedlost'] }
        ]
      }],
      properties: ['dealname', 'amount', 'dealstage', 'closedate'],
      sorts: [{ propertyName: 'amount', direction: 'DESCENDING' }],
      limit: 10
    });

    const result = execSync(
      `curl -s -X POST "https://api.hubapi.com/crm/v3/objects/deals/search" -H "Content-Type: application/json" -H "Authorization: Bearer ${HUBSPOT_TOKEN}" -d '${body.replace(/'/g, "'\\''")}' --max-time 15`,
      { encoding: 'utf8', timeout: 20000 }
    );

    const data = JSON.parse(result);
    return data.results || [];
  } catch (e) {
    console.error(`[personal-briefing] HubSpot fetch failed for owner ${ownerId}:`, e.message);
    return [];
  }
}

/**
 * Format a deal line
 */
function formatDeal(deal) {
  const p = deal.properties;
  const amount = p.amount ? `SAR ${Number(p.amount).toLocaleString('en-US')}` : 'SAR ?';
  const closedate = p.closedate ? new Date(p.closedate) : null;
  const urgent = closedate && (closedate - today) < 7 * 86400000 && (closedate - today) >= 0 ? ' (!)' : '';
  return `- ${p.dealname} \u2014 ${amount}${urgent}`;
}

/**
 * Build and send a personal briefing for one member
 */
function briefMember(key, member) {
  const firstName = member.name.split(' ')[0];
  const { overdue, today: todayTasks } = getTasksForMember(member.todoist_id);

  let msg = `Good morning, ${firstName}! Here's your ${dayName} briefing:\n`;

  // Tasks section
  if (member.todoist_id) {
    const totalTasks = overdue.length + todayTasks.length;
    if (totalTasks > 0) {
      msg += `\nTasks: ${overdue.length} overdue, ${todayTasks.length} due today\n`;
      const allTasks = [...overdue, ...todayTasks];
      allTasks.forEach(t => { msg += formatTask(t) + '\n'; });
    } else {
      msg += '\nTasks: All clear!\n';
    }
  }

  // Deals section
  if (member.hubspot_owner_id) {
    const deals = getDealsForOwner(member.hubspot_owner_id);
    if (deals.length > 0) {
      msg += `\nDeals: ${deals.length} active\n`;
      deals.forEach(d => { msg += formatDeal(d) + '\n'; });
    } else {
      msg += '\nDeals: None open\n';
    }
  }

  msg += '\nHave a productive day!';

  // Send DM
  console.log(`[${key}] Sending briefing to ${firstName} (${member.telegram_id})...`);
  const delivered = eb.deliverTelegramDM(member.telegram_id, msg);

  if (delivered) {
    console.log(`[${key}] Delivered.`);
  } else {
    console.error(`[${key}] Failed to deliver DM.`);
  }

  // Audit log
  eb.logEvent('briefing.personal', {
    summary: `Personal briefing for ${firstName}`,
    member: key,
    telegram_id: member.telegram_id,
    tasks: overdue.length + todayTasks.length,
    deals: member.hubspot_owner_id ? 'fetched' : 'n/a',
    delivered
  }, { source: 'personal-briefing.js' });

  return delivered;
}

// Main
console.log(`[personal-briefing] Starting personal briefings for ${dateStr} (${dayName})\n`);

let sent = 0;
let failed = 0;

for (const [key, member] of Object.entries(team)) {
  if (!member.telegram_id) {
    console.log(`[${key}] No telegram_id, skipping.`);
    continue;
  }

  try {
    const ok = briefMember(key, member);
    if (ok) sent++; else failed++;
  } catch (e) {
    console.error(`[${key}] Error: ${e.message}`);
    failed++;
  }

  // 1s delay between sends to avoid Telegram rate limits
  if (Object.keys(team).indexOf(key) < Object.keys(team).length - 1) {
    execSync('sleep 1');
  }
}

console.log(`\n[personal-briefing] Done. Sent: ${sent}, Failed: ${failed}`);
