#!/bin/bash
# Quick query Flux's knowledge base
# Usage: ./quick-query.sh "your question"

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
cd "$WORKSPACE"

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: quick-query.sh \"your question\""
    echo ""
    echo "Examples:"
    echo "  quick-query.sh \"Who handles BD at KESWA?\""
    echo "  quick-query.sh \"What integrations are set up?\""
    echo "  quick-query.sh \"When did we last talk to Aadil?\""
    exit 1
fi

QUERY="$*"

echo "🔍 Searching for: $QUERY"
echo ""

# =====================
# 1. Vector Memory Search
# =====================

echo "📚 Vector Memory Results:"
echo "------------------------"

if [ -x "./scripts/memory" ]; then
    VECTOR_RESULTS=$(./scripts/memory retrieve "$QUERY" 2>/dev/null || echo "")
    
    if [ -n "$VECTOR_RESULTS" ]; then
        echo "$VECTOR_RESULTS" | head -20
    else
        echo "No results found in vector memory"
    fi
else
    echo "Vector memory tool not available"
fi

echo ""

# =====================
# 2. State Files Quick Check
# =====================

echo "📋 State Files Check:"
echo "------------------------"

# Check config-state.md
if [ -f "memory/config-state.md" ]; then
    if grep -qi "$QUERY" "memory/config-state.md" 2>/dev/null; then
        echo "✓ Found in config-state.md:"
        grep -i "$QUERY" "memory/config-state.md" | head -3
        echo ""
    fi
fi

# Check team.md
if [ -f "memory/semantic/team.md" ]; then
    if grep -qi "$QUERY" "memory/semantic/team.md" 2>/dev/null; then
        echo "✓ Found in team.md:"
        grep -i "$QUERY" "memory/semantic/team.md" | head -3
        echo ""
    fi
fi

# Check active-work.md
if [ -f "memory/active-work.md" ]; then
    if grep -qi "$QUERY" "memory/active-work.md" 2>/dev/null; then
        echo "✓ Found in active-work.md:"
        grep -i "$QUERY" "memory/active-work.md" | head -3
        echo ""
    fi
fi

# Check state.json
if [ -f "memory/state.json" ]; then
    if jq -r '. | tostring' "memory/state.json" 2>/dev/null | grep -qi "$QUERY"; then
        echo "✓ Found in state.json:"
        jq -r '. | tostring' "memory/state.json" | grep -i "$QUERY" | head -3
        echo ""
    fi
fi

# =====================
# 3. Recent Daily Logs
# =====================

echo "📅 Recent Logs:"
echo "------------------------"

# Search last 7 days of logs
for i in {0..6}; do
    DATE=$(date -d "$i days ago" +%Y-%m-%d)
    LOG_FILE="memory/$DATE.md"
    
    if [ -f "$LOG_FILE" ]; then
        if grep -qi "$QUERY" "$LOG_FILE" 2>/dev/null; then
            echo "✓ Found in $DATE log:"
            grep -i "$QUERY" "$LOG_FILE" | head -2
            echo ""
        fi
    fi
done

echo "---"
echo ""
echo "💡 Tip: For detailed context, ask me directly via chat"
