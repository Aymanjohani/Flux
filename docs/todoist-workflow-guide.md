# Todoist Task Assignment Workflow

## Overview

This workflow makes it easy to create and assign Todoist tasks. Todoist handles all notifications (in-app, push, email) automatically when tasks are assigned.

## Team Reference

All team member info is stored in `config/todoist-team.json`:
- Todoist user IDs
- Telegram IDs (for notifications)
- Email addresses
- Roles

## Quick Commands

### 1. Assign Existing Task

```bash
./scripts/todoist-assign.sh <task_id> <assignee> [--notify]
```

**Examples:**
```bash
# Assign without notification
./scripts/todoist-assign.sh 6fw5qw4j8P6MwMhQ hamad

# Assign with Telegram notification
./scripts/todoist-assign.sh 6fw5qw4j8P6MwMhQ hamad --notify
```

**Available assignees:**
- `ayman` - Ayman AlJohani (CEO)
- `aadil` - Aadil Feroze (CTO)
- `hamad` - Hamad Raza (Head of Digital Solutions)
- `amro` - Amro Abouzied (Solution Architect)
- `mreefah` - Mreefah AlTukhaim (Admin Assistant)
- `amr` - Amr Elmayergy (BD Manager)
- `firas` - Firas Saeed Al Siddiqi (Lead BD)
- `ahmad` - Ahmad Farooq (Developer)
- `abdulrahman` - Abdulrahman Bajabir (Production Engineer)

### 2. Create and Assign Task in One Step

```bash
./scripts/todoist-create-and-assign.sh <assignee> <task_content> <due_date> <priority> <project>
```

**Examples:**
```bash
# Create task for Hamad, due tomorrow, P1
./scripts/todoist-create-and-assign.sh hamad "Review pricing model" tomorrow 1 "Management"

# Create task for Amr, due next week, P2
./scripts/todoist-create-and-assign.sh amr "Follow up with client" "feb 10" 2 "Business Development"

# Create task for Amro, due today, P1
./scripts/todoist-create-and-assign.sh amro "Factory visit preparation" today 1 "Projects Pipeline"
```

**Priority levels:**
- `1` = P1 (Urgent) - Red flag
- `2` = P2 (High) - Orange flag
- `3` = P3 (Medium) - Yellow flag
- `4` = P4 (Low) - No flag

**Common projects:**
- Management
- Business Development
- Proposals
- Projects Pipeline

## Notifications

Todoist handles all notifications automatically:
- In-app notifications
- Push notifications (if Todoist app installed)
- Email notifications (if enabled in user's Todoist settings)

## Flux Usage

When you (Flux) need to assign tasks from conversation:

```bash
# Single assignment
./scripts/todoist-create-and-assign.sh hamad "Send automation engineer job description" today 1 "Management"

# Multiple assignees (create separate tasks)
./scripts/todoist-create-and-assign.sh aadil "Review module-based pricing" tomorrow 1 "Management"
./scripts/todoist-create-and-assign.sh amr "Review module-based pricing" tomorrow 1 "Business Development"
```

## Updating Team Info

To add/update team member info:

1. Edit `config/todoist-team.json`
2. Verify email addresses are correct (for notifications)
3. Update Todoist IDs if they change

**Getting Todoist user IDs:**
```bash
# List collaborators on a shared project
curl -s -X GET "https://api.todoist.com/rest/v2/projects/<project_id>/collaborators" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" | jq '.'
```

## Troubleshooting

**Assignment fails:**
- Check if assignee is a collaborator on the project
- Verify Todoist ID in `config/todoist-team.json`
- Move task to a shared project where they're a collaborator

**User didn't get notified:**
- Check their Todoist notification settings
- Verify they have the mobile app installed (for push notifications)
- Check spam folder for Todoist emails

**Task creation fails:**
- Check project name is correct (case-sensitive)
- Verify due date format (e.g., "today", "tomorrow", "feb 10")
- Check priority is 1-4

## Best Practices

1. **Check project membership** before assigning (script will fail if user isn't a collaborator)
2. **Use clear task names** that include context
3. **Set realistic due dates** based on current workload
4. **Update team file** when new members join
5. **Trust Todoist notifications** - they work properly via API

## Integration with Memory

After creating/assigning tasks, update `memory/active-work.md` if it's a significant action item.

---

**Last updated:** 2026-02-04
