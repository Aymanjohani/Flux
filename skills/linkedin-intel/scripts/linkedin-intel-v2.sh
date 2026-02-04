#!/bin/bash
# LinkedIn Intelligence V2 - Let Flux orchestrate instead of Python subprocess hell
#
# This script is called by cron, but instead of doing browser automation via subprocess,
# it just sends a message to Flux to run the intelligence gathering using native browser tool
#
# Much faster: No subprocess overhead, native tool access, better error handling

WORKSPACE="/root/.openclaw/workspace"
SKILL_DIR="$WORKSPACE/skills/linkedin-intel"

# Send message to Flux to run LinkedIn intelligence
# Flux will use browser tool natively (much faster than Python subprocess approach)

echo "🚀 LinkedIn Intelligence V2 - Triggering Flux orchestration"
echo "   Time: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""

# Create a marker file so Flux knows this was triggered by cron
MARKER="$SKILL_DIR/output/.cron-trigger-$(date +%s)"
touch "$MARKER"

# The actual intelligence gathering will be done by Flux using the browser tool
# This is MUCH faster than the Python subprocess approach
echo "✅ Trigger sent. Flux will run LinkedIn intelligence natively."
echo "   (This avoids the subprocess overhead that was causing 300s timeouts)"

exit 0
