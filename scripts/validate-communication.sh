#!/bin/bash
# Communication Validation Script
# Use before sending newsletters, formal emails, or reports

set -e

TEAM_FILE="/root/.openclaw/workspace/memory/semantic/team.md"
GUIDELINES="/root/.openclaw/workspace/memory/semantic/communication-guidelines.md"

echo "📋 Communication Validation Checklist"
echo "======================================"
echo ""

# Check if guidelines exist
if [ ! -f "$GUIDELINES" ]; then
    echo "⚠️  communication-guidelines.md not found!"
    exit 1
fi

if [ ! -f "$TEAM_FILE" ]; then
    echo "⚠️  team.md not found!"
    exit 1
fi

echo "✅ Communication guidelines loaded"
echo ""

# Interactive validation
echo "Answer yes/no to each question:"
echo ""

read -p "1. Is this a professional/formal communication? (y/n): " formal
if [ "$formal" = "y" ]; then
    read -p "   - No emojis used? (y/n): " no_emoji
    read -p "   - Professional tone (not casual)? (y/n): " prof_tone
    read -p "   - Proper structure/formatting? (y/n): " structure
    
    if [ "$no_emoji" != "y" ] || [ "$prof_tone" != "y" ] || [ "$structure" != "y" ]; then
        echo ""
        echo "❌ FAILED: Professional standards not met"
        echo "   Review: $GUIDELINES"
        exit 1
    fi
fi

read -p "2. Does this include email recipients? (y/n): " has_emails
if [ "$has_emails" = "y" ]; then
    echo ""
    echo "   Known email addresses (from team.md):"
    grep -E "@iiotsolutions\.sa" "$TEAM_FILE" | grep -v "^\*\*" | sed 's/^/   - /'
    echo ""
    read -p "   - All emails verified against team.md? (y/n): " emails_verified
    read -p "   - Recipients appropriate for context? (y/n): " recipients_ok
    
    if [ "$emails_verified" != "y" ] || [ "$recipients_ok" != "y" ]; then
        echo ""
        echo "❌ FAILED: Email validation incomplete"
        echo "   Check: $TEAM_FILE"
        exit 1
    fi
fi

read -p "3. Is this for a specific project/meeting? (y/n): " has_project
if [ "$has_project" = "y" ]; then
    echo ""
    echo "   Known project teams (from team.md):"
    grep -A 10 "## Active Projects" "$TEAM_FILE" | grep -E "@iiotsolutions\.sa|NOT on" | sed 's/^/   - /'
    echo ""
    read -p "   - Team members verified against project docs? (y/n): " team_verified
    
    if [ "$team_verified" != "y" ]; then
        echo ""
        echo "❌ FAILED: Project team not verified"
        echo "   Check: $TEAM_FILE (Active Projects section)"
        exit 1
    fi
fi

read -p "4. Content proofread for errors? (y/n): " proofread

if [ "$proofread" != "y" ]; then
    echo ""
    echo "⚠️  WARNING: Content not proofread"
    echo ""
fi

echo ""
echo "✅ VALIDATION COMPLETE"
echo ""
echo "Checklist summary:"
[ "$formal" = "y" ] && echo "  ✓ Professional standards verified"
[ "$has_emails" = "y" ] && echo "  ✓ Emails validated"
[ "$has_project" = "y" ] && echo "  ✓ Project team verified"
[ "$proofread" = "y" ] && echo "  ✓ Content proofread"
echo ""
echo "Safe to send! 📤"
