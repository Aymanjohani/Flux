#!/usr/bin/env node
/**
 * Deal/Pipeline Watchdog (F3)
 * Queries HubSpot API for deal health monitoring
 * Classifies: stale, no next step, missing amount, unassigned, lost no post-mortem
 * Sends weekly report via Telegram, saves detailed report
 *
 * Cron: 0 3 * * 1 (3:00 UTC Monday = 6:00 AM Riyadh)
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
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN ||
  (() => { try { return fs.readFileSync(path.join(WORKSPACE, 'config/hubspot-token.txt'), 'utf-8').trim(); } catch { return ''; } })();

const dateStr = new Date().toISOString().split('T')[0];

function sendTelegram(message) {
  if (eb) {
    eb.notify(message, { topic: 'report.pipeline', source: 'pipeline-watchdog.js' });
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

function hubspotSearch(body) {
  const bodyStr = JSON.stringify(body);
  const result = execSync(`curl -s -X POST "https://api.hubapi.com/crm/v3/objects/deals/search" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${HUBSPOT_TOKEN}" \
    -d '${bodyStr.replace(/'/g, "'\\''")}' \
    --max-time 20`, { encoding: 'utf8', timeout: 25000 });
  return JSON.parse(result);
}

function main() {
  if (!HUBSPOT_TOKEN) {
    console.error('No HUBSPOT_ACCESS_TOKEN available');
    process.exit(1);
  }

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const DEAL_PROPS = ['dealname', 'amount', 'dealstage', 'hs_lastmodifieddate', 'hubspot_owner_id', 'hs_next_step', 'closedate'];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // 1. Open deals (not closedwon/closedlost)
  let openDeals = [];
  try {
    const data = hubspotSearch({
      filterGroups: [{
        filters: [
          { propertyName: 'dealstage', operator: 'NOT_IN', values: ['closedwon', 'closedlost'] }
        ]
      }],
      properties: DEAL_PROPS,
      limit: 100
    });
    openDeals = data.results || [];
  } catch (e) {
    console.error('Failed to fetch open deals:', e.message);
    process.exit(1);
  }

  // 2. Classify
  const stale = [];
  const noNextStep = [];
  const missingAmount = [];
  const unassigned = [];

  for (const deal of openDeals) {
    const p = deal.properties;
    const lastMod = new Date(p.hs_lastmodifieddate);
    const isStale = lastMod < new Date(sevenDaysAgo);
    const name = p.dealname || 'Unnamed';

    if (isStale) stale.push(name);
    if (!p.hs_next_step || p.hs_next_step.trim() === '') noNextStep.push(name);
    if (!p.amount || parseFloat(p.amount) === 0) missingAmount.push(name);
    if (!p.hubspot_owner_id) unassigned.push(name);
  }

  // 3. Closed-lost analysis
  let lostNoPostMortem = [];
  try {
    const lostData = hubspotSearch({
      filterGroups: [{
        filters: [
          { propertyName: 'dealstage', operator: 'EQ', value: 'closedlost' }
        ]
      }],
      properties: ['dealname', 'notes_last_updated'],
      limit: 50
    });
    for (const deal of (lostData.results || [])) {
      const p = deal.properties;
      if (!p.notes_last_updated) lostNoPostMortem.push(p.dealname || 'Unnamed');
    }
  } catch (e) {
    console.log('Lost deals analysis skipped:', e.message);
  }

  // 4. Metrics
  const totalPipeline = openDeals.reduce((sum, d) => sum + (parseFloat(d.properties.amount) || 0), 0);
  const dealCount = openDeals.length;
  const staleRate = dealCount > 0 ? Math.round((stale.length / dealCount) * 100) : 0;

  // Health score: 100 - penalties
  let healthScore = 100;
  healthScore -= staleRate; // -1 per stale %
  healthScore -= noNextStep.length * 3; // -3 per deal with no next step
  healthScore -= missingAmount.length * 2; // -2 per deal with no amount
  healthScore -= unassigned.length * 5; // -5 per unassigned deal
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Telegram message
  const telegram = `\u{1F4CA} Weekly Pipeline \u{2014} ${dateStr}

\u{1F4B0} Pipeline: SAR ${totalPipeline.toLocaleString()} (${dealCount} deals)
\u{1F4C8} Health: ${healthScore}/100

\u{26A0}\u{FE0F} STALE (${stale.length}): ${stale.slice(0, 5).join(', ') || 'None'}
\u{274C} NO NEXT STEP (${noNextStep.length}): ${noNextStep.slice(0, 5).join(', ') || 'None'}
\u{1F4B8} NO AMOUNT (${missingAmount.length}): ${missingAmount.slice(0, 5).join(', ') || 'None'}
\u{1F4CB} LOST NO POST-MORTEM (${lostNoPostMortem.length}): ${lostNoPostMortem.slice(0, 5).join(', ') || 'None'}`;

  console.log(telegram);
  sendTelegram(telegram);

  // Detailed report
  const report = `# Pipeline Report — ${dateStr}

## Summary
- **Total Pipeline Value:** SAR ${totalPipeline.toLocaleString()}
- **Deal Count:** ${dealCount}
- **Stale Rate:** ${staleRate}%
- **Health Score:** ${healthScore}/100

## Stale Deals (>7 days no update): ${stale.length}
${stale.map(d => `- ${d}`).join('\n') || '- None'}

## No Next Step: ${noNextStep.length}
${noNextStep.map(d => `- ${d}`).join('\n') || '- None'}

## Missing Amount: ${missingAmount.length}
${missingAmount.map(d => `- ${d}`).join('\n') || '- None'}

## Unassigned: ${unassigned.length}
${unassigned.map(d => `- ${d}`).join('\n') || '- None'}

## Closed-Lost Without Post-Mortem: ${lostNoPostMortem.length}
${lostNoPostMortem.map(d => `- ${d}`).join('\n') || '- None'}

---
*Generated by pipeline-watchdog.js at ${new Date().toISOString()}*
`;

  const reportFile = path.join(REPORTS_DIR, `pipeline-report-${dateStr}.md`);
  fs.writeFileSync(reportFile, report);
  console.log(`\nReport saved: ${reportFile}`);
}

main();
