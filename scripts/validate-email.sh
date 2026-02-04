#!/bin/bash
# Email validation script - check before sending
# Usage: ./validate-email.sh [--to emails] [--type newsletter|formal|internal]

set -e

WORKSPACE="/root/.openclaw/workspace"
TEAM_FILE="$WORKSPACE/memory/semantic/team.md"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
TO_EMAILS=""
EMAIL_TYPE="internal"
SUBJECT=""
PROJECT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --to)
      TO_EMAILS="$2"
      shift 2
      ;;
    --type)
      EMAIL_TYPE="$2"
      shift 2
      ;;
    --subject)
      SUBJECT="$2"
      shift 2
      ;;
    --project)
      PROJECT="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

echo "📧 Email Validation Checklist"
echo "=============================="
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Validate email addresses against team.md
if [ -n "$TO_EMAILS" ]; then
  echo "✓ Checking email addresses..."
  IFS=',' read -ra EMAILS <<< "$TO_EMAILS"
  
  for email in "${EMAILS[@]}"; do
    email=$(echo "$email" | xargs) # trim whitespace
    
    # Check if it's an @iiotsolutions.sa email
    if [[ "$email" == *"@iiotsolutions.sa"* ]]; then
      # Verify it exists in team.md
      if grep -q "$email" "$TEAM_FILE"; then
        echo -e "  ${GREEN}✓${NC} $email - Valid"
      else
        echo -e "  ${RED}✗${NC} $email - NOT FOUND in team.md"
        ERRORS=$((ERRORS + 1))
        
        # Suggest alternatives
        username=$(echo "$email" | cut -d'@' -f1)
        echo "    Did you mean one of these?"
        grep -o '[a-z]*@iiotsolutions\.sa' "$TEAM_FILE" | grep -i "$username" | head -3 | sed 's/^/      → /'
      fi
    else
      # External email - just note it
      echo -e "  ${YELLOW}⚠${NC} $email - External (not validated)"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
  echo ""
fi

# Check 2: Validate project team if specified
if [ -n "$PROJECT" ]; then
  echo "✓ Checking project team membership..."
  
  case "$PROJECT" in
    kiswa|KESWA)
      VALID_TEAM=("ayman@iiotsolutions.sa" "aadil@iiotsolutions.sa" "amro@iiotsolutions.sa" "abdulrahman@iiotsolutions.sa" "hamza@iiotsolutions.sa")
      ;;
    *)
      echo -e "  ${YELLOW}⚠${NC} Project '$PROJECT' not recognized - skipping team check"
      WARNINGS=$((WARNINGS + 1))
      VALID_TEAM=()
      ;;
  esac
  
  if [ ${#VALID_TEAM[@]} -gt 0 ]; then
    for email in "${EMAILS[@]}"; do
      email=$(echo "$email" | xargs)
      
      # Skip external emails
      if [[ "$email" != *"@iiotsolutions.sa"* ]]; then
        continue
      fi
      
      # Check if in project team
      if [[ " ${VALID_TEAM[@]} " =~ " ${email} " ]]; then
        echo -e "  ${GREEN}✓${NC} $email is on $PROJECT team"
      else
        echo -e "  ${RED}✗${NC} $email is NOT on $PROJECT team"
        echo "    Valid team members:"
        for member in "${VALID_TEAM[@]}"; do
          echo "      → $member"
        done
        ERRORS=$((ERRORS + 1))
      fi
    done
  fi
  echo ""
fi

# Check 3: Email type guidelines
echo "✓ Checking communication guidelines..."
case "$EMAIL_TYPE" in
  newsletter)
    echo "  📋 Newsletter checklist:"
    echo "    • Professional/corporate tone (no casual language)"
    echo "    • No emojis"
    echo "    • Formal structure (greeting, body, signature)"
    echo "    • Proofread for typos"
    ;;
  formal)
    echo "  📋 Formal email checklist:"
    echo "    • Professional tone"
    echo "    • Clear subject line"
    echo "    • Proper greeting/closing"
    ;;
  internal)
    echo "  📋 Internal email - casual tone OK"
    ;;
esac
echo ""

# Summary
echo "=============================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ $WARNINGS warning(s) - proceed with caution${NC}"
  exit 0
else
  echo -e "${RED}✗ $ERRORS error(s) found - DO NOT SEND${NC}"
  exit 1
fi
