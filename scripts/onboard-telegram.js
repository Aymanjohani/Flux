#!/usr/bin/env node
/**
 * Telegram Onboarding Email Sender
 * Sends personalized emails to team members who don't have a telegram_id,
 * instructing them how to find their Telegram user ID via @userinfobot.
 *
 * Usage: node scripts/onboard-telegram.js
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const eb = require('./event-bus');

const WORKSPACE = '/root/.openclaw/workspace';
const CONFIG_DIR = path.join(WORKSPACE, 'config');

// Load team config
const teamConfig = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'todoist-team.json'), 'utf-8'));
const team = teamConfig.team;

// Set up Gmail OAuth (same pattern as meetings/2026-02-04/send-email.js)
const credentials = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'google-oauth-credentials.json'), 'utf-8'));
const token = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'google-token.json'), 'utf-8'));

const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oAuth2Client.setCredentials(token);

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

/**
 * Build HTML email body for a team member
 */
function buildEmailHtml(firstName) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

  <div style="background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%); color: white; padding: 32px; border-radius: 8px; margin-bottom: 32px;">
    <h1 style="margin: 0 0 8px 0; font-size: 24px;">Your Personal Morning Briefing</h1>
    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Get your tasks &amp; deals delivered to Telegram at 8 AM daily</p>
  </div>

  <div style="padding: 0 8px;">
    <p>Hi ${firstName},</p>

    <p>I wanted to introduce you to <strong>Flux</strong> — our AI team member who joined IIoT Solutions on January 31st. Flux works alongside us to help with day-to-day operations, and here's what it can do for you:</p>

    <div style="background: #eef3fc; border-radius: 8px; padding: 20px; margin: 16px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1a73e8;">What is Flux?</h3>
      <p style="margin: 0 0 10px 0;">Flux is an AI employee that works 24/7 to keep things running smoothly. It handles:</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;"><strong>Personal Morning Briefings</strong> — Your tasks, deadlines, and deals delivered to your Telegram at 8 AM daily</li>
        <li style="margin-bottom: 6px;"><strong>Task Management</strong> — Tracks Todoist tasks, flags overdue items, and keeps projects on schedule</li>
        <li style="margin-bottom: 6px;"><strong>CRM &amp; Pipeline Updates</strong> — Monitors HubSpot deals and alerts you to stale or high-priority opportunities</li>
        <li style="margin-bottom: 6px;"><strong>Meeting Intelligence</strong> — Joins meetings, transcribes them, extracts action items, and sends summaries</li>
        <li style="margin-bottom: 6px;"><strong>Market Research</strong> — Gathers daily intelligence on the Saudi industrial sector</li>
      </ul>
      <p style="margin: 12px 0 0 0;">You can interact with Flux on Telegram — ask questions, request reports, or get updates on your projects anytime.</p>
    </div>

    <p>To get started, we need to connect your Telegram account. It takes 30 seconds — I just need your Telegram user ID.</p>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1a73e8;">3 Quick Steps (takes 30 seconds)</h3>

      <p style="margin: 0 0 16px 0;">
        <strong>Step 1:</strong> Open Telegram and search for <strong>@userinfobot</strong>, then tap <strong>Start</strong>
      </p>

      <p style="margin: 0 0 16px 0;">
        <strong>Step 2:</strong> The bot instantly replies with your user ID — a number like <code style="background: #e8eaed; padding: 2px 6px; border-radius: 3px;">1186936952</code>
      </p>

      <p style="margin: 0;">
        <strong>Step 3:</strong> Reply to this email with that number
      </p>
    </div>

    <p>That's it! Once I have your ID, you'll start receiving your personal briefing every morning.</p>

    <p style="margin-top: 32px;">
      Thanks,<br>
      <strong>Ayman AlJohani</strong><br>
      <span style="color: #5f6368;">IIoT Solutions</span>
    </p>
  </div>

  <div style="margin-top: 32px; text-align: center; padding: 16px; color: #5f6368; font-size: 12px; border-top: 1px solid #e8eaed;">
    <p style="margin: 0;">Sent by Flux on behalf of Ayman</p>
    <p style="margin: 4px 0 0 0;">IIoT Solutions &bull; Jeddah, Saudi Arabia</p>
  </div>

</body>
</html>`;
}

/**
 * Send a single email via Gmail API
 */
async function sendEmail(toEmail, firstName) {
  const htmlBody = buildEmailHtml(firstName);

  const email = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `To: ${toEmail}`,
    'Cc: ayman@iiotsolutions.sa',
    'From: coding@iiotsolutions.sa',
    `Subject: Set up your personal Telegram briefing (30 seconds)`,
    '',
    htmlBody
  ].join('\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedEmail }
  });

  return result.data.id;
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main: send onboarding emails to all members with telegram_id: null
 */
async function main() {
  // Find members needing onboarding (have email, no telegram_id)
  const toOnboard = [];
  for (const [key, member] of Object.entries(team)) {
    if (member.telegram_id === null && member.email) {
      toOnboard.push({ key, ...member });
    }
  }

  if (toOnboard.length === 0) {
    console.log('All team members already have Telegram IDs. Nothing to do.');
    return;
  }

  console.log(`Sending onboarding emails to ${toOnboard.length} team members...\n`);

  let sent = 0;
  let failed = 0;

  for (const member of toOnboard) {
    const firstName = member.name.split(' ')[0];
    try {
      const msgId = await sendEmail(member.email, firstName);
      console.log(`  [OK] ${member.name} (${member.email}) — Message ID: ${msgId}`);
      sent++;
    } catch (error) {
      console.error(`  [FAIL] ${member.name} (${member.email}) — ${error.message}`);
      failed++;
    }

    // Rate limit: 2-second delay between emails
    if (toOnboard.indexOf(member) < toOnboard.length - 1) {
      await sleep(2000);
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed out of ${toOnboard.length} total.`);

  // Log via event bus
  eb.logEvent('system.onboarding', {
    summary: `Telegram onboarding emails sent: ${sent} ok, ${failed} failed`,
    recipients: toOnboard.map(m => m.key),
    sent,
    failed
  }, { source: 'onboard-telegram' });
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
