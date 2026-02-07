#!/bin/bash
# Cron Wrapper - Wraps cron job scripts to catch and log failures
#
# Usage: cron-wrapper.sh <script-path> [args...]
# Example: cron-wrapper.sh ./scripts/summarize-brief.sh
#
# On failure: appends to cron-failures.log with timestamp, script, exit code, and last output

set -uo pipefail

FAILURES_LOG="/root/.openclaw/logs/cron-failures.log"
mkdir -p "$(dirname "$FAILURES_LOG")"

if [ $# -lt 1 ]; then
    echo "Usage: cron-wrapper.sh <script-path> [args...]" >&2
    exit 1
fi

SCRIPT="$1"
shift

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SCRIPT_NAME=$(basename "$SCRIPT")

# Run the script, capturing output
OUTPUT=$("$SCRIPT" "$@" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    LAST_OUTPUT=$(echo "$OUTPUT" | tail -20)
    cat >> "$FAILURES_LOG" << EOF
---
[${TIMESTAMP}] FAILURE: ${SCRIPT_NAME}
Exit code: ${EXIT_CODE}
Script: ${SCRIPT}
Last output:
${LAST_OUTPUT}
---
EOF
    echo "[${TIMESTAMP}] cron-wrapper: ${SCRIPT_NAME} failed with exit code ${EXIT_CODE}" >&2
fi

exit $EXIT_CODE
