/**
 * OpenClaw Internal Hook Integration
 * 
 * Integrates TokenThresholdMonitor into OpenClaw's hook system.
 * Place this in: hooks/internal/token-threshold-monitor/index.js
 */

const { monitor } = require('./monitor');

/**
 * Hook implementation
 */
export default function tokenThresholdMonitorHook(api) {
  console.log('[TokenThresholdMonitor] Hook loaded');
  
  /**
   * Hook into agent turn BEFORE execution
   * This runs before the model is called
   */
  api.on('agent_turn_start', async (event, ctx) => {
    const { sessionKey, messages } = event;
    
    if (!sessionKey || !messages) {
      return; // Skip if no session or messages
    }
    
    try {
      // Check current token count
      const result = await monitor.checkTokens(sessionKey, messages);
      
      // Log status
      console.log(`[TokenThresholdMonitor] Session ${sessionKey}: ${result.currentTokens} tokens`);
      
      // If warnings exist, inject them as system events
      if (result.warnings && result.warnings.length > 0) {
        for (const warning of result.warnings) {
          console.warn(`[TokenThresholdMonitor] ${warning.level.toUpperCase()}: ${warning.text}`);
          
          // Inject warning as system event into session
          // This makes it visible to the agent
          await api.injectSystemEvent(sessionKey, {
            type: 'token_threshold_warning',
            level: warning.level,
            text: warning.text,
            tokens: result.currentTokens
          });
        }
      }
      
      // If checkpoint requested, trigger it
      if (result.shouldCheckpoint) {
        console.warn(`[TokenThresholdMonitor] Checkpoint requested for ${sessionKey}`);
        
        // TODO: Trigger actual checkpoint script
        // For now, just log it
        await api.injectSystemEvent(sessionKey, {
          type: 'checkpoint_required',
          text: '**Checkpoint Required**: Token threshold exceeded. Please run checkpoint to preserve context.'
        });
      }
      
      // If emergency reset needed
      if (result.shouldReset) {
        console.error(`[TokenThresholdMonitor] Emergency reset required for ${sessionKey}`);
        
        // Inject emergency message
        await api.injectSystemEvent(sessionKey, {
          type: 'emergency_reset',
          text: '🛑 **EMERGENCY**: Token limit exceeded. Session will be reset after this turn.'
        });
        
        // TODO: Trigger graceful reset
        // This should:
        // 1. Force checkpoint
        // 2. Clear session history
        // 3. Keep only summary
      }
      
    } catch (error) {
      console.error('[TokenThresholdMonitor] Error:', error);
    }
  });
  
  /**
   * Hook into compaction events
   * Reset our tracking when OpenClaw compacts the session
   */
  api.on('session_after_compact', async (event, ctx) => {
    const { sessionKey } = event;
    
    if (sessionKey) {
      console.log(`[TokenThresholdMonitor] Session ${sessionKey} compacted, resetting thresholds`);
      monitor.resetSession(sessionKey);
    }
  });
  
  /**
   * Expose status command
   */
  api.registerCommand('token-status', {
    description: 'Show token threshold status for all sessions',
    handler: async () => {
      const status = monitor.getStatus();
      
      if (status.length === 0) {
        return 'No active sessions being monitored.';
      }
      
      let output = '**Token Threshold Status**\n\n';
      for (const s of status) {
        const percent = ((s.tokens / 200000) * 100).toFixed(1);
        output += `**${s.sessionKey}**\n`;
        output += `  Tokens: ${s.tokens.toLocaleString()} (${percent}%)\n`;
        output += `  Thresholds passed: ${s.thresholds.join(', ') || 'none'}\n`;
        output += `  Checkpoint needed: ${s.checkpointNeeded ? '⚠️ YES' : 'No'}\n`;
        output += `  Last checked: ${s.lastChecked}\n\n`;
      }
      
      return output;
    }
  });
}

/**
 * Hook metadata
 */
export const meta = {
  id: 'token-threshold-monitor',
  name: 'Token Threshold Monitor',
  description: 'Monitors session token count and triggers warnings/checkpoints at thresholds',
  version: '1.0.0',
  author: 'IIoT Solutions',
  events: [
    'agent_turn_start',
    'session_after_compact'
  ],
  commands: [
    'token-status'
  ]
};
