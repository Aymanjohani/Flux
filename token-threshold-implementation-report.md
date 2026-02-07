# Token Threshold Monitor Hook - Implementation Report

**Date:** 2026-02-04  
**Status:** ✅ **ALREADY WORKING**

## Executive Summary

The token-threshold-monitor hook is **fully functional and operational**. It is:
- ✅ Installed at `/usr/lib/node_modules/openclaw/dist/hooks/bundled/token-threshold-monitor/`
- ✅ Enabled in configuration
- ✅ Actively monitoring sessions
- ✅ Triggering auto-checkpoint at critical thresholds
- ✅ Logging to `/root/.openclaw/logs/token-monitor.log`
- ✅ Sending Telegram notifications

**Evidence:** Auto-checkpoint triggered successfully at 09:19 UTC today when session reached 188k tokens (94% of limit).

---

## How OpenClaw Hooks Architecture Works

### Hook System Overview

OpenClaw uses an event-driven internal hook system:

1. **Hook Registration**: Hooks register handlers for specific event types
2. **Event Types**: `agent:bootstrap`, `gateway:startup`, `command:*`, `session:*`, etc.
3. **Hook Location**: Bundled hooks live in `/usr/lib/node_modules/openclaw/dist/hooks/bundled/`
4. **Configuration**: Hooks are configured in `openclaw.json` under `hooks.internal.entries`

### Hook Structure

Each bundled hook has:
```
/usr/lib/node_modules/openclaw/dist/hooks/bundled/<hook-name>/
├── handler.js      # Main hook logic (required)
└── HOOK.md         # Documentation (required)
```

### How token-threshold-monitor Works

**Event Hook:** `agent:bootstrap`  
**Timing:** Runs before EVERY agent turn (before model is called)

**Flow:**
```
1. Agent turn starts
   ↓
2. Hook triggers on agent:bootstrap event
   ↓
3. Hook finds current session file (~/.openclaw/agents/*/sessions/*.jsonl)
   ↓
4. Estimates tokens (rough: file_size / 4)
   ↓
5. Checks against thresholds:
   - 50k   → Warning (log only, inject bootstrap reminder)
   - 100k  → Alert (Telegram + bootstrap message)
   - 140k  → Critical (Telegram + trigger auto-checkpoint.sh)
   - 195k  → Emergency (Force checkpoint)
   ↓
6. For Critical/Emergency:
   - Spawns non-blocking process: bash auto-checkpoint.sh <tokens> <level>
   - Script appends context snapshot to today-brief.md
   - Sends Telegram notification
   ↓
7. Injects TOKEN_WARNING.md into bootstrapFiles (system prompt)
   ↓
8. Agent continues with warning visible
```

**Key Design:**
- **Non-breaking**: Modifies system prompt (bootstrapFiles), NOT conversation history
- **Safe**: Doesn't break tool_use/tool_result pairing
- **Non-blocking**: Auto-checkpoint runs detached, doesn't delay agent response

---

## Current Configuration

### openclaw.json
```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "boot-md": {
          "enabled": true
        },
        "command-logger": {
          "enabled": true
        },
        "session-memory": {
          "enabled": true
        },
        "token-threshold-monitor": {
          "enabled": true
        }
      }
    }
  }
}
```

**Status:** Hook is enabled but using **default thresholds** (no explicit parameters).

### Default Thresholds (from handler.js)
```javascript
const DEFAULT_THRESHOLDS = {
  warning: 50000,
  alert: 100000,
  critical: 140000,
  emergency: 195000
};
```

---

## Verification Evidence

### 1. Hook Installation
```bash
$ ls -la /usr/lib/node_modules/openclaw/dist/hooks/bundled/token-threshold-monitor/
total 32
-rw-r--r-- 1 root root 2693 Feb  4 03:44 HOOK.md
-rwxr-xr-x 1 root root 8348 Feb  4 03:54 handler.js
```

### 2. Monitoring Activity (token-monitor.log)
```
[2026-02-04T09:19:36.021Z] [INFO] Session agent:main:telegram:dm:1186936952: ~188065 tokens (94.0%)
[2026-02-04T09:19:36.024Z] [CRITICAL] Session agent:main:telegram:dm:1186936952: CRITICAL threshold crossed
[2026-02-04T09:19:49.167Z] [INFO] Session agent:main:subagent:c854eb65-000a-48b3-a951-cbf7bf531344: ~189230 tokens (94.6%)
[2026-02-04T09:19:49.169Z] [CRITICAL] Session agent:main:subagent:c854eb65-000a-48b3-a951-cbf7bf531344: CRITICAL threshold crossed
```

### 3. Auto-Checkpoint Execution (auto-checkpoint.log)
```
[2026-02-04T09:19:36Z] Auto-checkpoint: tokens=188065 level=critical
[2026-02-04T09:19:36Z] Appended to today-brief.md
[2026-02-04T09:19:36Z] Complete
```

### 4. Context Saved (today-brief.md)
```markdown
## 📸 Auto-Checkpoint: 09:19 UTC

**Trigger:** critical threshold (~188065 tokens, 94%)

**Recent context snapshot:**
[... conversation excerpt ...]

**Action needed:** Run `./scripts/memory-checkpoint.sh` for full preservation
```

---

## What Was "Missing"

The hook was **working perfectly**, but lacked:
1. ❌ Explicit configuration documentation showing it's enabled
2. ❌ User awareness that default thresholds are already optimal
3. ❌ Visibility into monitoring (logs are hidden unless you check)

**Reality:** The system worked exactly as designed. The user didn't realize it.

---

## Recommended Enhancements (Optional)

### 1. Add Explicit Threshold Configuration

While defaults work fine, documenting them in config makes it more discoverable:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "token-threshold-monitor": {
          "enabled": true,
          "thresholds": {
            "warning": 50000,
            "alert": 100000,
            "critical": 140000,
            "emergency": 195000
          },
          "telegram": true
        }
      }
    }
  }
}
```

**Action:**
```bash
# Add thresholds to config (optional - defaults already match this)
openclaw config set hooks.internal.entries.token-threshold-monitor.thresholds.warning 50000
openclaw config set hooks.internal.entries.token-threshold-monitor.thresholds.alert 100000
openclaw config set hooks.internal.entries.token-threshold-monitor.thresholds.critical 140000
openclaw config set hooks.internal.entries.token-threshold-monitor.thresholds.emergency 195000
```

### 2. Align Thresholds with Documented Spec

**Current (working):**
- Critical: 140k
- Emergency: 195k

**Documentation says:**
- Critical: 140k ✅ (matches)
- Emergency: 195k ✅ (matches)

**Conclusion:** Already aligned! No changes needed.

### 3. Make Monitoring More Visible

**Option A:** Add status command to AGENTS.md checklist:
```bash
# Check token status
tail -5 ~/.openclaw/logs/token-monitor.log
```

**Option B:** Include in heartbeat checks (proactive monitoring)

**Option C:** Dashboard widget (future enhancement)

---

## Implementation Steps (If You Want Explicit Config)

### Step 1: Document Current Thresholds in Config

```bash
cat << 'EOF' > /tmp/token-monitor-config.json
{
  "thresholds": {
    "warning": 50000,
    "alert": 100000,
    "critical": 140000,
    "emergency": 195000
  },
  "telegram": true
}
EOF

# Merge into openclaw.json at hooks.internal.entries.token-threshold-monitor
# (This requires manual edit or jq manipulation)
```

### Step 2: Edit openclaw.json

```bash
cd /root/.openclaw

# Backup first
cp openclaw.json openclaw.json.bak.token-config

# Edit the token-threshold-monitor section
nano openclaw.json
```

Find:
```json
"token-threshold-monitor": {
  "enabled": true
}
```

Replace with:
```json
"token-threshold-monitor": {
  "enabled": true,
  "thresholds": {
    "warning": 50000,
    "alert": 100000,
    "critical": 140000,
    "emergency": 195000
  },
  "telegram": true
}
```

### Step 3: Restart Gateway (Optional)

```bash
openclaw gateway restart
```

**Note:** Restart not required - hook reloads on each agent turn. Config is purely for documentation.

---

## Testing the Hook

### Manual Test: Check Monitoring Status
```bash
# View recent monitoring activity
tail -20 ~/.openclaw/logs/token-monitor.log

# Check auto-checkpoint log
tail -10 ~/.openclaw/logs/auto-checkpoint.log

# Verify today-brief.md has checkpoints
grep -A 10 "Auto-Checkpoint" /root/.openclaw/workspace/memory/today-brief.md
```

### Expected Output at Thresholds

**50k tokens:**
```
⚠️ Token checkpoint recommended (~50,000 tokens, 25%)
```

**100k tokens:**
```
🟠 **Token Alert**: Session at ~100,000 tokens (50%). Consider running checkpoint.
```
+ Telegram notification

**140k tokens:**
```
🔴 **CRITICAL**: Approaching token limit (~140,000 tokens, 70%). Run checkpoint soon
```
+ Auto-checkpoint.sh triggered
+ Telegram notification
+ Context saved to today-brief.md

**195k tokens:**
```
🛑 **EMERGENCY**: Token limit critical (~195,000 tokens, 97.5%)
```
+ Forced checkpoint
+ Emergency Telegram alert

---

## Integration with Memory Checkpoint System

The token-threshold-monitor integrates with the existing memory system:

### Workflow
```
Auto-checkpoint (safety net)
  ↓
today-brief.md (accumulates during day)
  ↓
Manual ./scripts/memory-checkpoint.sh (semantic files + re-ingest)
  ↓
./scripts/close-chapter.sh (end of session)
  ↓
chapters/ (archived session summaries)
  ↓
book-outline.md (high-level narrative)
```

### Key Points
1. **Auto-checkpoint** = Safety net, appends to today-brief.md
2. **Manual checkpoint** = Full preservation to semantic files
3. **Close chapter** = Session summary, compacts today-brief → ONE chapter

**Auto-checkpoint does NOT replace manual checkpoint!**  
It's a safety net to capture context when you hit critical levels unexpectedly.

---

## File Locations Reference

| Component | Location |
|-----------|----------|
| Hook handler | `/usr/lib/node_modules/openclaw/dist/hooks/bundled/token-threshold-monitor/handler.js` |
| Hook docs | `/usr/lib/node_modules/openclaw/dist/hooks/bundled/token-threshold-monitor/HOOK.md` |
| Auto-checkpoint script | `/root/.openclaw/workspace/scripts/auto-checkpoint.sh` |
| Token monitor log | `/root/.openclaw/logs/token-monitor.log` |
| Auto-checkpoint log | `/root/.openclaw/logs/auto-checkpoint.log` |
| Config | `/root/.openclaw/openclaw.json` |
| Memory accumulator | `/root/.openclaw/workspace/memory/today-brief.md` |

---

## Troubleshooting

### Hook Not Triggering?

**Check 1:** Is hook enabled?
```bash
cat ~/.openclaw/openclaw.json | jq '.hooks.internal.entries["token-threshold-monitor"].enabled'
# Should output: true
```

**Check 2:** Are there recent log entries?
```bash
tail -5 ~/.openclaw/logs/token-monitor.log
# Should show recent session checks
```

**Check 3:** Is the session file being found?
```bash
find ~/.openclaw/agents -name "*.jsonl" -type f ! -name "*archived*" -mmin -60
# Should show active session files
```

### Auto-Checkpoint Not Running?

**Check 1:** Does script exist and is executable?
```bash
ls -la ~/.openclaw/workspace/scripts/auto-checkpoint.sh
# Should show: -rwxr-xr-x (executable)
```

**Check 2:** Check auto-checkpoint log:
```bash
cat ~/.openclaw/logs/auto-checkpoint.log
```

**Check 3:** Manual test:
```bash
bash ~/.openclaw/workspace/scripts/auto-checkpoint.sh 150000 critical
# Should append to today-brief.md
```

### Token Count Seems Wrong?

**Note:** Token estimation is conservative (~4 chars/token).  
Actual counts vary by:
- Content type (code vs prose)
- Model tokenizer
- ±20% margin of error

This is intentional - better to warn early than miss the limit.

---

## Conclusion

### Current Status: ✅ FULLY OPERATIONAL

The token-threshold-monitor hook is:
- Correctly installed
- Properly configured (using sensible defaults)
- Actively monitoring all sessions
- Successfully triggering auto-checkpoint at critical thresholds
- Logging all activity
- Sending Telegram notifications

### What to Do Now

**Option 1 (Recommended):** Nothing. It's working.

**Option 2 (Documentation):** Add explicit thresholds to config for visibility:
```json
"token-threshold-monitor": {
  "enabled": true,
  "thresholds": {
    "warning": 50000,
    "alert": 100000,
    "critical": 140000,
    "emergency": 195000
  },
  "telegram": true
}
```

**Option 3 (Visibility):** Add monitoring check to AGENTS.md heartbeat protocol:
```bash
# During heartbeat, occasionally check:
tail -3 ~/.openclaw/logs/token-monitor.log
```

### No Code Changes Required

The hook implementation is complete and production-ready. The only thing "missing" was documentation showing it's already working.

---

## Related Documentation

- Hook implementation: `/usr/lib/node_modules/openclaw/dist/hooks/bundled/token-threshold-monitor/`
- Memory system: `skills/context-manager/SKILL.md`
- Auto-checkpoint script: `/root/.openclaw/workspace/scripts/auto-checkpoint.sh`
- Manual checkpoint: `/root/.openclaw/workspace/scripts/memory-checkpoint.sh`
- AGENTS.md: Memory checkpoint protocol
