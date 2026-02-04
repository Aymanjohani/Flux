#!/bin/bash
# Memory Checkpoint - Run before session reset/compact to save context

set -e

WORKSPACE="/root/.openclaw/workspace"
cd "$WORKSPACE"

echo "🔄 Memory Checkpoint Starting..."
echo ""

# Check if we're in a session that has context
echo "1. Current Status Check"
echo "   → Review conversation since last memory update"
echo "   → What would be lost if session reset now?"
echo ""

# Active work update
echo "2. Update Active Work"
echo "   → Edit memory/active-work.md with current task status"
echo "   → Note any blockers or next steps"
read -p "   Press Enter when active-work.md is updated..."
echo ""

# Semantic memory update
echo "3. Knowledge Consolidation"
echo "   Ask yourself: What did I learn/build/configure?"
echo ""
echo "   Update relevant files:"
echo "   • memory/semantic/infrastructure.md - New systems/integrations"
echo "   • memory/semantic/lessons-learned.md - Mistakes, patterns, solutions"
echo "   • memory/semantic/protocols.md - New procedures"
echo "   • memory/semantic/team.md - Team/org changes"
echo "   • memory/semantic/company.md - Business info"
echo ""
read -p "   Press Enter when semantic files are updated..."
echo ""

# Re-ingest
echo "4. Re-ingest Updated Files"
echo "   Which semantic files did you update?"
read -p "   Enter filename (or 'skip'): " FILENAME

if [ "$FILENAME" != "skip" ] && [ -n "$FILENAME" ]; then
    if [ -f "memory/semantic/$FILENAME" ]; then
        echo "   → Ingesting memory/semantic/$FILENAME"
        ./scripts/memory ingest "memory/semantic/$FILENAME"
    else
        echo "   ⚠️  File not found: memory/semantic/$FILENAME"
    fi
fi
echo ""

# Today brief update
echo "5. Update Today Brief"
echo "   → Update memory/today-brief.md with important events/decisions"
read -p "   Press Enter when today-brief.md is updated..."
echo ""

echo "✅ Memory Checkpoint Complete"
echo ""
echo "Context is now preserved. Safe to reset/compact session."
