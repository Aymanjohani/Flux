#!/usr/bin/env node
/**
 * Event Bus Abstraction Layer (E1)
 * Thin event abstraction over filesystem + gateway.
 * Swappable to NATS/Redis/MQTT later without changing callers.
 *
 * Methods:
 *   publish(topic, payload, options)  - log + route to gateway
 *   subscribe(topic, handler)         - for long-running services (future)
 *   notify(message, options)          - shorthand: publish + Telegram delivery
 *   logEvent(topic, payload)          - append to event log only (no delivery)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const GATEWAY_URL = 'http://127.0.0.1:18789';
const EVENTS_DIR = path.join(WORKSPACE, 'memory/events');
const REPORTS_DIR = path.join(WORKSPACE, 'reports');

// Ensure events directory exists
if (!fs.existsSync(EVENTS_DIR)) {
  fs.mkdirSync(EVENTS_DIR, { recursive: true });
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Append a JSON line to the event log for today
 */
function appendEventLog(entry) {
  const logFile = path.join(EVENTS_DIR, `${todayStr()}.jsonl`);
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(logFile, line);
}

/**
 * Append a JSON line to the failed event log for today
 */
function appendFailedLog(entry) {
  const logFile = path.join(EVENTS_DIR, `failed-${todayStr()}.jsonl`);
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(logFile, line);
}

/**
 * Send a message to Telegram via the gateway
 * Returns true on success, false on failure
 */
function deliverTelegram(message) {
  const payload = JSON.stringify({ message });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      execSync(
        `curl -s -X POST "${GATEWAY_URL}/api/notify" -H "Content-Type: application/json" -d ${JSON.stringify(payload)} --max-time 10`,
        { encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return true;
    } catch (e) {
      if (attempt === 0) {
        // Retry after 2 seconds
        execSync('sleep 2');
      }
    }
  }
  return false;
}

/**
 * Send a DM to a specific Telegram user via Bot API
 * @param {string} chatId - Telegram user chat ID
 * @param {string} message - Message text to send
 * @returns {boolean} true on success, false on failure
 */
function deliverTelegramDM(chatId, message) {
  let botToken;
  try {
    const config = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf-8'));
    botToken = config.channels.telegram.botToken;
  } catch (e) {
    console.error('[event-bus] Failed to read bot token:', e.message);
    return false;
  }

  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      execSync(
        `curl -s -X POST "https://api.telegram.org/bot${botToken}/sendMessage" -H "Content-Type: application/json" -d ${JSON.stringify(payload)} --max-time 10`,
        { encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return true;
    } catch (e) {
      if (attempt === 0) {
        execSync('sleep 2');
      }
    }
  }
  return false;
}

/**
 * Determine routing action based on topic prefix
 * @param {string} topic
 * @returns {string} 'notify' | 'notify+save' | 'log'
 */
function routeByTopic(topic) {
  if (topic.startsWith('alert.')) return 'notify';
  if (topic.startsWith('report.')) return 'notify+save';
  if (topic.startsWith('briefing.')) return 'notify';
  if (topic.startsWith('email.urgent')) return 'notify';
  if (topic.startsWith('email.')) return 'log';
  if (topic.startsWith('memory.')) return 'log';
  if (topic.startsWith('system.')) return 'log';
  // Default: notify
  return 'notify';
}

/**
 * Publish an event to the bus.
 * Logs the event, then routes based on topic prefix.
 *
 * @param {string} topic - Dotted topic name (e.g. 'briefing.daily')
 * @param {object} payload - Event data
 * @param {object} [options] - Optional settings
 * @param {string} [options.source] - Source script name
 * @param {string} [options.message] - Human-readable message for Telegram delivery
 */
function publish(topic, payload, options = {}) {
  const ts = new Date().toISOString();
  const source = options.source || '';
  const summary = payload.summary || options.message || '';

  const entry = { ts, topic, summary, source, payload };

  // Always log
  appendEventLog(entry);

  // Route
  const route = routeByTopic(topic);

  if (route === 'notify' || route === 'notify+save') {
    const message = options.message || summary || JSON.stringify(payload).substring(0, 500);
    const delivered = deliverTelegram(message);
    if (!delivered) {
      appendFailedLog({ ...entry, reason: 'delivery_failed' });
      console.error(`[event-bus] Failed to deliver: ${topic}`);
    }
  }

  if (route === 'notify+save' && options.reportContent) {
    // Save report file
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    const reportFile = path.join(REPORTS_DIR, `${topic.replace(/\./g, '-')}-${todayStr()}.md`);
    fs.writeFileSync(reportFile, options.reportContent);
  }
}

/**
 * Subscribe to a topic (future: for long-running services).
 * Currently stores handlers in-memory for local pub/sub within same process.
 */
const _handlers = {};

function subscribe(topic, handler) {
  if (!_handlers[topic]) _handlers[topic] = [];
  _handlers[topic].push(handler);
}

/**
 * Shorthand: publish + Telegram delivery.
 * Always sends to Telegram regardless of topic routing rules.
 *
 * @param {string} message - The message to send
 * @param {object} [options] - Optional settings
 * @param {string} [options.topic] - Event topic (default: 'system.notify')
 * @param {string} [options.source] - Source script name
 */
function notify(message, options = {}) {
  const topic = options.topic || 'system.notify';
  const ts = new Date().toISOString();
  const source = options.source || '';

  const entry = { ts, topic, summary: message.substring(0, 200), source };
  appendEventLog(entry);

  const delivered = deliverTelegram(message);
  if (!delivered) {
    appendFailedLog({ ...entry, reason: 'delivery_failed' });
    console.error(`[event-bus] Failed to notify: ${topic}`);
  }
}

/**
 * Append to event log only (no delivery).
 *
 * @param {string} topic - Event topic
 * @param {object} payload - Event data
 * @param {object} [options] - Optional settings
 * @param {string} [options.source] - Source script name
 */
function logEvent(topic, payload, options = {}) {
  const ts = new Date().toISOString();
  const source = options.source || '';
  const summary = payload.summary || '';

  appendEventLog({ ts, topic, summary, source, payload });
}

// Export as module
module.exports = { publish, subscribe, notify, logEvent, deliverTelegramDM };

// CLI usage: node event-bus.js notify "test message"
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'notify') {
    const msg = args.slice(1).join(' ') || 'Event bus test';
    notify(msg, { topic: 'system.test', source: 'event-bus-cli' });
    console.log('Sent:', msg);
  } else if (cmd === 'log') {
    const topic = args[1] || 'system.test';
    const msg = args.slice(2).join(' ') || 'test log entry';
    logEvent(topic, { summary: msg }, { source: 'event-bus-cli' });
    console.log('Logged:', topic, msg);
  } else {
    console.log('Event Bus CLI');
    console.log('  node event-bus.js notify <message>');
    console.log('  node event-bus.js log <topic> <message>');
  }
}
