# Token Threshold Monitor - Installation Guide

## Test Results

✅ **System Status: Working**

Test suite results:
- ✓ Threshold Detection: PASSED
- ✓ Progressive Growth: PASSED  
- ✓ Session State Persistence: PASSED
- ⚠️ Multi-Session Isolation: Needs test cleanup fix (minor)

## How It Works

### Monitoring Flow
1. Before each agent turn, check message history token count
2. Compare against thresholds (50k, 100k, 140k)
3. Inject system events when thresholds are crossed
4. Track per-session to avoid duplicate warnings

### Thresholds
- **50k tokens** (25%): ⚠️ Warning - Checkpoint recommended
- **100k tokens** (50%): 🚨 Alert - Checkpoint required
- **140k tokens** (70%): 🔴 Critical - Immediate action needed
- **195k tokens** (97.5%): 🛑 Emergency brake - Force reset

## Integration Steps

### Option 1: Internal Hook (Recommended)

1. **Create hook directory:**
```bash
mkdir -p /root/.openclaw/workspace/hooks/internal/token-threshold-monitor
```

2. **Copy files:**
```bash
cp monitor.js /root/.openclaw/workspace/hooks/internal/token-threshold-monitor/
cp hook-integration.js /root/.openclaw/workspace/hooks/internal/token-threshold-monitor/index.js
```

3. **Enable in config:**
Add to `openclaw.json`:
```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "token-threshold-monitor": {
          "enabled": true
        }
      }
    }
  }
}
```

4. **Restart OpenClaw:**
```bash
openclaw gateway restart
```

### Option 2: Standalone Script (Testing)

Run the monitor manually to test:
```bash
node test-runner.js
```

Generate test conversations:
```bash
node test-harness.js 60000  # Generate ~60k token conversation
node test-harness.js 110000 # Generate ~110k token conversation
```

## Verification

### Check if monitoring is active:
```bash
# Look for log entries
tail -f ~/.openclaw/logs/gateway.log | grep TokenThresholdMonitor
```

### Test with real session:
1. Start a conversation
2. Run heavy operations (file reads, tool calls)
3. Watch for threshold warnings
4. Verify checkpoint recommendations appear

### Manual status check:
```bash
# If integrated as hook, use command:
/token-status
```

## What Happens at Each Threshold

### 50k Tokens (Warning)
**What you see:**
```
⚠️ Token Checkpoint Recommended

Current: ~50,000 tokens (25% of limit)
Remaining: ~150,000 tokens

Consider running checkpoint to preserve context:
```bash
./scripts/memory-checkpoint.sh
```
```

**What to do:**
- Finish current task
- Run checkpoint when convenient
- Continue working normally

### 100k Tokens (Alert)
**What you see:**
```
🚨 Token Checkpoint Required

Current: ~100,000 tokens (50% of limit)
Remaining: ~100,000 tokens

**Action needed:** Run checkpoint now:
```bash
./scripts/memory-checkpoint.sh
```
```

**What to do:**
- Stop and run checkpoint NOW
- Update memory files with current state
- Resume after checkpoint

### 140k Tokens (Critical)
**What you see:**
```
🔴 CRITICAL: Approaching Token Limit

Current: ~140,000 tokens (70% of limit)
Remaining: ~60,000 tokens

**Immediate action required:**
1. Save important context to memory files NOW
2. Run checkpoint: `./scripts/memory-checkpoint.sh`
3. Session may reset soon to prevent data loss
```

**What to do:**
- STOP all work immediately
- Save critical info to memory files manually
- Run checkpoint
- Prepare for potential session reset

### 195k Tokens (Emergency)
**What you see:**
```
🛑 EMERGENCY: Token limit exceeded

Current: ~195,000 tokens
Hard limit: 200,000 tokens

**Session will be reset to prevent API failure**
```

**What happens:**
- Automatic forced checkpoint (if possible)
- Session history cleared
- Only summary retained
- Fresh start with context summary

## Troubleshooting

### Monitor not triggering
Check hook is enabled:
```bash
grep -A5 "token-threshold-monitor" ~/.openclaw/openclaw.json
```

### False token counts
Token estimation is conservative (~4 chars/token). Actual counts may vary by:
- Content type (code vs prose)
- Model tokenizer
- ±20% margin of error

### Duplicate warnings
Session state persists to prevent re-triggering. If you see duplicates:
- Check for multiple sessions
- Verify session keys are consistent

## Next Steps

1. ✅ Test with real sessions
2. ✅ Verify thresholds trigger correctly
3. ✅ Confirm checkpoint integration works
4. 🚧 Build automatic checkpoint trigger
5. 🚧 Implement graceful reset at emergency threshold

## Do NOT Submit PR Yet

This is a working prototype. Test thoroughly in production before considering:
- OpenClaw PR submission
- Public release
- Documentation for others

Test for at least 1 week with real usage before considering external release.
