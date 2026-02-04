#!/bin/bash
# Session End Validation Script
# Ensures all memory files are updated before session closes

set -e

echo "📋 Session End Checklist"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

WORKSPACE="/root/.openclaw/workspace"
cd "$WORKSPACE"

# Track completion
all_done=true

# Step 1: Check state files
echo "Step 1: State Files (today's reference)"
echo "----------------------------------------"

# Check if today-brief.md was updated recently (within last 2 hours)
TODAY_BRIEF="memory/today-brief.md"
if [ -f "$TODAY_BRIEF" ]; then
    mod_time=$(stat -c %Y "$TODAY_BRIEF")
    now=$(date +%s)
    age=$((now - mod_time))
    
    if [ $age -lt 7200 ]; then
        echo -e "${GREEN}✓${NC} today-brief.md updated recently"
    else
        echo -e "${YELLOW}⚠${NC} today-brief.md hasn't been updated in $(($age / 3600)) hours"
        echo "   Consider updating if important things happened this session"
        all_done=false
    fi
else
    echo -e "${RED}✗${NC} today-brief.md not found"
    all_done=false
fi

# Check active-work.md
ACTIVE_WORK="memory/active-work.md"
if [ -f "$ACTIVE_WORK" ]; then
    echo -e "${GREEN}✓${NC} active-work.md exists"
else
    echo -e "${RED}✗${NC} active-work.md not found"
    all_done=false
fi

# Check config-state.md
CONFIG_STATE="memory/config-state.md"
if [ -f "$CONFIG_STATE" ]; then
    echo -e "${GREEN}✓${NC} config-state.md exists"
else
    echo -e "${YELLOW}⚠${NC} config-state.md not found"
fi

echo ""
echo "Step 2: Semantic Knowledge (permanent, searchable)"
echo "---------------------------------------------------"
echo ""
echo -e "${YELLOW}❓${NC} Did you build/configure/learn something significant?"
echo ""
echo "If YES, you MUST update the appropriate semantic file(s):"
echo ""
echo "  • New integration/tech setup?"
echo "    → Update memory/semantic/infrastructure.md"
echo "    → Run: ./scripts/memory ingest memory/semantic/infrastructure.md"
echo ""
echo "  • New lesson/mistake/pattern?"
echo "    → Update memory/semantic/lessons-learned.md"
echo "    → Run: ./scripts/memory ingest memory/semantic/lessons-learned.md"
echo ""
echo "  • Team/org change?"
echo "    → Update memory/semantic/team.md or company.md"
echo "    → Run: ./scripts/memory ingest memory/semantic/[file].md"
echo ""
echo "  • New protocol/procedure?"
echo "    → Update memory/semantic/protocols.md"
echo "    → Run: ./scripts/memory ingest memory/semantic/protocols.md"
echo ""
read -p "Have you updated semantic files if needed? (y/n): " semantic_done

if [ "$semantic_done" != "y" ]; then
    echo -e "${RED}✗${NC} Semantic files not updated"
    all_done=false
else
    echo -e "${GREEN}✓${NC} Semantic files confirmed updated"
fi

echo ""
echo "Step 3: Verification"
echo "--------------------"

if $all_done; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Session end protocol complete. Safe to close."
    exit 0
else
    echo -e "${RED}❌ Session end incomplete${NC}"
    echo ""
    echo "Please complete the missing steps above before closing."
    exit 1
fi
