#!/usr/bin/env node
/**
 * Set Telegram ID for a team member
 *
 * Usage: node scripts/set-telegram-id.js <member_key> <telegram_id>
 * Example: node scripts/set-telegram-id.js hamad 9876543210
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join('/root/.openclaw/workspace/config/todoist-team.json');

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Usage: node set-telegram-id.js <member_key> <telegram_id>');
  console.error('Example: node set-telegram-id.js hamad 9876543210');
  process.exit(1);
}

const [memberKey, telegramId] = args;

// Validate telegram_id is numeric
if (!/^\d+$/.test(telegramId)) {
  console.error(`Error: telegram_id must be a number, got "${telegramId}"`);
  process.exit(1);
}

// Read config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Validate member key exists
if (!config.team[memberKey]) {
  const validKeys = Object.keys(config.team).join(', ');
  console.error(`Error: member "${memberKey}" not found.`);
  console.error(`Valid keys: ${validKeys}`);
  process.exit(1);
}

const member = config.team[memberKey];
const oldValue = member.telegram_id;

// Update
member.telegram_id = telegramId;

// Write back (pretty-printed, matching original format)
fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');

console.log(`Updated ${memberKey} (${member.name}) telegram_id → ${telegramId}`);
if (oldValue) {
  console.log(`  (was: ${oldValue})`);
}
