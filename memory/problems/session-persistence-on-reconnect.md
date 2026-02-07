# Session Persistence on Telegram Reconnect

**Date Created:** 2026-02-04  
**Status:** Active - needs implementation  
**Priority:** Critical  

## Problem Statement

When Telegram disconnects and reconnects, OpenClaw creates a **new session** instead of resuming the existing one, causing complete context loss regardless of token count.

**Example from today (2026-02-04):**
- 09:00 UTC: Session at 78k tokens, discussing solution
- 09:42 UTC: Telegram disconnects
- 09:44 UTC: New session created (lost entire conversation)
- Lost conversation was ABOUT this exact problem (painful irony)

## Root Cause

OpenClaw's current session management:
```javascript
// Current behavior (simplified):
onTelegramMessage(peer_id, message) {
  session = createNewSession(peer_id)  // Always creates new
  // No lookup of existing session
  // No session restoration
}
```

**Missing pieces:**
1. No mapping of `telegram_peer_id → session_id`
2. No detection of "reconnect" vs "first connect"
3. No session restoration logic

## Impact

- **Frequency:** Telegram disconnects happen randomly (network issues, app restarts, etc.)
- **Data loss:** Can lose 20k, 50k, or 100k+ tokens of context
- **Unpredictability:** Can't rely on threshold-based checkpoints (disconnect can happen anytime)
- **Productivity loss:** Have to re-explain context repeatedly

## Current Workarounds (Insufficient)

1. ✅ Lower auto-checkpoint threshold (100k tokens) - helps but doesn't solve it
2. ✅ Write to memory files aggressively - partial mitigation
3. ❌ None prevent the core issue: session reset on reconnect

## Potential Solutions

### Option 1: Session Mapping Hook (Recommended)

**Approach:** Build a hook that maintains persistent mapping between Telegram peers and OpenClaw sessions

**Implementation:**
```javascript
// .openclaw/hooks/session-persistence/handler.js

const fs = require('fs');
const SESSION_MAP_FILE = '.openclaw/data/telegram-session-map.json';

// Load/save mapping
function loadSessionMap() {
  // telegram_peer_id → session_key mapping
  // { "1186936952": "agent:main:telegram:dm:1186936952" }
}

function saveSessionMap(map) {
  fs.writeFileSync(SESSION_MAP_FILE, JSON.stringify(map, null, 2));
}

// Hook into session lifecycle
module.exports = {
  name: 'session-persistence',
  
  // On session created
  onSessionCreated(session, context) {
    if (context.channel === 'telegram') {
      const peerId = context.peer_id;
      const map = loadSessionMap();
      
      // Check if peer already has a session
      if (map[peerId]) {
        const existingSession = getSession(map[peerId]);
        if (existingSession && existingSession.isActive) {
          // RESTORE existing session instead of using new one
          return existingSession;
        }
      }
      
      // New peer - save mapping
      map[peerId] = session.key;
      saveSessionMap(map);
      return session;
    }
  },
  
  // On session ended
  onSessionEnded(session) {
    // Remove from map after graceful end
    // (but NOT on disconnect - that's the point)
  }
};
```

**Storage format:**
```json
{
  "1186936952": {
    "sessionKey": "agent:main:telegram:dm:1186936952",
    "lastActive": "2026-02-04T09:42:00Z",
    "tokens": 78578
  }
}
```

**Pros:**
- Simple hook implementation
- Works across disconnects
- Persistent storage (survives gateway restarts)
- Can add metadata (token count, last active time)

**Cons:**
- Need to understand OpenClaw session lifecycle hooks
- Need to handle edge cases (manual session resets, multiple devices)

### Option 2: Telegram Plugin Patch

**Approach:** Modify the Telegram channel plugin directly to maintain session continuity

**Implementation:**
```javascript
// Patch: .openclaw/plugins/telegram/index.js
// (or create override in hooks)

class TelegramPlugin {
  constructor() {
    this.peerSessions = new Map(); // peer_id → session_key
  }
  
  async handleMessage(msg) {
    const peerId = msg.from.id;
    
    // Look up existing session
    let sessionKey = this.peerSessions.get(peerId);
    if (!sessionKey || !sessionExists(sessionKey)) {
      // Create new session
      sessionKey = await this.createSession(peerId);
      this.peerSessions.set(peerId, sessionKey);
    }
    
    // Use existing session
    await this.routeToSession(sessionKey, msg);
  }
}
```

**Pros:**
- Cleaner integration with Telegram flow
- Native to the plugin architecture

**Cons:**
- Requires modifying OpenClaw core plugin
- Updates might overwrite changes
- Less portable

### Option 3: Session Resume API

**Approach:** Build API endpoint that can resume sessions on reconnect

**Implementation:**
```javascript
// .openclaw/hooks/session-resume/handler.js

module.exports = {
  name: 'session-resume',
  
  onRequest(req, res) {
    if (req.path === '/api/session/resume') {
      const { channel, peerId } = req.body;
      
      // Find most recent session for this peer
      const session = findLatestSession(channel, peerId);
      
      if (session) {
        // Reactivate session
        session.lastActive = Date.now();
        return { sessionKey: session.key };
      } else {
        return { error: 'No session found' };
      }
    }
  }
};
```

**Pros:**
- Clean API interface
- Testable independently
- Can be called from any channel plugin

**Cons:**
- Requires channel plugins to call the API
- More moving parts

## Recommended Approach (UPDATED 2026-02-04 10:21 UTC)

**Simpler Solution:** Auto-save on reset detection (instead of preventing resets)

Rather than trying to prevent session resets (complex, many causes), automatically trigger memory checkpoint when reset is detected.

**Hook Logic:**
```javascript
// Detect dramatic token drop = session reset
if (previousTokens > 20000 && currentTokens < 5000) {
  // Auto-trigger memory checkpoint
  exec('./scripts/memory-checkpoint.sh')
}
```

**Why this is better:**
- ✅ Works regardless of WHY reset happened (Telegram, bug, manual)
- ✅ Simpler to implement (detection vs prevention)
- ✅ Leverages existing checkpoint infrastructure
- ✅ More robust - catches ALL reset scenarios

**Phase 1 (Immediate):** Build session-reset-detector hook
- Monitor token count drops
- Trigger automatic checkpoint on reset
- Save context before it's lost

**Phase 2 (Optional):** Still explore session persistence
- Session mapping for better UX
- But this ensures we never lose data first

## Implementation Plan

1. **Research:** Study OpenClaw session lifecycle hooks
   - What hooks are available? (onSessionCreated, onSessionEnded, etc.)
   - How to intercept session creation?
   - How to restore existing session?

2. **Build minimal hook:**
   ```bash
   mkdir -p .openclaw/hooks/session-persistence
   # Create handler.js with basic mapping
   # Create session-map.json storage
   ```

3. **Test:**
   - Create session, have conversation
   - Disconnect Telegram (airplane mode)
   - Reconnect - verify session restored
   - Check token count preserved

4. **Iterate:**
   - Handle edge cases
   - Add logging
   - Document behavior

## Success Metrics

- ✅ Telegram reconnect preserves session (zero context loss)
- ✅ Session mapping survives gateway restarts
- ✅ Works across multiple Telegram devices
- ✅ Graceful handling of manual session resets

## Related Files

- Token threshold hook: `.openclaw/hooks/token-threshold-monitor/`
- Session list: `openclaw sessions list` or `sessions_list` tool
- Config: `.openclaw/config.yaml` (session.dmScope settings)

## Next Steps

1. Study existing token-threshold-monitor hook structure
2. Identify session lifecycle hooks available
3. Build minimal session-persistence hook
4. Test with Telegram disconnect
5. Deploy and monitor

---

**The principle:** We built token-threshold-monitor ourselves. We can build session-persistence ourselves.
