#!/usr/bin/env bash
set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_DIR="$SKILL_DIR/config"
CREDS_FILE="$CONFIG_DIR/credentials.json"

echo "🔐 LinkedIn Credentials Setup"
echo "================================"
echo ""

# Check if credentials already exist
if [ -f "$CREDS_FILE" ]; then
    echo "⚠️  Credentials already exist at: $CREDS_FILE"
    read -p "Overwrite? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Prompt for credentials
echo "Enter LinkedIn credentials (will be stored locally only):"
echo ""
read -p "Email: " email
read -sp "Password: " password
echo ""
echo ""

# Validate
if [ -z "$email" ] || [ -z "$password" ]; then
    echo "❌ Email and password are required"
    exit 1
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Save credentials
cat > "$CREDS_FILE" <<EOF
{
  "email": "$email",
  "password": "$password"
}
EOF

# Secure the file
chmod 600 "$CREDS_FILE"

echo "✅ Credentials saved to: $CREDS_FILE"
echo ""
echo "Next step: ./scripts/test-connection.sh"
