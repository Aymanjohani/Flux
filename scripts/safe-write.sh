#!/bin/bash
# Safe file writer with locking
# Usage: safe-write.sh <file> <content>
# Content can be piped or passed as argument

FILE="$1"
shift
CONTENT="$*"

if [ -z "$FILE" ]; then
    echo "Usage: safe-write.sh <file> <content>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_SCRIPT="$SCRIPT_DIR/file-lock.sh"

# Acquire lock
if ! "$LOCK_SCRIPT" acquire "$FILE"; then
    echo "Failed to acquire lock for $FILE"
    exit 1
fi

# Trap to ensure lock is released even on error
trap "$LOCK_SCRIPT release '$FILE'" EXIT

# Read from stdin if no content provided
if [ -z "$CONTENT" ] && [ ! -t 0 ]; then
    CONTENT=$(cat)
fi

# Write the content
if [ -n "$CONTENT" ]; then
    echo "$CONTENT" > "$FILE"
    echo "✓ Safely wrote to: $FILE"
else
    echo "✗ No content provided"
    exit 1
fi
