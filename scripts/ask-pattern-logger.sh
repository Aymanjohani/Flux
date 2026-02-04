#!/bin/bash
# ask-pattern-logger.sh — Track what I ask about vs what already exists
# Usage: ./scripts/ask-pattern-logger.sh log "question" "found|not-found" "source"
#        ./scripts/ask-pattern-logger.sh report

set -euo pipefail

LOG_FILE="/root/.openclaw/workspace/memory/ask-patterns.jsonl"
ACTION="${1:-report}"

case "$ACTION" in
    log)
        QUESTION="$2"
        RESULT="$3"
        SOURCE="${4:-unknown}"
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        
        echo "{\"timestamp\":\"$TIMESTAMP\",\"question\":\"$QUESTION\",\"result\":\"$RESULT\",\"source\":\"$SOURCE\"}" >> "$LOG_FILE"
        echo "✓ Logged: $RESULT ($SOURCE)"
        ;;
        
    report)
        if [[ ! -f "$LOG_FILE" ]]; then
            echo "No patterns logged yet"
            exit 0
        fi
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📊 Ask Pattern Report"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        TOTAL=$(wc -l < "$LOG_FILE")
        FOUND=$(grep -c "\"result\":\"found\"" "$LOG_FILE" || echo "0")
        NOT_FOUND=$(grep -c "\"result\":\"not-found\"" "$LOG_FILE" || echo "0")
        
        echo "Total questions checked: $TOTAL"
        echo "Answer already existed: $FOUND ($(( FOUND * 100 / TOTAL ))%)"
        echo "Legitimately new: $NOT_FOUND ($(( NOT_FOUND * 100 / TOTAL ))%)"
        echo ""
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Most Common Sources (when found):"
        grep "\"result\":\"found\"" "$LOG_FILE" | \
            jq -r '.source' | \
            sort | uniq -c | sort -rn | head -10
        echo ""
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Recent Questions (last 10):"
        tail -10 "$LOG_FILE" | jq -r '"[\(.timestamp)] \(.question) → \(.result) (\(.source))"'
        echo ""
        
        if [[ $FOUND -gt 0 ]] && [[ $TOTAL -gt 0 ]] && [[ $(( FOUND * 100 / TOTAL )) -gt 20 ]]; then
            echo "⚠️  WARNING: >20% of questions had existing answers!"
            echo "   Review patterns and improve check-before-ask habit"
        fi
        ;;
        
    *)
        echo "Usage: $0 {log|report}"
        echo ""
        echo "  log \"question\" \"found|not-found\" \"source\""
        echo "  report"
        exit 1
        ;;
esac
