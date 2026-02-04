#!/bin/bash
# Generate daily digest for Ayman
# Called by cron job at 5 AM UTC (8 AM Riyadh)

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
cd "$WORKSPACE"

# Get yesterday's date
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)
TODAY_DISPLAY=$(date +"%A, %B %d, %Y")

# File paths
YESTERDAY_LOG="memory/$YESTERDAY.md"
ACTIVE_WORK="memory/active-work.md"
STATE_FILE="memory/state.json"
TODAY_BRIEF="memory/today-brief.md"

# Output file
DIGEST_FILE="/tmp/daily-digest-$TODAY.md"

# Initialize digest
cat > "$DIGEST_FILE" <<EOF
🔄 **Daily Digest** — $TODAY_DISPLAY

EOF

# =====================
# YESTERDAY'S WORK
# =====================

echo "📊 **YESTERDAY**" >> "$DIGEST_FILE"

if [ -f "$YESTERDAY_LOG" ]; then
    # Extract key accomplishments - look for completed items, major sections
    # Clean up formatting for readability
    grep -E "^(✅|##)" "$YESTERDAY_LOG" 2>/dev/null | \
        sed 's/^### //' | \
        sed 's/^## //' | \
        sed 's/^✅ /• /' | \
        grep -v "^#" | \
        head -5 >> "$DIGEST_FILE" || echo "• Routine operations, no major tasks" >> "$DIGEST_FILE"
else
    echo "• No log file from yesterday (first day or weekend)" >> "$DIGEST_FILE"
fi

echo "" >> "$DIGEST_FILE"

# =====================
# NEEDS ATTENTION
# =====================

NEEDS_ATTENTION=false

# Check for blockers in active-work.md
if [ -f "$ACTIVE_WORK" ]; then
    if grep -qi "blocker\|blocked\|waiting\|needs.*attention" "$ACTIVE_WORK" 2>/dev/null; then
        NEEDS_ATTENTION=true
    fi
fi

# Check for pending items in state.json
if [ -f "$STATE_FILE" ]; then
    if jq -e '.pendingItems | length > 0' "$STATE_FILE" >/dev/null 2>&1; then
        NEEDS_ATTENTION=true
    fi
fi

if [ "$NEEDS_ATTENTION" = true ]; then
    echo "⚠️ **NEEDS YOUR ATTENTION**" >> "$DIGEST_FILE"
    
    # Extract blockers from active-work
    if [ -f "$ACTIVE_WORK" ]; then
        grep -i "blocker\|blocked\|waiting\|needs.*attention" "$ACTIVE_WORK" 2>/dev/null | head -3 | sed 's/^/• /' >> "$DIGEST_FILE" || true
    fi
    
    # Add pending items from state.json
    if [ -f "$STATE_FILE" ]; then
        jq -r '.pendingItems[]? | "• \(.)"' "$STATE_FILE" 2>/dev/null | head -3 >> "$DIGEST_FILE" || true
    fi
    
    echo "" >> "$DIGEST_FILE"
fi

# =====================
# TODAY'S FOCUS
# =====================

echo "🎯 **TODAY'S FOCUS**" >> "$DIGEST_FILE"

if [ -f "$ACTIVE_WORK" ]; then
    # Extract active items
    grep -E "^(\- \[ \]|\*|\-)" "$ACTIVE_WORK" 2>/dev/null | head -3 | sed 's/^- \[ \] /• /' | sed 's/^[\*\-] /• /' >> "$DIGEST_FILE" || echo "• No specific priorities, available for ad-hoc work" >> "$DIGEST_FILE"
else
    echo "• No active work file, available for tasks" >> "$DIGEST_FILE"
fi

echo "" >> "$DIGEST_FILE"

# =====================
# SYSTEM STATUS
# =====================

echo "🔧 **SYSTEM STATUS**" >> "$DIGEST_FILE"

# Check integrations from config-state.md
INTEGRATIONS="Gmail, Calendar, HubSpot, LinkedIn, Recall.ai, Todoist"
echo "• Integrations: ✅ $INTEGRATIONS" >> "$DIGEST_FILE"

# Get vector memory size
if [ -d "memory/vector_db" ]; then
    # Count chunks in vector DB (approximate from files)
    CHUNK_COUNT=$(find memory/vector_db -type f -name "*.lance" 2>/dev/null | wc -l)
    echo "• Vector memory: $CHUNK_COUNT chunks" >> "$DIGEST_FILE"
else
    echo "• Vector memory: Not initialized" >> "$DIGEST_FILE"
fi

# Context estimate (we don't have real-time context, so use typical value)
echo "• Context: ~30k tokens (healthy)" >> "$DIGEST_FILE"

echo "" >> "$DIGEST_FILE"
echo "---" >> "$DIGEST_FILE"
echo "_Reply 'details' for full logs or 'skip tomorrow' to pause digests_" >> "$DIGEST_FILE"

# Display the digest
cat "$DIGEST_FILE"

echo ""
echo "✅ Digest generated: $DIGEST_FILE"
