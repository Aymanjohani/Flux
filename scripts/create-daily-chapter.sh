#!/bin/bash
# Create Daily Chapter - Runs at end of day (23:55) via cron
# Combines 4 six-hour summaries into one daily chapter
#
# Flow: summaries/YYYY-MM-DD-*.md → chapters/YYYY-MM-DD.md → vectorized
#
# Cron: 55 23 * * * /root/.openclaw/workspace/scripts/create-daily-chapter.sh

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
SUMMARIES_DIR="$MEMORY_DIR/summaries"
CHAPTERS_DIR="$MEMORY_DIR/context-hierarchy/chapters"
BOOK_OUTLINE="$MEMORY_DIR/context-hierarchy/book-outline.md"
LOG_FILE="/root/.openclaw/logs/memory-cron.log"
GATEWAY_URL="http://127.0.0.1:18789"

DATE=$(date +"%Y-%m-%d")
CHAPTER_FILE="$CHAPTERS_DIR/${DATE}.md"

mkdir -p "$CHAPTERS_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [create-daily-chapter] $1" >> "$LOG_FILE"
}

log "Starting daily chapter creation for $DATE"

# Find today's summaries
SUMMARIES=$(find "$SUMMARIES_DIR" -name "${DATE}-*.md" -type f 2>/dev/null | sort)

if [ -z "$SUMMARIES" ]; then
    log "No summaries found for $DATE, skipping"
    exit 0
fi

SUMMARY_COUNT=$(echo "$SUMMARIES" | wc -l)
log "Found $SUMMARY_COUNT summaries for $DATE"

# Combine all summaries
COMBINED_CONTENT=""
for summary in $SUMMARIES; do
    COMBINED_CONTENT+="$(cat "$summary")"
    COMBINED_CONTENT+=$'\n\n---\n\n'
done

# Use LLM to create cohesive chapter
log "Generating chapter via LLM..."

CHAPTER_CONTENT=$(curl -s -X POST "$GATEWAY_URL/api/complete" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg content "$COMBINED_CONTENT" --arg date "$DATE" '{
        "prompt": "Create a cohesive daily chapter from these 6-hour summaries. Structure it as:\n\n# Chapter: " + $date + "\n\n## Overview\n(2-3 sentence day summary)\n\n## Key Decisions\n(bullet points)\n\n## Work Completed\n(bullet points)\n\n## Pending Items\n(bullet points)\n\n## Notes for Future Reference\n(anything important to remember)\n\nSummaries:\n" + $content,
        "max_tokens": 2000
    }')" \
    --max-time 120 2>/dev/null | jq -r '.completion // empty') || true

# If LLM fails, create simple concatenation
if [ -z "$CHAPTER_CONTENT" ]; then
    log "LLM chapter creation failed, using simple concatenation"
    CHAPTER_CONTENT="# Chapter: $DATE

## Combined Summaries

$COMBINED_CONTENT
"
fi

# Write chapter file
cat > "$CHAPTER_FILE" << EOF
$CHAPTER_CONTENT

---

**Metadata:**
- Date: $DATE
- Summaries combined: $SUMMARY_COUNT
- Generated: $(date -u +"%Y-%m-%d %H:%M UTC")

*Auto-generated daily chapter*
EOF

log "Chapter saved: $CHAPTER_FILE"

# Vectorize the chapter
if [ -x "$WORKSPACE/scripts/memory" ]; then
    log "Vectorizing chapter..."
    "$WORKSPACE/scripts/memory" ingest "$CHAPTER_FILE" >> "$LOG_FILE" 2>&1 || log "Vectorization failed"
fi

# Update book outline
if [ -f "$BOOK_OUTLINE" ]; then
    # Extract first 200 chars of overview for book outline
    OVERVIEW=$(echo "$CHAPTER_CONTENT" | grep -A5 "## Overview" | tail -n+2 | head -c 200)

    cat >> "$BOOK_OUTLINE" << EOF

## Chapter: $DATE

$OVERVIEW...

*Full chapter: chapters/${DATE}.md*

---
EOF
    log "Book outline updated"
fi

# Delete summary vectors from vector DB (avoid duplication)
if [ -x "$WORKSPACE/scripts/memory" ]; then
    log "Removing summary vectors from vector DB..."
    for summary in $SUMMARIES; do
        "$WORKSPACE/scripts/memory" delete "$summary" >> "$LOG_FILE" 2>&1 || true
    done
    log "Summary vectors removed"
fi

# Archive summaries (move to summaries/archive/)
ARCHIVE_DIR="$SUMMARIES_DIR/archive/$DATE"
mkdir -p "$ARCHIVE_DIR"
for summary in $SUMMARIES; do
    mv "$summary" "$ARCHIVE_DIR/" 2>/dev/null || true
done
log "Summaries archived to $ARCHIVE_DIR"

log "Daily chapter complete (vectors: summaries removed, chapter added)"
