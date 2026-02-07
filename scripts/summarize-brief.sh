#!/bin/bash
# Summarize Brief - Runs every 6 hours via cron
# Part of hierarchical memory system
#
# Flow: today-brief.md → 6hr summary → vectorized
#
# Cron: 0 */6 * * * /root/.openclaw/workspace/scripts/summarize-brief.sh

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
TODAY_BRIEF="$MEMORY_DIR/today-brief.md"
SUMMARIES_DIR="$MEMORY_DIR/summaries"
LOG_FILE="/root/.openclaw/logs/memory-cron.log"
# Load OPENAI_API_KEY from openclaw.json if not set
if [ -z "${OPENAI_API_KEY:-}" ]; then
    OPENAI_API_KEY=$(node -e "console.log(require('/root/.openclaw/openclaw.json').env.vars.OPENAI_API_KEY)" 2>/dev/null) || true
fi

DATE=$(date +"%Y-%m-%d")
HOUR=$(date +"%H")
TIMESTAMP=$(date +"%Y-%m-%d-%H")

mkdir -p "$SUMMARIES_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [summarize-brief] $1" >> "$LOG_FILE"
}

log "Starting 6-hour summarization"

# Check if today-brief exists and has content
if [ ! -f "$TODAY_BRIEF" ] || [ ! -s "$TODAY_BRIEF" ]; then
    log "today-brief.md is empty or missing, skipping"
    exit 0
fi

# Check if we have new content since last summary
BRIEF_SIZE=$(wc -c < "$TODAY_BRIEF")
if [ "$BRIEF_SIZE" -lt 200 ]; then
    log "today-brief.md too small ($BRIEF_SIZE bytes), skipping"
    exit 0
fi

# Create summary filename
SUMMARY_FILE="$SUMMARIES_DIR/${DATE}-${HOUR}00.md"

# Use LLM to summarize (via openclaw gateway)
log "Generating summary via LLM..."

# Extract content to summarize
BRIEF_CONTENT=$(cat "$TODAY_BRIEF" | head -c 15000)

# Call OpenAI API for summarization
SUMMARY=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d "$(jq -n --arg content "$BRIEF_CONTENT" '{
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a concise summarizer for a daily work brief. Focus on: decisions made, tasks completed, key discussions, and pending items. Keep it under 500 words."},
            {"role": "user", "content": ("Summarize the following daily brief into a concise 6-hour summary:\n\n" + $content)}
        ],
        "max_tokens": 1000,
        "temperature": 0.3
    }')" \
    --max-time 60 2>/dev/null | jq -r '.choices[0].message.content // empty') || true

# If LLM fails, create a simple extraction
if [ -z "$SUMMARY" ]; then
    log "LLM summarization failed, using simple extraction"
    SUMMARY=$(echo "$BRIEF_CONTENT" | grep -E "^##|^\*\*|^-" | head -50)
fi

# Write summary file
cat > "$SUMMARY_FILE" << EOF
# 6-Hour Summary: $DATE $HOUR:00 UTC

**Period:** $(date -d "6 hours ago" +"%H:00") - ${HOUR}:00 UTC
**Generated:** $(date -u +"%Y-%m-%d %H:%M UTC")

## Summary

$SUMMARY

---
*Auto-generated from today-brief.md*
EOF

log "Summary saved: $SUMMARY_FILE"

# Vectorize the summary
if [ -x "$WORKSPACE/scripts/memory" ]; then
    log "Vectorizing summary..."
    "$WORKSPACE/scripts/memory" ingest "$SUMMARY_FILE" >> "$LOG_FILE" 2>&1 || log "Vectorization failed"
fi

# Clear today-brief (keep header, remove content)
BRIEF_HEADER=$(head -10 "$TODAY_BRIEF" | grep -E "^#|^\*\*Day" || echo "# Today Brief")
cat > "$TODAY_BRIEF" << EOF
$BRIEF_HEADER

---

*Cleared at $(date -u +"%H:%M UTC") after 6-hour summarization. Previous content archived to summaries/${DATE}-${HOUR}00.md*

---

EOF

log "today-brief.md cleared for next period"
log "Complete"
