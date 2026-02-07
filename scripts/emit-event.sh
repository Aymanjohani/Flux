#!/bin/bash
# Thin bash wrapper for event-bus.js
# Allows bash scripts to publish events without inline node calls
#
# Usage:
#   emit-event.sh notify "message text"
#   emit-event.sh log <topic> "message text"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ACTION="${1:-notify}"
shift

case "$ACTION" in
    notify)
        MESSAGE="$*"
        node "$SCRIPT_DIR/event-bus.js" notify "$MESSAGE"
        ;;
    log)
        TOPIC="$1"
        shift
        MESSAGE="$*"
        node "$SCRIPT_DIR/event-bus.js" log "$TOPIC" "$MESSAGE"
        ;;
    *)
        echo "Usage: emit-event.sh {notify|log} [topic] <message>"
        exit 1
        ;;
esac
