#!/usr/bin/env node
/**
 * Token Generation Test Harness
 * 
 * Generates synthetic high-token sessions for testing threshold monitoring.
 * Usage: node test-harness.js [target-tokens]
 */

const TOKEN_ESTIMATION_RATIO = 4; // ~4 chars per token (conservative)

/**
 * Generate a block of text with approximately N tokens
 */
function generateTokenBlock(targetTokens) {
  const targetChars = targetTokens * TOKEN_ESTIMATION_RATIO;
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100);
  const blocksNeeded = Math.ceil(targetChars / lorem.length);
  return lorem.repeat(blocksNeeded).slice(0, targetChars);
}

/**
 * Estimate tokens in text (rough)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / TOKEN_ESTIMATION_RATIO);
}

/**
 * Generate a test conversation that reaches target tokens
 */
function generateTestConversation(targetTokens) {
  const messages = [];
  let currentTokens = 0;
  let messageCount = 0;

  // Generate messages in chunks
  const chunkSize = 5000; // ~1250 tokens per message
  
  while (currentTokens < targetTokens) {
    const remaining = targetTokens - currentTokens;
    const tokensThisMessage = Math.min(chunkSize, remaining);
    
    const userMessage = generateTokenBlock(tokensThisMessage / 2);
    const assistantMessage = generateTokenBlock(tokensThisMessage / 2);
    
    messages.push({
      role: 'user',
      content: `[Test ${messageCount}] ${userMessage}`,
      tokens: estimateTokens(userMessage)
    });
    
    messages.push({
      role: 'assistant',
      content: `[Response ${messageCount}] ${assistantMessage}`,
      tokens: estimateTokens(assistantMessage)
    });
    
    currentTokens += tokensThisMessage;
    messageCount++;
  }
  
  return {
    messages,
    totalTokens: currentTokens,
    messageCount: messages.length
  };
}

/**
 * Test scenarios
 */
const scenarios = {
  checkpoint1: 60000,   // Just over 50k threshold
  checkpoint2: 110000,  // Just over 100k threshold
  critical: 145000,     // Near 140k threshold
  danger: 180000        // Danger zone
};

// CLI usage
if (require.main === module) {
  const targetTokens = parseInt(process.argv[2]) || scenarios.checkpoint1;
  
  console.log(`Generating test conversation with ~${targetTokens} tokens...`);
  
  const conversation = generateTestConversation(targetTokens);
  
  console.log(`\n✓ Generated ${conversation.messageCount} messages`);
  console.log(`✓ Estimated total: ${conversation.totalTokens} tokens`);
  console.log(`\n--- First message sample ---`);
  console.log(conversation.messages[0].content.slice(0, 200) + '...');
  console.log(`\n--- Last message sample ---`);
  console.log(conversation.messages[conversation.messages.length - 1].content.slice(0, 200) + '...');
  
  // Write to file
  const fs = require('fs');
  const outputPath = `/tmp/test-conversation-${targetTokens}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(conversation, null, 2));
  console.log(`\n✓ Saved to: ${outputPath}`);
}

module.exports = {
  generateTokenBlock,
  estimateTokens,
  generateTestConversation,
  scenarios
};
