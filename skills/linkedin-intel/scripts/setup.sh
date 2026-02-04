#!/usr/bin/env bash
set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILL_DIR"

echo "🔧 Setting up linkedin-intel skill..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install --quiet --upgrade pip
pip install linkedin-api requests

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create LinkedIn account with coding@iiotsolutions.sa"
echo "2. Save credentials: ./scripts/save-credentials.sh"
echo "3. Test connection: ./scripts/test-connection.sh"
