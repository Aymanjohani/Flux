#!/bin/bash
# OpenClaw Watchdog - Auto-recovery for gateway issues
# Runs every 5 minutes via cron

LOCK_FILE="/tmp/openclaw-watchdog.lock"
LOG_FILE="/root/.openclaw/logs/watchdog.log"
HEALTH_URL="http://127.0.0.1:18789/"

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

# Check 1: Is gateway process running?
if ! pgrep -f "openclaw-gateway" >/dev/null 2>&1; then
    log "WARN: Gateway process not running, starting..."
    nohup openclaw gateway start >/dev/null 2>&1 &
    sleep 10
    if pgrep -f "openclaw-gateway" >/dev/null 2>&1; then
        log "OK: Gateway started successfully"
    else
        log "ERROR: Failed to start gateway"
    fi
    exit 0
fi

# Check 2: Is gateway responding to health checks?
if ! curl -s -m 10 "$HEALTH_URL" >/dev/null 2>&1; then
    log "WARN: Gateway not responding to health check, waiting 10s and retrying..."
    sleep 10
    
    if ! curl -s -m 10 "$HEALTH_URL" >/dev/null 2>&1; then
        log "ALERT: Gateway still not responding, restarting..."
        openclaw gateway restart
        sleep 10
        
        if curl -s -m 10 "$HEALTH_URL" >/dev/null 2>&1; then
            log "OK: Gateway recovered after restart"
        else
            log "ERROR: Gateway still not responding after restart"
        fi
        exit 0
    fi
fi

# All checks passed
log "OK: Gateway healthy (process running, health check passed)"
