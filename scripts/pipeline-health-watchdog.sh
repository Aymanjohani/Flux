#!/bin/bash
# Pipeline Health Watchdog
# Detects when memory pipeline components stop running and alerts via Telegram.
#
# Checks:
#   1. summarize-brief.sh — should produce a summary every 6 hours
#   2. create-daily-chapter.sh — should produce a chapter every day
#   3. today-brief.md — should not be stale (no writes in 24h = nothing being logged)
#   4. Vector DB — should be reachable
#   5. Cron entries — the two memory crons should exist in crontab
#
# Cron: 0 */2 * * * (every 2 hours)
# Alert cooldown: won't re-alert for the same issue within 12 hours

set -uo pipefail

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
SUMMARIES_DIR="$MEMORY_DIR/summaries"
CHAPTERS_DIR="$MEMORY_DIR/context-hierarchy/chapters"
TODAY_BRIEF="$MEMORY_DIR/today-brief.md"
LOG_FILE="/root/.openclaw/logs/pipeline-health.log"
ALERT_STATE="/tmp/openclaw-pipeline-alerts.json"
EMIT_EVENT="$WORKSPACE/scripts/emit-event.sh"

# Max ages before alert (in seconds)
MAX_SUMMARY_AGE=$((7 * 3600))      # 7 hours (6h cycle + 1h grace)
MAX_CHAPTER_AGE=$((26 * 3600))     # 26 hours (daily + 2h grace)
MAX_BRIEF_AGE=$((36 * 3600))       # 36 hours (if nothing logged for 1.5 days)
ALERT_COOLDOWN=$((12 * 3600))      # 12 hours between repeat alerts

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [pipeline-health] $1" >> "$LOG_FILE"
}

# Load alert state (tracks last alert time per check to avoid spam)
load_alert_state() {
    if [ -f "$ALERT_STATE" ]; then
        cat "$ALERT_STATE"
    else
        echo "{}"
    fi
}

# Check if we already alerted for this issue recently
should_alert() {
    local check_name="$1"
    local state
    state=$(load_alert_state)
    local last_alert
    last_alert=$(echo "$state" | jq -r ".\"$check_name\" // 0" 2>/dev/null) || last_alert=0
    local now
    now=$(date +%s)
    [ $((now - last_alert)) -gt $ALERT_COOLDOWN ]
}

# Record that we sent an alert
record_alert() {
    local check_name="$1"
    local state
    state=$(load_alert_state)
    local now
    now=$(date +%s)
    echo "$state" | jq --arg k "$check_name" --argjson v "$now" '. + {($k): $v}' > "$ALERT_STATE" 2>/dev/null
}

# Clear alert state for a check (issue resolved)
clear_alert() {
    local check_name="$1"
    if [ -f "$ALERT_STATE" ]; then
        local state
        state=$(cat "$ALERT_STATE")
        echo "$state" | jq --arg k "$check_name" 'del(.[$k])' > "$ALERT_STATE" 2>/dev/null
    fi
}

# Send alert via event bus (Telegram)
send_alert() {
    local check_name="$1"
    local message="$2"

    if should_alert "$check_name"; then
        log "ALERT: $check_name — $message"
        if [ -x "$EMIT_EVENT" ]; then
            "$EMIT_EVENT" notify "$message" 2>/dev/null || log "WARN: emit-event failed for $check_name"
        fi
        record_alert "$check_name"
    else
        log "SUPPRESSED: $check_name (cooldown active)"
    fi
}

ISSUES=0

log "Starting pipeline health check"

# --- Check 1: Summarization freshness ---
LATEST_SUMMARY=$(find "$SUMMARIES_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | sort | tail -1)

if [ -z "$LATEST_SUMMARY" ]; then
    # No summaries at all — check if there are archived ones (pipeline ran before but summaries got cleaned up, which is normal if chapter creation ran)
    LATEST_ARCHIVED=$(find "$SUMMARIES_DIR/archive" -name "*.md" -type f 2>/dev/null | sort | tail -1)
    if [ -z "$LATEST_ARCHIVED" ]; then
        send_alert "summary_missing" "🔴 Pipeline Health: No summaries found at all. summarize-brief.sh may have never run successfully."
        ISSUES=$((ISSUES + 1))
    else
        # Archived summaries exist — chapter creation cleaned them up. Check chapter freshness instead (handled in check 2).
        log "OK: No active summaries, but archives exist (normal after chapter creation)"
        clear_alert "summary_missing"
    fi
else
    SUMMARY_AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST_SUMMARY") ))
    if [ "$SUMMARY_AGE" -gt "$MAX_SUMMARY_AGE" ]; then
        HOURS_AGO=$(( SUMMARY_AGE / 3600 ))
        send_alert "summary_stale" "🟡 Pipeline Health: Latest summary is ${HOURS_AGO}h old ($(basename "$LATEST_SUMMARY")). summarize-brief.sh may not be running."
        ISSUES=$((ISSUES + 1))
    else
        log "OK: Latest summary $(basename "$LATEST_SUMMARY") is fresh"
        clear_alert "summary_stale"
        clear_alert "summary_missing"
    fi
fi

# --- Check 2: Chapter freshness ---
LATEST_CHAPTER=$(find "$CHAPTERS_DIR" -name "*.md" -type f 2>/dev/null | sort | tail -1)

if [ -z "$LATEST_CHAPTER" ]; then
    send_alert "chapter_missing" "🔴 Pipeline Health: No chapters found. create-daily-chapter.sh may have never run."
    ISSUES=$((ISSUES + 1))
else
    CHAPTER_AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST_CHAPTER") ))
    if [ "$CHAPTER_AGE" -gt "$MAX_CHAPTER_AGE" ]; then
        HOURS_AGO=$(( CHAPTER_AGE / 3600 ))
        send_alert "chapter_stale" "🟡 Pipeline Health: Latest chapter is ${HOURS_AGO}h old ($(basename "$LATEST_CHAPTER")). create-daily-chapter.sh may not be running."
        ISSUES=$((ISSUES + 1))
    else
        log "OK: Latest chapter $(basename "$LATEST_CHAPTER") is fresh"
        clear_alert "chapter_stale"
        clear_alert "chapter_missing"
    fi
fi

# --- Check 3: today-brief.md freshness ---
if [ -f "$TODAY_BRIEF" ]; then
    BRIEF_AGE=$(( $(date +%s) - $(stat -c %Y "$TODAY_BRIEF") ))
    if [ "$BRIEF_AGE" -gt "$MAX_BRIEF_AGE" ]; then
        HOURS_AGO=$(( BRIEF_AGE / 3600 ))
        send_alert "brief_stale" "🟡 Pipeline Health: today-brief.md hasn't been updated in ${HOURS_AGO}h. No new events being captured."
        ISSUES=$((ISSUES + 1))
    else
        log "OK: today-brief.md is fresh"
        clear_alert "brief_stale"
    fi
else
    send_alert "brief_missing" "🔴 Pipeline Health: today-brief.md is missing."
    ISSUES=$((ISSUES + 1))
fi

# --- Check 4: Vector DB reachable ---
if [ -x "$WORKSPACE/scripts/memory" ]; then
    if ! "$WORKSPACE/scripts/memory" retrieve "health check" >/dev/null 2>&1; then
        send_alert "vectordb_down" "🔴 Pipeline Health: Vector DB not responding. Memory search is broken."
        ISSUES=$((ISSUES + 1))
    else
        log "OK: Vector DB responding"
        clear_alert "vectordb_down"
    fi
fi

# --- Check 5: Memory crons present ---
CRON_ISSUES=""
if ! crontab -l 2>/dev/null | grep -q "summarize-brief"; then
    CRON_ISSUES="${CRON_ISSUES}summarize-brief.sh missing from crontab. "
fi
if ! crontab -l 2>/dev/null | grep -q "create-daily-chapter"; then
    CRON_ISSUES="${CRON_ISSUES}create-daily-chapter.sh missing from crontab. "
fi

if [ -n "$CRON_ISSUES" ]; then
    send_alert "crons_missing" "🔴 Pipeline Health: Cron entries removed! ${CRON_ISSUES}Memory pipeline is dead."
    ISSUES=$((ISSUES + 1))
else
    log "OK: Memory crons present in crontab"
    clear_alert "crons_missing"
fi

# --- Check 6: Recent cron failures ---
FAILURES_LOG="/root/.openclaw/logs/cron-failures.log"
if [ -f "$FAILURES_LOG" ]; then
    # Check for failures in the last 6 hours
    RECENT_FAILURES=$(find "$FAILURES_LOG" -newermt "6 hours ago" -print 2>/dev/null)
    if [ -n "$RECENT_FAILURES" ]; then
        LAST_FAILURE=$(tail -5 "$FAILURES_LOG" | grep "FAILURE:" | tail -1)
        if [ -n "$LAST_FAILURE" ]; then
            send_alert "cron_failures" "🟡 Pipeline Health: Recent cron failure detected: $LAST_FAILURE"
            ISSUES=$((ISSUES + 1))
        fi
    else
        clear_alert "cron_failures"
    fi
fi

# --- Summary ---
if [ "$ISSUES" -eq 0 ]; then
    log "All checks passed"
else
    log "Completed with $ISSUES issue(s) detected"
fi
