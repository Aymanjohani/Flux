#!/bin/bash
# Auto-cleanup script for auto-saved session files
# Archives auto-saved files older than 24 hours

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
ARCHIVE_DIR="$MEMORY_DIR/archive/auto-saved"

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Find and move auto-saved files older than 24 hours
find "$MEMORY_DIR" -maxdepth 1 -name "*auto-saved*.md" -mtime +1 -type f | while read -r file; do
    filename=$(basename "$file")
    echo "📦 Archiving: $filename (>24h old)"
    mv "$file" "$ARCHIVE_DIR/"
done

# Count remaining auto-saved files
remaining=$(find "$MEMORY_DIR" -maxdepth 1 -name "*auto-saved*.md" -type f | wc -l)
archived=$(find "$ARCHIVE_DIR" -name "*auto-saved*.md" -type f | wc -l)

echo "✅ Cleanup complete"
echo "   Active: $remaining auto-saved files"
echo "   Archived: $archived auto-saved files"
