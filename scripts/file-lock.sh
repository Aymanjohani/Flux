#!/bin/bash
# File locking utility for concurrent session safety
# Usage: 
#   file-lock.sh acquire <file> - Get exclusive lock (waits up to 30s)
#   file-lock.sh release <file> - Release lock
#   file-lock.sh check <file> - Check if locked (exit 0=locked, 1=free)

LOCKDIR="/tmp/openclaw-locks"
mkdir -p "$LOCKDIR"

ACTION="$1"
FILE="$2"

if [ -z "$FILE" ]; then
    echo "Usage: file-lock.sh {acquire|release|check} <file-path>"
    exit 1
fi

# Create safe lock name from file path
LOCK_NAME=$(echo "$FILE" | sed 's/\//_/g' | sed 's/^_//')
LOCK_FILE="$LOCKDIR/$LOCK_NAME.lock"

case "$ACTION" in
    acquire)
        # Wait up to 30 seconds for lock
        for i in {1..30}; do
            if mkdir "$LOCK_FILE" 2>/dev/null; then
                # Got the lock
                echo $$ > "$LOCK_FILE/pid"
                echo "✓ Lock acquired: $FILE"
                exit 0
            fi
            
            # Check if lock is stale (>5 minutes old)
            if [ -d "$LOCK_FILE" ]; then
                lock_age=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE")))
                if [ $lock_age -gt 300 ]; then
                    echo "⚠ Removing stale lock (${lock_age}s old)"
                    rm -rf "$LOCK_FILE"
                    continue
                fi
            fi
            
            sleep 1
        done
        
        echo "✗ Failed to acquire lock after 30s: $FILE"
        exit 1
        ;;
        
    release)
        if [ -d "$LOCK_FILE" ]; then
            rm -rf "$LOCK_FILE"
            echo "✓ Lock released: $FILE"
        fi
        exit 0
        ;;
        
    check)
        if [ -d "$LOCK_FILE" ]; then
            # Check if lock is stale
            lock_age=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE")))
            if [ $lock_age -gt 300 ]; then
                echo "stale"
                exit 2
            fi
            echo "locked"
            exit 0
        else
            echo "free"
            exit 1
        fi
        ;;
        
    *)
        echo "Unknown action: $ACTION"
        echo "Usage: file-lock.sh {acquire|release|check} <file-path>"
        exit 1
        ;;
esac
