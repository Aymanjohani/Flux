#!/usr/bin/env node
/**
 * Token Threshold Monitor Test Runner
 * 
 * Tests the threshold monitoring system with synthetic data
 */

const { monitor, THRESHOLDS } = require('./monitor');
const { generateTestConversation, scenarios } = require('./test-harness');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

/**
 * Test Case: Threshold Detection
 */
async function testThresholdDetection() {
  log(colors.blue, '\n═══ Test: Threshold Detection ═══\n');
  
  const testCases = [
    { name: 'Below threshold', tokens: 40000, expectedWarnings: 0 },
    { name: 'Warning threshold', tokens: 60000, expectedWarnings: 1 },
    { name: 'Alert threshold', tokens: 110000, expectedWarnings: 2 },
    { name: 'Critical threshold', tokens: 145000, expectedWarnings: 3 },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const sessionKey = `test-${test.name.replace(/\s+/g, '-')}`;
    const conversation = generateTestConversation(test.tokens);
    
    // Convert to messages format
    const messages = conversation.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const result = await monitor.checkTokens(sessionKey, messages);
    
    const warningsCount = result.warnings.length;
    const success = warningsCount === test.expectedWarnings;
    
    if (success) {
      log(colors.green, `✓ ${test.name}: ${warningsCount} warnings (expected ${test.expectedWarnings})`);
      passed++;
    } else {
      log(colors.red, `✗ ${test.name}: ${warningsCount} warnings (expected ${test.expectedWarnings})`);
      failed++;
    }
    
    // Show warnings if any
    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        log(colors.gray, `  [${warning.level}] ${warning.text.split('\n')[0]}`);
      }
    }
  }
  
  log(colors.blue, `\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Test Case: Progressive Token Growth
 */
async function testProgressiveGrowth() {
  log(colors.blue, '\n═══ Test: Progressive Token Growth ═══\n');
  
  const sessionKey = 'test-progressive';
  const steps = [
    { tokens: 30000, name: 'Initial' },
    { tokens: 55000, name: 'After work (50k+)' },
    { tokens: 75000, name: 'Continued work' },
    { tokens: 105000, name: 'Heavy session (100k+)' },
    { tokens: 125000, name: 'More work' },
    { tokens: 142000, name: 'Approaching critical (140k+)' },
  ];
  
  log(colors.gray, 'Simulating token growth over time...\n');
  
  for (const step of steps) {
    const conversation = generateTestConversation(step.tokens);
    const messages = conversation.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const result = await monitor.checkTokens(sessionKey, messages);
    
    const percent = ((result.currentTokens / 200000) * 100).toFixed(1);
    const color = result.warnings.length > 0 ? colors.yellow : colors.green;
    
    log(color, `${step.name}: ${result.currentTokens.toLocaleString()} tokens (${percent}%) - ${result.warnings.length} warnings`);
    
    if (result.warnings.length > 0) {
      const levels = result.warnings.map(w => w.level).join(', ');
      log(colors.gray, `  Triggered: ${levels}`);
    }
  }
  
  return true;
}

/**
 * Test Case: Session State Persistence
 */
async function testSessionState() {
  log(colors.blue, '\n═══ Test: Session State Persistence ═══\n');
  
  const sessionKey = 'test-state';
  
  // First check at 60k
  log(colors.gray, 'First check at 60k tokens...');
  const conv1 = generateTestConversation(60000);
  const msgs1 = conv1.messages.map(m => ({ role: m.role, content: m.content }));
  const result1 = await monitor.checkTokens(sessionKey, msgs1);
  
  log(colors.green, `✓ Warnings: ${result1.warnings.length} (should be 1)`);
  
  // Second check at 65k (should NOT re-trigger warning)
  log(colors.gray, 'Second check at 65k tokens (should not re-trigger)...');
  const conv2 = generateTestConversation(65000);
  const msgs2 = conv2.messages.map(m => ({ role: m.role, content: m.content }));
  const result2 = await monitor.checkTokens(sessionKey, msgs2);
  
  log(colors.green, `✓ Warnings: ${result2.warnings.length} (should be 0)`);
  
  // Third check at 110k (should trigger NEW alert only)
  log(colors.gray, 'Third check at 110k tokens (should trigger alert only)...');
  const conv3 = generateTestConversation(110000);
  const msgs3 = conv3.messages.map(m => ({ role: m.role, content: m.content }));
  const result3 = await monitor.checkTokens(sessionKey, msgs3);
  
  log(colors.green, `✓ Warnings: ${result3.warnings.length} (should be 1)`);
  log(colors.gray, `  Level: ${result3.warnings[0]?.level}`);
  
  return result1.warnings.length === 1 && 
         result2.warnings.length === 0 && 
         result3.warnings.length === 1;
}

/**
 * Test Case: Multi-Session Isolation
 */
async function testMultiSession() {
  log(colors.blue, '\n═══ Test: Multi-Session Isolation ═══\n');
  
  // Session A at 60k
  const convA = generateTestConversation(60000);
  const msgsA = convA.messages.map(m => ({ role: m.role, content: m.content }));
  const resultA = await monitor.checkTokens('session-A', msgsA);
  
  // Session B at 110k
  const convB = generateTestConversation(110000);
  const msgsB = convB.messages.map(m => ({ role: m.role, content: m.content }));
  const resultB = await monitor.checkTokens('session-B', msgsB);
  
  log(colors.green, `✓ Session A: ${resultA.currentTokens.toLocaleString()} tokens, ${resultA.warnings.length} warnings`);
  log(colors.green, `✓ Session B: ${resultB.currentTokens.toLocaleString()} tokens, ${resultB.warnings.length} warnings`);
  
  // Check status
  const status = monitor.getStatus();
  log(colors.gray, `\nTotal sessions tracked: ${status.length}`);
  
  return status.length === 2;
}

/**
 * Run all tests
 */
async function runAllTests() {
  log(colors.blue, '╔═══════════════════════════════════════════╗');
  log(colors.blue, '║  Token Threshold Monitor Test Suite      ║');
  log(colors.blue, '╚═══════════════════════════════════════════╝');
  
  const tests = [
    { name: 'Threshold Detection', fn: testThresholdDetection },
    { name: 'Progressive Growth', fn: testProgressiveGrowth },
    { name: 'Session State', fn: testSessionState },
    { name: 'Multi-Session Isolation', fn: testMultiSession },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(colors.red, `✗ ${test.name} threw error:`, error.message);
      failed++;
    }
  }
  
  log(colors.blue, '\n╔═══════════════════════════════════════════╗');
  if (failed === 0) {
    log(colors.green, `║  ALL TESTS PASSED (${passed}/${tests.length})               ║`);
  } else {
    log(colors.red, `║  SOME TESTS FAILED (${passed}/${tests.length})             ║`);
  }
  log(colors.blue, '╚═══════════════════════════════════════════╝\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testThresholdDetection,
  testProgressiveGrowth,
  testSessionState,
  testMultiSession
};
