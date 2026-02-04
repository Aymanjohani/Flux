#!/bin/bash
# Memory Search - Multi-tier memory retrieval
# Searches across all memory freshness tiers
#
# Usage: ./scripts/memory-search.sh "query"
#
# Tiers searched:
#   1. Hot (0-6h):   today-brief.md (grep)
#   2. Warm (6-24h): summaries/*.md (grep + vector)
#   3. Cold (>24h):  chapters/*.md (vector)
#   4. Permanent:    semantic/*.md (vector)

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
QUERY="${1:-}"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 \"search query\""
    exit 1
fi

echo "🔍 Searching memory for: \"$QUERY\""
echo "================================================"
echo ""

FOUND_ANYTHING=false

# Tier 1: Hot Memory (today-brief.md) - Grep search
echo "📋 [Tier 1] Hot Memory (today-brief.md)..."
TODAY_BRIEF="$MEMORY_DIR/today-brief.md"
if [ -f "$TODAY_BRIEF" ]; then
    RESULTS=$(grep -i -C 2 "$QUERY" "$TODAY_BRIEF" 2>/dev/null | head -20) || true
    if [ -n "$RESULTS" ]; then
        echo "   ✅ FOUND in today-brief.md:"
        echo ""
        echo "$RESULTS" | sed 's/^/   /'
        echo ""
        FOUND_ANYTHING=true
    else
        echo "   ❌ Not found"
    fi
else
    echo "   ⚠️  today-brief.md not found"
fi
echo ""

# Tier 2: Warm Memory (6hr summaries) - Grep search
echo "📋 [Tier 2] Warm Memory (summaries/*.md)..."
SUMMARIES_DIR="$MEMORY_DIR/summaries"
if [ -d "$SUMMARIES_DIR" ]; then
    RESULTS=$(grep -ri -l "$QUERY" "$SUMMARIES_DIR"/*.md 2>/dev/null | head -5) || true
    if [ -n "$RESULTS" ]; then
        echo "   ✅ FOUND in summaries:"
        for file in $RESULTS; do
            echo "   → $(basename "$file")"
            grep -i -C 1 "$QUERY" "$file" 2>/dev/null | head -5 | sed 's/^/     /'
        done
        echo ""
        FOUND_ANYTHING=true
    else
        echo "   ❌ Not found"
    fi
else
    echo "   ⚠️  summaries directory not found"
fi
echo ""

# Tier 3: Cold Memory (chapters) - Grep first, then vector
echo "📋 [Tier 3] Cold Memory (chapters/*.md)..."
CHAPTERS_DIR="$MEMORY_DIR/context-hierarchy/chapters"
if [ -d "$CHAPTERS_DIR" ]; then
    RESULTS=$(grep -ri -l "$QUERY" "$CHAPTERS_DIR"/*.md 2>/dev/null | head -5) || true
    if [ -n "$RESULTS" ]; then
        echo "   ✅ FOUND in chapters:"
        for file in $RESULTS; do
            echo "   → $(basename "$file")"
            grep -i -C 1 "$QUERY" "$file" 2>/dev/null | head -5 | sed 's/^/     /'
        done
        echo ""
        FOUND_ANYTHING=true
    else
        echo "   ❌ Not found via grep"
    fi
else
    echo "   ⚠️  chapters directory not found"
fi
echo ""

# Tier 4: Permanent Memory (semantic + vector search)
echo "📋 [Tier 4] Permanent Memory (semantic/*.md)..."
SEMANTIC_DIR="$MEMORY_DIR/semantic"
if [ -d "$SEMANTIC_DIR" ]; then
    RESULTS=$(grep -ri -l "$QUERY" "$SEMANTIC_DIR"/*.md 2>/dev/null | head -5) || true
    if [ -n "$RESULTS" ]; then
        echo "   ✅ FOUND in semantic files:"
        for file in $RESULTS; do
            echo "   → $(basename "$file")"
            grep -i -C 1 "$QUERY" "$file" 2>/dev/null | head -5 | sed 's/^/     /'
        done
        echo ""
        FOUND_ANYTHING=true
    else
        echo "   ❌ Not found via grep"
    fi
fi
echo ""

# Tier 5: Vector Search (all vectorized content)
echo "🧠 [Tier 5] Vector Memory (semantic search)..."
if [ -x "$WORKSPACE/scripts/memory" ]; then
    VECTOR_RESULTS=$("$WORKSPACE/scripts/memory" retrieve "$QUERY" 2>/dev/null | head -30) || true
    if [ -n "$VECTOR_RESULTS" ]; then
        echo "   ✅ Vector search results:"
        echo ""
        echo "$VECTOR_RESULTS" | sed 's/^/   /'
        echo ""
        FOUND_ANYTHING=true
    else
        echo "   ❌ No vector matches"
    fi
else
    echo "   ⚠️  Vector search not available"
fi
echo ""

# Summary
echo "================================================"
if [ "$FOUND_ANYTHING" = true ]; then
    echo "✅ Results found across memory tiers"
else
    echo "❌ No results found for: \"$QUERY\""
    echo ""
    echo "💡 This information may not be in memory yet."
    echo "   Consider asking the user or searching external sources."
fi
