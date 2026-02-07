#!/usr/bin/env node
/**
 * Accountability Tracker (F5)
 * Analyzes Todoist tasks for compliance: due dates, priorities, team scores
 * Sends report via Telegram, saves detailed report
 *
 * Cron: 0 15 * * 0 (Sunday 3PM UTC = 6PM Riyadh)
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
const REPORTS_DIR = path.join(WORKSPACE, 'reports');
const TEAM_FILE = path.join(WORKSPACE, 'config/todoist-team.json');

const dateStr = new Date().toISOString().split('T')[0];

function sendTelegram(message) {
  if (eb) {
    eb.notify(message, { topic: 'report.accountability', source: 'accountability-check.js' });
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

function main() {
  // Ensure reports directory
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Load team roster
  let team = { members: [] };
  try {
    team = JSON.parse(fs.readFileSync(TEAM_FILE, 'utf-8'));
  } catch (e) {
    console.error('Could not load team roster:', e.message);
  }

  // Get all tasks
  let tasks = [];
  try {
    const raw = execSync('/usr/bin/todoist tasks --all --json', {
      encoding: 'utf8', timeout: 30000
    });
    tasks = JSON.parse(raw);
  } catch (e) {
    // Fallback: try non-json format and count
    try {
      const raw = execSync('/usr/bin/todoist tasks --all', {
        encoding: 'utf8', timeout: 30000
      });
      const lines = raw.trim().split('\n').filter(Boolean);
      // Can't do per-person analysis without JSON, do basic count
      const msg = `\u{1F4CB} Accountability Report \u{2014} ${dateStr}\n\n\u{1F4CA} Total tasks: ${lines.length}\n(Detailed analysis unavailable \u{2014} JSON output not supported)`;
      console.log(msg);
      sendTelegram(msg);
      return;
    } catch (e2) {
      console.error('Could not get tasks:', e2.message);
      process.exit(1);
    }
  }

  const totalTasks = tasks.length;
  const noDueDate = tasks.filter(t => !t.due).length;
  const overdue = tasks.filter(t => {
    if (!t.due || !t.due.date) return false;
    return new Date(t.due.date) < new Date(dateStr);
  }).length;
  const noDuePct = totalTasks > 0 ? Math.round((noDueDate / totalTasks) * 100) : 0;

  // Per-person analysis
  const personStats = {};
  for (const member of (team.members || [])) {
    personStats[member.name] = { total: 0, withDue: 0, withPriority: 0, overdue: 0 };
  }

  for (const task of tasks) {
    const assigneeId = task.responsible_uid || task.creator_id;
    const member = (team.members || []).find(m => String(m.todoist_id) === String(assigneeId));
    const name = member ? member.name : 'Unassigned';

    if (!personStats[name]) personStats[name] = { total: 0, withDue: 0, withPriority: 0, overdue: 0 };
    personStats[name].total++;
    if (task.due) personStats[name].withDue++;
    if (task.priority && task.priority > 1) personStats[name].withPriority++;
    if (task.due && task.due.date && new Date(task.due.date) < new Date(dateStr)) {
      personStats[name].overdue++;
    }
  }

  // Calculate scores: (tasks_with_due / total * 60) + (tasks_with_priority / total * 40)
  const scores = [];
  for (const [name, stats] of Object.entries(personStats)) {
    if (stats.total === 0) continue;
    const dueScore = (stats.withDue / stats.total) * 60;
    const priorityScore = (stats.withPriority / stats.total) * 40;
    const score = Math.round(dueScore + priorityScore);
    const rating = score >= 70 ? 'Good' : score >= 40 ? 'Needs Work' : 'Critical';
    scores.push({ name, score, rating, stats });
  }
  scores.sort((a, b) => b.score - a.score);

  // Telegram message
  const teamScores = scores.map(s => `${s.name}: ${s.score}/100 (${s.rating})`).join('\n');

  const telegram = `\u{1F4CB} Accountability Report \u{2014} ${dateStr}

\u{1F4CA} Total: ${totalTasks} tasks | No due date: ${noDueDate} (${noDuePct}%) | Overdue: ${overdue}

\u{1F465} TEAM SCORES
${teamScores || 'No team data'}

\u{26A0}\u{FE0F} TOP ISSUES
1. ${noDueDate} tasks without due dates
2. ${overdue} overdue tasks`;

  console.log(telegram);
  sendTelegram(telegram);

  // Detailed report
  const detailedScores = scores.map(s =>
    `### ${s.name}\n- Score: ${s.score}/100 (${s.rating})\n- Total: ${s.stats.total} | With due: ${s.stats.withDue} | With priority: ${s.stats.withPriority} | Overdue: ${s.stats.overdue}`
  ).join('\n\n');

  const report = `# Accountability Report — ${dateStr}

## Summary
- **Total Tasks:** ${totalTasks}
- **No Due Date:** ${noDueDate} (${noDuePct}%)
- **Overdue:** ${overdue}

## Team Scores

${detailedScores || 'No team data available'}

---
*Generated by accountability-check.js at ${new Date().toISOString()}*
`;

  const reportFile = path.join(REPORTS_DIR, `accountability-${dateStr}.md`);
  fs.writeFileSync(reportFile, report);
  console.log(`\nReport saved: ${reportFile}`);
}

main();
