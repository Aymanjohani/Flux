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
# Load OPENAI_API_KEY from openclaw.json if not set
if [ -z "${OPENAI_API_KEY:-}" ]; then
    OPENAI_API_KEY=$(node -e "console.log(require('/root/.openclaw/openclaw.json').env.vars.OPENAI_API_KEY)" 2>/dev/null) || true
fi

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

CHAPTER_CONTENT=""
LLM_CHAPTER=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d "$(jq -n --arg content "$COMBINED_CONTENT" '{
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are creating a daily chapter for a work narrative. Include: Day Summary (2-3 sentences), Key Events (with subheadings), and Infrastructure Notes if relevant. Be concise but comprehensive. Use markdown formatting."},
            {"role": "user", "content": ("Create a cohesive daily chapter from these 6-hour summaries:\n\n" + $content)}
        ],
        "max_tokens": 2000,
        "temperature": 0.3
    }')" \
    --max-time 90 2>/dev/null | jq -r '.choices[0].message.content // empty') || true

if [ -n "$LLM_CHAPTER" ]; then
    log "LLM chapter generation successful"
    CHAPTER_CONTENT="# Chapter: $DATE

$LLM_CHAPTER
"
else
    # Fallback: simple concatenation if LLM fails
    log "LLM chapter generation failed, using simple concatenation"
    CHAPTER_CONTENT="# Chapter: $DATE

## Day Summary

This chapter combines $SUMMARY_COUNT summaries from $DATE.

## Summaries

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
    # Extract first 200 chars for book outline (try multiple section headers)
    OVERVIEW=$(echo "$CHAPTER_CONTENT" | grep -A5 -E "## (Overview|Summary|Day Summary)" | tail -n+2 | head -c 200 || echo "$CHAPTER_CONTENT" | head -c 200)

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
