#!/bin/bash
# OpenClaw Watchdog - Auto-recovery for stuck sessions
# Runs every 5 minutes via cron to detect and fix hangs

LOCK_FILE="/tmp/openclaw-watchdog.lock"
LOG_FILE="/root/.openclaw/logs/watchdog.log"
MAX_TYPING_MINUTES=5
MAX_RUN_MINUTES=4  # Should be less than timeoutSeconds (180s = 3min)

# Ensure log directory exists
mkdir -p /root/.openclaw/logs

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1" >> "$LOG_FILE"
}

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
    if [ $(($(date +%s) - $(stat -c %Y "$LOCK_FILE"))) -gt 300 ]; then
        log "WARN: Stale lock file detected, removing"
        rm -f "$LOCK_FILE"
    else
        exit 0
    fi
fi
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# Check if gateway is running
if ! systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    log "WARN: Gateway not running, starting..."
    systemctl --user start openclaw-gateway.service
    sleep 5
    exit 0
fi

# Check recent logs for stuck indicators
RECENT_LOGS=$(journalctl --user -u openclaw-gateway.service --since "10 minutes ago" --no-pager 2>/dev/null)

# Pattern 1: Typing TTL reached multiple times without response
TYPING_STOPS=$(echo "$RECENT_LOGS" | grep -c "typing TTL reached")
RESPONSES=$(echo "$RECENT_LOGS" | grep -c "telegram.*sendMessage\|message sent")

if [ "$TYPING_STOPS" -gt 2 ] && [ "$RESPONSES" -eq 0 ]; then
    log "ALERT: Detected stuck session - $TYPING_STOPS typing stops, 0 responses"

    # Clear session files that might be corrupted
    SESSIONS_DIR="/root/.openclaw/agents/main/sessions"
    if [ -d "$SESSIONS_DIR" ]; then
        # Find and remove session transcripts older than 1 hour with no recent updates
        find "$SESSIONS_DIR" -name "*.jsonl" -mmin +60 -delete 2>/dev/null
        log "Cleaned old session transcripts"
    fi

    # Restart gateway
    log "Restarting gateway..."
    systemctl --user restart openclaw-gateway.service
    sleep 5

    # Notify via telegram (optional - requires bot token)
    # curl -s "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    #     -d "chat_id=$ADMIN_CHAT_ID" \
    #     -d "text=Watchdog: Detected and recovered from stuck session"

    log "Recovery complete"
    exit 0
fi

# Pattern 2: Embedded run timeout in logs
TIMEOUTS=$(echo "$RECENT_LOGS" | grep -c "embedded run timeout")
if [ "$TIMEOUTS" -gt 0 ]; then
    log "WARN: Detected $TIMEOUTS timeout(s) in recent logs"

    # Check if it's still stuck (timeout happened but no recovery)
    LAST_TIMEOUT=$(echo "$RECENT_LOGS" | grep "embedded run timeout" | tail -1)
    LAST_ACTIVITY=$(echo "$RECENT_LOGS" | tail -1)

    # If last log entry is still about timeout, we might be stuck
    if echo "$LAST_ACTIVITY" | grep -q "timeout\|Trying next account"; then
        log "ALERT: Gateway appears stuck after timeout, restarting..."
        systemctl --user restart openclaw-gateway.service
        sleep 5
        log "Recovery complete"
    fi
fi

# Pattern 3: No logs at all for 10+ minutes (gateway frozen)
LOG_COUNT=$(echo "$RECENT_LOGS" | wc -l)
if [ "$LOG_COUNT" -lt 3 ]; then
    log "WARN: Very few logs in last 10 minutes ($LOG_COUNT lines), checking health..."

    # Try health probe
    if ! curl -s -m 5 "http://127.0.0.1:18789/" >/dev/null 2>&1; then
        log "ALERT: Gateway not responding to health check, restarting..."
        systemctl --user restart openclaw-gateway.service
        sleep 5
        log "Recovery complete"
    fi
fi

# All good
log "OK: Watchdog check passed"
