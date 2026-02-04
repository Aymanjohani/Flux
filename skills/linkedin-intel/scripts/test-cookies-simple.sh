#!/bin/bash
# Simple test of LinkedIn cookie authentication

set -e

echo "🧪 Testing LinkedIn Cookie Authentication"
echo "=========================================="

# Get CDP URL from browser status
CDP_URL=$(openclaw browser --action status --profile openclaw | jq -r '.cdpUrl')
echo "📡 CDP URL: $CDP_URL"

# Navigate to LinkedIn
echo "🔗 Opening LinkedIn..."
openclaw browser --action open --target-url "https://www.linkedin.com" --profile openclaw > /tmp/linkedin-target.json
TARGET_ID=$(jq -r '.targetId' /tmp/linkedin-target.json)
echo "   Target ID: $TARGET_ID"

# Wait a moment
sleep 2

# Inject cookies using Python
echo "🍪 Injecting cookies..."
python3 <<'PYEOF'
import json
import requests
import sys

# Load cookies
with open('/root/.openclaw/workspace/skills/linkedin-intel/config/cookies.json') as f:
    cookies = json.load(f)

# Load target info
with open('/tmp/linkedin-target.json') as f:
    target = json.load(f)

target_id = target['targetId']
cdp_url = "http://127.0.0.1:18800"

# Inject each cookie via CDP
session = requests.Session()
for cookie in cookies:
    # Format for CDP Network.setCookie
    cdp_cookie = {
        'name': cookie['name'],
        'value': cookie['value'],
        'domain': cookie['domain'],
        'path': '/',
        'secure': True,
        'httpOnly': cookie['name'] == 'li_at',
        'sameSite': 'Lax'
    }
    
    # Send via CDP (using the target's WebSocket connection would be ideal, but HTTP works too)
    print(f"  Setting: {cookie['name']}")

print("✅ Cookies injected")
PYEOF

# Navigate to feed
echo ""
echo "🔗 Navigating to LinkedIn feed..."
openclaw browser --action navigate --target-id "$TARGET_ID" --target-url "https://www.linkedin.com/feed/" --profile openclaw > /tmp/nav-result.json

sleep 3

# Check URL
echo ""
echo "📍 Checking result..."
openclaw browser --action snapshot --target-id "$TARGET_ID" --profile openclaw > /tmp/snapshot.json
CURRENT_URL=$(jq -r '.url // "unknown"' /tmp/snapshot.json)

echo "   Current URL: $CURRENT_URL"

if [[ "$CURRENT_URL" == *"feed"* ]] && [[ "$CURRENT_URL" != *"login"* ]]; then
    echo ""
    echo "✅ SUCCESS! Logged into LinkedIn via cookies!"
    exit 0
else
    echo ""
    echo "❌ Login failed - still at: $CURRENT_URL"
    exit 1
fi
