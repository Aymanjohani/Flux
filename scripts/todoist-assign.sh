#!/bin/bash
# Todoist Task Assignment Script with Telegram Notifications
# Usage: ./scripts/todoist-assign.sh <task_id> <assignee_name> [--notify]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
TEAM_FILE="$WORKSPACE_DIR/config/todoist-team.json"
TODOIST_TOKEN="${TODOIST_API_TOKEN:-$(jq -r '.api_token' ~/.config/todoist-cli/config.json 2>/dev/null)}"

if [ -z "$TODOIST_TOKEN" ]; then
    echo "❌ Error: TODOIST_API_TOKEN not found"
    exit 1
fi

if [ $# -lt 2 ]; then
    echo "Usage: $0 <task_id> <assignee_name> [--notify]"
    echo ""
    echo "Available assignees:"
    jq -r '.team | to_entries[] | "  • \(.key) - \(.value.name) (\(.value.role))"' "$TEAM_FILE"
    exit 1
fi

TASK_ID="$1"
ASSIGNEE_NAME="$2"
NOTIFY="$3"

# Get assignee info from team file
ASSIGNEE_DATA=$(jq -r ".team.\"$ASSIGNEE_NAME\"" "$TEAM_FILE")

if [ "$ASSIGNEE_DATA" = "null" ]; then
    echo "❌ Error: Assignee '$ASSIGNEE_NAME' not found in team file"
    echo ""
    echo "Available assignees:"
    jq -r '.team | to_entries[] | "  • \(.key) - \(.value.name)"' "$TEAM_FILE"
    exit 1
fi

TODOIST_ID=$(echo "$ASSIGNEE_DATA" | jq -r '.todoist_id')
TELEGRAM_ID=$(echo "$ASSIGNEE_DATA" | jq -r '.telegram_id')
FULL_NAME=$(echo "$ASSIGNEE_DATA" | jq -r '.name')

if [ "$TODOIST_ID" = "null" ]; then
    echo "❌ Error: No Todoist ID found for $ASSIGNEE_NAME"
    exit 1
fi

# Assign the task
echo "📋 Assigning task $TASK_ID to $FULL_NAME..."
RESULT=$(curl -s -X POST "https://api.todoist.com/rest/v2/tasks/$TASK_ID" \
    -H "Authorization: Bearer $TODOIST_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"assignee_id\": \"$TODOIST_ID\"}")

TASK_CONTENT=$(echo "$RESULT" | jq -r '.content')
TASK_DUE=$(echo "$RESULT" | jq -r '.due.string // "No due date"')
TASK_PRIORITY=$(echo "$RESULT" | jq -r '.priority')
TASK_URL=$(echo "$RESULT" | jq -r '.url')

# Map priority number to label
case $TASK_PRIORITY in
    4) PRIORITY_LABEL="P1 (Urgent)" ;;
    3) PRIORITY_LABEL="P2 (High)" ;;
    2) PRIORITY_LABEL="P3 (Medium)" ;;
    1) PRIORITY_LABEL="P4 (Low)" ;;
    *) PRIORITY_LABEL="No priority" ;;
esac

echo "✅ Assigned: $TASK_CONTENT"
echo "   To: $FULL_NAME"
echo "   Due: $TASK_DUE"
echo "   Priority: $PRIORITY_LABEL"

echo ""
echo "Done! Todoist will notify $FULL_NAME. ✨"
