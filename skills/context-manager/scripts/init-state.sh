#!/bin/bash
# Initialize the state.json file for context management

STATE_FILE="/root/.openclaw/workspace/memory/state.json"

if [ -f "$STATE_FILE" ]; then
    echo "state.json already exists at $STATE_FILE"
    echo "To reset, delete the file first: rm $STATE_FILE"
    exit 1
fi

cat > "$STATE_FILE" << 'EOF'
{
  "version": 1,
  "updatedAt": "2026-02-01T03:20:00Z",
  "facts": {
    "user.name": {
      "value": "Ayman",
      "updatedAt": "2026-01-31",
      "source": "USER.md"
    },
    "user.role": {
      "value": "CEO of IIoT Solutions",
      "updatedAt": "2026-01-31",
      "source": "USER.md"
    },
    "user.location": {
      "value": "Jeddah, Saudi Arabia",
      "updatedAt": "2026-01-31",
      "source": "USER.md"
    },
    "user.timezone": {
      "value": "AST (UTC+3)",
      "updatedAt": "2026-01-31",
      "source": "USER.md"
    },
    "company.name": {
      "value": "IIoT Solutions",
      "updatedAt": "2026-01-31",
      "source": "IDENTITY.md"
    },
    "server.location": {
      "value": "France (Hostinger)",
      "updatedAt": "2026-02-01",
      "source": "user correction"
    },
    "server.ip": {
      "value": "76.13.32.56",
      "updatedAt": "2026-01-31",
      "source": "setup"
    },
    "integrations.memorySearch": {
      "value": "enabled (Gemini)",
      "updatedAt": "2026-02-01",
      "source": "config"
    },
    "integrations.braveSearch": {
      "value": "enabled",
      "updatedAt": "2026-01-31",
      "source": "config"
    },
    "integrations.todoist": {
      "value": "connected (shared account)",
      "updatedAt": "2026-01-31",
      "source": "setup"
    }
  },
  "invalidated": [],
  "pendingItems": [
    "HubSpot API access",
    "Dedicated Todoist account",
    "Email/Calendar integration"
  ]
}
EOF

chmod 644 "$STATE_FILE"
echo "Created state.json at $STATE_FILE"
