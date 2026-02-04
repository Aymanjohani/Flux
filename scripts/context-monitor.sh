#!/bin/bash
# Context Monitor - Check session sizes and warn/compress when too large
# Run via cron every 10 minutes

SESSIONS_DIR="/root/.openclaw/agents/main/sessions"
MEMORY_DIR="/root/.openclaw/workspace/memory"
LOG_FILE="/root/.openclaw/logs/context-monitor.log"
MAX_SESSION_SIZE_KB=300  # ~75k tokens (1 token ≈ 4 bytes, so 300KB ≈ 75k tokens) - auto archive
WARN_SIZE_KB=200         # ~50k tokens - warning

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1" >> "$LOG_FILE"
}

# Find session transcript files
for session_file in "$SESSIONS_DIR"/*.jsonl; do
    [ -f "$session_file" ] || continue

    # Get file size in KB
    size_kb=$(du -k "$session_file" 2>/dev/null | cut -f1)
    [ -z "$size_kb" ] && continue

    session_name=$(basename "$session_file" .jsonl)

    if [ "$size_kb" -gt "$MAX_SESSION_SIZE_KB" ]; then
        log "CRITICAL: Session $session_name is ${size_kb}KB (>${MAX_SESSION_SIZE_KB}KB)"

        # Save session summary to memory
        today=$(date +%Y-%m-%d)
        summary_file="$MEMORY_DIR/${today}-auto-saved-${session_name:0:8}.md"

        # Extract last 50 lines as summary
        echo "# Auto-saved Session: $(date -u)" > "$summary_file"
        echo "" >> "$summary_file"
        echo "**Session:** $session_name" >> "$summary_file"
        echo "**Size:** ${size_kb}KB (auto-saved due to size limit)" >> "$summary_file"
        echo "" >> "$summary_file"
        echo "## Recent Content (last 50 entries)" >> "$summary_file"
        echo '```' >> "$summary_file"
        tail -50 "$session_file" | jq -r '.content // .text // .message // empty' 2>/dev/null | head -100 >> "$summary_file"
        echo '```' >> "$summary_file"

        log "Saved summary to $summary_file"

        # Archive and clear the session
        archive_file="$SESSIONS_DIR/archived-$(date +%Y%m%d-%H%M%S)-${session_name}.jsonl"
        mv "$session_file" "$archive_file"
        gzip "$archive_file" 2>/dev/null

        log "Archived session to ${archive_file}.gz"

    elif [ "$size_kb" -gt "$WARN_SIZE_KB" ]; then
        log "WARN: Session $session_name is ${size_kb}KB (>${WARN_SIZE_KB}KB) - approaching limit"
    fi
done

# Clean up old archives (keep last 7 days)
find "$SESSIONS_DIR" -name "archived-*.jsonl.gz" -mtime +7 -delete 2>/dev/null

log "OK: Context monitor check complete"
