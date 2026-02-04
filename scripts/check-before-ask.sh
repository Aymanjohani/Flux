#!/bin/bash
# Check Before Ask - Pre-flight check script
# Searches for information before asking the user
#
# Usage: ./scripts/check-before-ask.sh "what I'm looking for"
#
# This script helps enforce the "Check Before Ask" discipline from goals.md

set -euo pipefail

WORKSPACE="/root/.openclaw/workspace"
QUERY="${1:-}"

if [ -z "$QUERY" ]; then
    echo "❌ Usage: $0 \"what I'm looking for\""
    echo ""
    echo "Example: $0 \"groq api key\""
    exit 1
fi

echo "🔍 Check Before Ask - Searching for: \"$QUERY\""
echo "================================================"
echo ""

FOUND_ANYTHING=false

# 1. Check Gateway Config
echo "📋 [1/6] Checking Gateway Config..."
if openclaw gateway config.get 2>/dev/null | grep -i "$QUERY" > /dev/null 2>&1; then
    echo "   ✅ FOUND in gateway config!"
    echo ""
    openclaw gateway config.get 2>/dev/null | grep -i -C 3 "$QUERY" | head -20
    echo ""
    FOUND_ANYTHING=true
else
    echo "   ❌ Not in gateway config"
fi
echo ""

# 2. Check Vector Memory
echo "🧠 [2/6] Searching Vector Memory..."
MEMORY_RESULT=$(cd "$WORKSPACE" && ./scripts/memory retrieve "$QUERY" 2>/dev/null | head -30)
if [ -n "$MEMORY_RESULT" ]; then
    echo "   ✅ FOUND in vector memory!"
    echo ""
    echo "$MEMORY_RESULT"
    echo ""
    FOUND_ANYTHING=true
else
    echo "   ❌ Not in vector memory"
fi
echo ""

# 3. Check Memory Files (state.json, config-state.md, etc.)
echo "📁 [3/6] Searching Memory Files..."
MEMORY_FILES=(
    "$WORKSPACE/memory/state.json"
    "$WORKSPACE/memory/config-state.md"
    "$WORKSPACE/memory/active-work.md"
    "$WORKSPACE/memory/today-brief.md"
)

for file in "${MEMORY_FILES[@]}"; do
    if [ -f "$file" ] && grep -i "$QUERY" "$file" > /dev/null 2>&1; then
        echo "   ✅ FOUND in $(basename $file)!"
        echo ""
        grep -i -C 3 "$QUERY" "$file" | head -20
        echo ""
        FOUND_ANYTHING=true
        break
    fi
done

if [ "$FOUND_ANYTHING" = false ]; then
    echo "   ❌ Not in memory files"
    echo ""
fi

# 4. Check Environment Variables
echo "🌍 [4/6] Checking Environment Variables..."
if env | grep -i "$QUERY" > /dev/null 2>&1; then
    echo "   ✅ FOUND in environment!"
    echo ""
    env | grep -i "$QUERY" | head -10
    echo ""
    FOUND_ANYTHING=true
else
    echo "   ❌ Not in environment"
fi
echo ""

# 5. Check Shell Config (~/.bashrc, ~/.profile)
echo "🐚 [5/6] Checking Shell Config..."
SHELL_FILES=(
    "$HOME/.bashrc"
    "$HOME/.profile"
    "$HOME/.bash_profile"
)

for file in "${SHELL_FILES[@]}"; do
    if [ -f "$file" ] && grep -i "$QUERY" "$file" > /dev/null 2>&1; then
        echo "   ✅ FOUND in $(basename $file)!"
        echo ""
        grep -i -C 3 "$QUERY" "$file" | head -20
        echo ""
        FOUND_ANYTHING=true
        break
    fi
done

if [ "$FOUND_ANYTHING" = false ]; then
    echo "   ❌ Not in shell config"
    echo ""
fi

# 6. Check Workspace Config Files
echo "⚙️  [6/6] Searching Workspace Config..."
CONFIG_LOCATIONS=(
    "$WORKSPACE/config/"
    "$HOME/.config/"
    "$HOME/.openclaw/"
)

for location in "${CONFIG_LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
        RESULTS=$(find "$location" -type f -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.env" 2>/dev/null | \
                  xargs grep -li "$QUERY" 2>/dev/null | head -5)
        
        if [ -n "$RESULTS" ]; then
            echo "   ✅ FOUND in $(basename $location)!"
            echo ""
            echo "$RESULTS" | while read -r file; do
                echo "   File: $file"
                grep -i -C 2 "$QUERY" "$file" 2>/dev/null | head -10
                echo ""
            done
            FOUND_ANYTHING=true
            break
        fi
    fi
done

if [ "$FOUND_ANYTHING" = false ]; then
    echo "   ❌ Not in workspace config"
fi

echo ""
echo "================================================"

# Final verdict
if [ "$FOUND_ANYTHING" = true ]; then
    echo "✅ ANSWER FOUND - Information exists! Check results above."
    echo ""
    echo "💡 Next step: Use the information found (don't ask user)"
    exit 0
else
    echo "❌ NOT FOUND - Information doesn't exist in accessible locations."
    echo ""
    echo "✅ Safe to ask user for: \"$QUERY\""
    echo ""
    echo "📝 Once you get the answer, consider adding it to:"
    echo "   - memory/semantic/ files (for searchable knowledge)"
    echo "   - memory/config-state.md (for config reference)"
    echo "   - memory/state.json (for current state)"
    exit 1
fi
