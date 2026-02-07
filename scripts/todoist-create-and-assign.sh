#!/bin/bash
# Create Todoist task and assign with notification
# Usage: ./scripts/todoist-create-and-assign.sh <assignee> <task_content> <due_date> <priority> <project> [--notify]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
TEAM_FILE="$WORKSPACE_DIR/config/todoist-team.json"

if [ $# -lt 5 ]; then
    echo "Usage: $0 <assignee> <task_content> <due_date> <priority> <project>"
    echo ""
    echo "Example: $0 hamad \"Review pricing model\" tomorrow 1 \"Management\""
    echo ""
    echo "Available assignees:"
    jq -r '.team | to_entries[] | "  • \(.key) - \(.value.name)"' "$TEAM_FILE"
    exit 1
fi

ASSIGNEE="$1"
TASK_CONTENT="$2"
DUE_DATE="$3"
PRIORITY="$4"
PROJECT="$5"

# Create the task
echo "📝 Creating task: $TASK_CONTENT..."
TASK_ID=$(todoist add "$TASK_CONTENT" --due "$DUE_DATE" --priority "$PRIORITY" --project "$PROJECT" 2>&1 | grep "ID:" | awk '{print $NF}')

if [ -z "$TASK_ID" ]; then
    echo "❌ Error: Failed to create task"
    exit 1
fi

echo "✅ Task created: $TASK_ID"
echo ""

# Assign the task (Todoist handles notifications)
"$SCRIPT_DIR/todoist-assign.sh" "$TASK_ID" "$ASSIGNEE"
