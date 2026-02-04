#!/bin/bash
# Auto Checkpoint - Non-interactive checkpoint triggered by token monitor
# Part of context-manager system
#
# Usage: ./scripts/auto-checkpoint.sh [token_count] [level]
#
# FLOW: Appends to today-brief.md (working memory)
#       Later, close-chapter.sh compacts today-brief → ONE chapter
#
# This is a SAFETY NET - saves essential context automatically.
# Does NOT replace manual ./scripts/memory-checkpoint.sh

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
TODAY_BRIEF="$MEMORY_DIR/today-brief.md"
AGENTS_DIR="/root/.openclaw/agents"
LOG_FILE="/root/.openclaw/logs/auto-checkpoint.log"
GATEWAY_URL="http://127.0.0.1:18789"

TOKEN_COUNT="${1:-0}"
LEVEL="${2:-critical}"

DATE=$(date +"%Y-%m-%d")
TIME_UTC=$(date -u +"%H:%M UTC")
PERCENT=$((TOKEN_COUNT * 100 / 200000))

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1" >> "$LOG_FILE"
}

send_telegram() {
    curl -s -X POST "$GATEWAY_URL/api/notify" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$1\"}" \
        --max-time 5 > /dev/null 2>&1 || true
}

log "Auto-checkpoint: tokens=$TOKEN_COUNT level=$LEVEL"

# Find most recent session file
SESSION_FILE=$(find "$AGENTS_DIR" -name "*.jsonl" -type f ! -name "*archived*" -mmin -60 2>/dev/null | head -1 || echo "")

# Extract recent conversation (last 10 exchanges, summarized)
SESSION_SUMMARY=""
if [ -n "$SESSION_FILE" ] && [ -f "$SESSION_FILE" ]; then
    SESSION_SUMMARY=$(tail -50 "$SESSION_FILE" 2>/dev/null | \
        jq -r 'select(.type=="message") | .message | select(.role=="user" or .role=="assistant") | "\(.role): \(.content | if type=="array" then .[0].text // "" else . end | .[0:200])"' 2>/dev/null | \
        grep -v "^$" | tail -10 | head -c 1000 || echo "")
fi

# Append to today-brief.md (working memory, compacted later by close-chapter.sh)
if [ -f "$TODAY_BRIEF" ]; then
    cat >> "$TODAY_BRIEF" << EOF

---

## 📸 Auto-Checkpoint: $TIME_UTC

**Trigger:** $LEVEL threshold (~$TOKEN_COUNT tokens, ${PERCENT}%)

**Recent context snapshot:**
\`\`\`
${SESSION_SUMMARY:-"(Session content not extracted)"}
\`\`\`

**Action needed:** Run \`./scripts/memory-checkpoint.sh\` for full preservation, then \`./scripts/close-chapter.sh\` to compact today's work.

EOF
    log "Appended to today-brief.md"
else
    log "WARNING: today-brief.md not found"
fi

# Telegram notification
send_telegram "📸 Auto-Checkpoint ($TIME_UTC)

Level: $LEVEL
Tokens: ~$TOKEN_COUNT (${PERCENT}%)

Context appended to today-brief.md

Recommended:
1. ./scripts/memory-checkpoint.sh
2. ./scripts/close-chapter.sh"

log "Complete"
echo "Appended to $TODAY_BRIEF"
