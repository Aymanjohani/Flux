#!/usr/bin/env bash
set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILL_DIR"

echo "🔍 Testing LinkedIn Connection"
echo "================================"
echo ""

# Check setup
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run: ./scripts/setup.sh"
    exit 1
fi

if [ ! -f "config/credentials.json" ]; then
    echo "❌ Credentials not found. Run: ./scripts/save-credentials.sh"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Test connection
python3 <<EOF
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path("scripts/lib")))

from linkedin_client import LinkedInClient
from rate_limiter import RateLimiter

print("🔐 Authenticating...")
rate_limiter = RateLimiter()
client = LinkedInClient(Path("config/credentials.json"), rate_limiter)

if client.authenticate():
    print("✅ Authentication successful!")
    print("")
    print("📊 Rate limit status:")
    stats = rate_limiter.get_stats()
    print(f"   Requests (last hour): {stats['last_hour']}/{stats['limits']['max_requests_per_hour']}")
    print(f"   Requests (last day): {stats['last_day']}/{stats['limits']['max_requests_per_day']}")
    print("")
    print("✅ LinkedIn intelligence skill is ready!")
    print("")
    print("Next: ./scripts/daily-intel.py")
else:
    print("❌ Authentication failed")
    print("")
    print("Troubleshooting:")
    print("  1. Check credentials in config/credentials.json")
    print("  2. Verify LinkedIn account is active")
    print("  3. Check for CAPTCHA or security challenge on LinkedIn.com")
    sys.exit(1)
EOF
