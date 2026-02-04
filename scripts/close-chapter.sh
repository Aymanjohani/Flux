#!/bin/bash
# Close Chapter - Generate session summary and update book outline
# Part of the Hierarchical Context System

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
CHAPTERS_DIR="$WORKSPACE/memory/context-hierarchy/chapters"
BOOK_OUTLINE="$WORKSPACE/memory/context-hierarchy/book-outline.md"
CURRENT_CHAPTER="$WORKSPACE/memory/context-hierarchy/current-chapter.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

mkdir -p "$CHAPTERS_DIR"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   📖 Close Chapter - Hierarchical Context System${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Generate timestamp for chapter filename
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M")
CHAPTER_FILE="$CHAPTERS_DIR/$TIMESTAMP.md"

echo -e "${YELLOW}This will:${NC}"
echo "  1. Help you generate a high-fidelity chapter summary"
echo "  2. Save it to: chapters/$TIMESTAMP.md"
echo "  3. Append summary to book-outline.md"
echo "  4. Archive current chapter notes"
echo ""

# Check if there's work to summarize
if [ ! -f "$CURRENT_CHAPTER" ] || [ ! -s "$CURRENT_CHAPTER" ]; then
    echo -e "${YELLOW}⚠️  No current-chapter.md found or it's empty.${NC}"
    echo ""
    echo "This is fine if you're closing a session without active notes."
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Step 1: Chapter Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Write a 2-3 sentence summary of what happened this session."
echo "Focus on: What was accomplished, key decisions, outcomes."
echo ""
echo -e "${BLUE}Example:${NC}"
echo "  Built the hierarchical context system with Book Chapter pattern."
echo "  Created scripts for chapter management and book outline maintenance."
echo "  Integrated with existing memory checkpoint workflow."
echo ""
read -p "Summary: " SUMMARY

if [ -z "$SUMMARY" ]; then
    echo -e "${RED}❌ Summary cannot be empty.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Step 2: Chapter Title${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Give this chapter a title (2-5 words)."
echo ""
echo -e "${BLUE}Example:${NC} Cognitive Architecture Phase 1"
echo ""
read -p "Title: " TITLE

if [ -z "$TITLE" ]; then
    echo -e "${RED}❌ Title cannot be empty.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Step 3: Continuity Notes (Optional)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "What does the next session need to know?"
echo "(Leave empty if nothing special)"
echo ""
read -p "Continuity: " CONTINUITY

# Generate chapter file
DATE=$(date +"%Y-%m-%d %H:%M UTC")
cat > "$CHAPTER_FILE" <<EOF
# Chapter: $TITLE

**Date:** $DATE  
**Timestamp:** $TIMESTAMP

## Summary

$SUMMARY

## Continuity Notes

${CONTINUITY:-None}

---

## Full Chapter Notes

EOF

# Append current chapter notes if they exist
if [ -f "$CURRENT_CHAPTER" ] && [ -s "$CURRENT_CHAPTER" ]; then
    cat "$CURRENT_CHAPTER" >> "$CHAPTER_FILE"
else
    echo "(No detailed notes captured for this chapter)" >> "$CHAPTER_FILE"
fi

echo ""
echo -e "${GREEN}✅ Chapter saved: $CHAPTER_FILE${NC}"

# Update book outline
echo "" >> "$BOOK_OUTLINE"
echo "## Chapter: $TITLE ($TIMESTAMP)" >> "$BOOK_OUTLINE"
echo "" >> "$BOOK_OUTLINE"
echo "$SUMMARY" >> "$BOOK_OUTLINE"

if [ -n "$CONTINUITY" ]; then
    echo "" >> "$BOOK_OUTLINE"
    echo "**Continuity:** $CONTINUITY" >> "$BOOK_OUTLINE"
fi

echo "" >> "$BOOK_OUTLINE"
echo "---" >> "$BOOK_OUTLINE"

echo -e "${GREEN}✅ Book outline updated${NC}"

# Clear current chapter
> "$CURRENT_CHAPTER"
echo -e "${GREEN}✅ Current chapter cleared (ready for next session)${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   ✨ Chapter closed successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  - New session will load book-outline.md for continuity"
echo "  - Start fresh with current-chapter.md for notes"
echo "  - Chapter archived at: $CHAPTER_FILE"
echo ""
