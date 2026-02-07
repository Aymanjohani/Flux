#!/bin/bash
# Session Bootstrap - Non-interactive context loader for session continuity
# Outputs critical context to stdout, capped at ~2000 chars
# Sources: today-brief.md, active-work.md, state.json, book-outline.md
#
# Usage: ./scripts/session-bootstrap.sh
# Designed to be piped or sourced at session start

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
DATE=$(date +"%Y-%m-%d")
MAX_CHARS=2000

output=""

append() {
    output="${output}${1}\n"
}

append "## Session Context (auto-loaded ${DATE})"
append ""

# 1. Today's brief — first 20 lines
if [ -f "$MEMORY_DIR/today-brief.md" ]; then
    BRIEF=$(head -20 "$MEMORY_DIR/today-brief.md" 2>/dev/null || true)
    if [ -n "$BRIEF" ]; then
        append "### Today"
        append "$BRIEF"
        append ""
    fi
fi

# 2. Active work — extract URGENT and High Priority sections (header + 5 lines each)
if [ -f "$MEMORY_DIR/active-work.md" ]; then
    URGENT=$(grep -n -i '## .*URGENT\|## .*High Priority' "$MEMORY_DIR/active-work.md" 2>/dev/null | head -3 || true)
    if [ -n "$URGENT" ]; then
        append "### Active Priorities"
        while IFS= read -r match; do
            LINE_NUM=$(echo "$match" | cut -d: -f1)
            HEADER=$(echo "$match" | cut -d: -f2-)
            append "$HEADER"
            # Get next 5 lines after the header
            SECTION=$(sed -n "$((LINE_NUM+1)),$((LINE_NUM+5))p" "$MEMORY_DIR/active-work.md" 2>/dev/null || true)
            if [ -n "$SECTION" ]; then
                append "$SECTION"
            fi
            append ""
        done <<< "$URGENT"
    fi
fi

# 3. State.json — last 3 pending items + contacts
if [ -f "$MEMORY_DIR/state.json" ] && command -v jq &>/dev/null; then
    PENDING=$(jq -r '.pendingItems[-3:][]? // empty' "$MEMORY_DIR/state.json" 2>/dev/null || true)
    if [ -n "$PENDING" ]; then
        append "### Pending"
        while IFS= read -r item; do
            append "- ${item}"
        done <<< "$PENDING"
        append ""
    fi
fi

# 4. Book outline — last 20 lines (recent session narrative)
if [ -f "$MEMORY_DIR/context-hierarchy/book-outline.md" ]; then
    RECENT=$(tail -20 "$MEMORY_DIR/context-hierarchy/book-outline.md" 2>/dev/null || true)
    if [ -n "$RECENT" ]; then
        append "### Recent Context"
        append "$RECENT"
        append ""
    fi
fi

# Cap total output at MAX_CHARS
FINAL=$(printf '%b' "$output" | head -c "$MAX_CHARS")
printf '%s' "$FINAL"
