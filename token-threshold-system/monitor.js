/**
 * Token Threshold Monitor
 * 
 * Hooks into OpenClaw agent pipeline to monitor token count
 * and inject warnings/checkpoints at thresholds.
 * 
 * Thresholds:
 * - 50k: Warning (checkpoint recommended)
 * - 100k: Alert (checkpoint required)  
 * - 140k: Critical (forced checkpoint + graceful wind-down)
 */

const THRESHOLDS = {
  WARNING: 50000,
  ALERT: 100000,
  CRITICAL: 140000,
  ABSOLUTE_MAX: 195000  // Safety margin before 200k hard limit
};

class TokenThresholdMonitor {
  constructor() {
    this.sessionStates = new Map();
  }

  /**
   * Get or create session state
   */
  getSessionState(sessionKey) {
    if (!this.sessionStates.has(sessionKey)) {
      this.sessionStates.set(sessionKey, {
        lastTokenCount: 0,
        thresholdsPassed: new Set(),
        checkpointRequested: false,
        lastChecked: Date.now()
      });
    }
    return this.sessionStates.get(sessionKey);
  }

  /**
   * Estimate tokens from message history
   * (Simple estimation: ~4 chars per token)
   */
  estimateTokens(messages) {
    if (!messages || !Array.isArray(messages)) return 0;
    
    let totalChars = 0;
    for (const msg of messages) {
      if (msg.content) {
        if (typeof msg.content === 'string') {
          totalChars += msg.content.length;
        } else if (Array.isArray(msg.content)) {
          // Handle multi-part content
          for (const part of msg.content) {
            if (part.text) totalChars += part.text.length;
            if (part.content) totalChars += JSON.stringify(part.content).length;
          }
        }
      }
    }
    
    // ~4 chars per token (conservative estimate)
    return Math.ceil(totalChars / 4);
  }

  /**
   * Check if threshold was crossed
   */
  checkThreshold(currentTokens, threshold, sessionState) {
    const thresholdKey = `${threshold}`;
    if (currentTokens >= threshold && !sessionState.thresholdsPassed.has(thresholdKey)) {
      sessionState.thresholdsPassed.add(thresholdKey);
      return true;
    }
    return false;
  }

  /**
   * Generate threshold warning message
   */
  getThresholdMessage(threshold, currentTokens) {
    const remaining = 200000 - currentTokens;
    const percent = ((currentTokens / 200000) * 100).toFixed(1);
    
    switch (threshold) {
      case THRESHOLDS.WARNING:
        return {
          level: 'warning',
          text: `⚠️ Token Checkpoint Recommended\n\n` +
                `Current: ~${currentTokens.toLocaleString()} tokens (${percent}% of limit)\n` +
                `Remaining: ~${remaining.toLocaleString()} tokens\n\n` +
                `Consider running checkpoint to preserve context:\n` +
                `\`\`\`bash\n./scripts/memory-checkpoint.sh\n\`\`\``
        };
      
      case THRESHOLDS.ALERT:
        return {
          level: 'alert',
          text: `🚨 Token Checkpoint Required\n\n` +
                `Current: ~${currentTokens.toLocaleString()} tokens (${percent}% of limit)\n` +
                `Remaining: ~${remaining.toLocaleString()} tokens\n\n` +
                `**Action needed:** Run checkpoint now:\n` +
                `\`\`\`bash\n./scripts/memory-checkpoint.sh\n\`\`\``
        };
      
      case THRESHOLDS.CRITICAL:
        return {
          level: 'critical',
          text: `🔴 CRITICAL: Approaching Token Limit\n\n` +
                `Current: ~${currentTokens.toLocaleString()} tokens (${percent}% of limit)\n` +
                `Remaining: ~${remaining.toLocaleString()} tokens\n\n` +
                `**Immediate action required:**\n` +
                `1. Save important context to memory files NOW\n` +
                `2. Run checkpoint: \`./scripts/memory-checkpoint.sh\`\n` +
                `3. Session may reset soon to prevent data loss`
        };
      
      default:
        return null;
    }
  }

  /**
   * Main monitoring function - call before each agent turn
   */
  async checkTokens(sessionKey, messages, options = {}) {
    const sessionState = this.getSessionState(sessionKey);
    const currentTokens = this.estimateTokens(messages);
    
    sessionState.lastTokenCount = currentTokens;
    sessionState.lastChecked = Date.now();
    
    const warnings = [];
    
    // Check thresholds in order
    if (this.checkThreshold(currentTokens, THRESHOLDS.WARNING, sessionState)) {
      warnings.push(this.getThresholdMessage(THRESHOLDS.WARNING, currentTokens));
    }
    
    if (this.checkThreshold(currentTokens, THRESHOLDS.ALERT, sessionState)) {
      warnings.push(this.getThresholdMessage(THRESHOLDS.ALERT, currentTokens));
    }
    
    if (this.checkThreshold(currentTokens, THRESHOLDS.CRITICAL, sessionState)) {
      warnings.push(this.getThresholdMessage(THRESHOLDS.CRITICAL, currentTokens));
      sessionState.checkpointRequested = true;
    }
    
    // Emergency brake - prevent runaway sessions
    if (currentTokens >= THRESHOLDS.ABSOLUTE_MAX) {
      warnings.push({
        level: 'emergency',
        text: `🛑 EMERGENCY: Token limit exceeded\n\n` +
              `Current: ~${currentTokens.toLocaleString()} tokens\n` +
              `Hard limit: 200,000 tokens\n\n` +
              `**Session will be reset to prevent API failure**`
      });
    }
    
    return {
      currentTokens,
      warnings,
      shouldCheckpoint: sessionState.checkpointRequested,
      shouldReset: currentTokens >= THRESHOLDS.ABSOLUTE_MAX
    };
  }

  /**
   * Get status for all sessions
   */
  getStatus() {
    const status = [];
    for (const [key, state] of this.sessionStates) {
      status.push({
        sessionKey: key,
        tokens: state.lastTokenCount,
        thresholds: Array.from(state.thresholdsPassed),
        checkpointNeeded: state.checkpointRequested,
        lastChecked: new Date(state.lastChecked).toISOString()
      });
    }
    return status;
  }

  /**
   * Reset session state (after checkpoint)
   */
  resetSession(sessionKey) {
    this.sessionStates.delete(sessionKey);
  }
}

// Singleton instance
const monitor = new TokenThresholdMonitor();

module.exports = {
  TokenThresholdMonitor,
  monitor,
  THRESHOLDS
};
