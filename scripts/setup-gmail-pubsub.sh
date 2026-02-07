#!/bin/bash
# Gmail Pub/Sub Setup Script (E3)
# Run this after `gcloud auth login` to set up Gmail push notifications.
#
# Prerequisites:
#   - gcloud auth login (interactive)
#   - gog v0.9.0+
#   - Project: awesome-aspect-486106-p8
#
# Usage: ./scripts/setup-gmail-pubsub.sh

set -euo pipefail

PROJECT="awesome-aspect-486106-p8"
TOPIC="gog-gmail-watch"
ACCOUNT="coding@iiotsolutions.sa"

echo "=== E3: Gmail Pub/Sub Setup ==="
echo ""

# Step 1: Enable APIs
echo "1. Enabling Gmail & Pub/Sub APIs..."
gcloud services enable gmail.googleapis.com pubsub.googleapis.com --project="$PROJECT"
echo "   ✓ APIs enabled"

# Step 2: Create Pub/Sub topic
echo "2. Creating Pub/Sub topic..."
gcloud pubsub topics create "$TOPIC" --project="$PROJECT" 2>/dev/null || echo "   (topic already exists)"
echo "   ✓ Topic: $TOPIC"

# Step 3: Grant Gmail publish access
echo "3. Granting Gmail service account publish access..."
gcloud pubsub topics add-iam-policy-binding "$TOPIC" \
  --project="$PROJECT" \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher" 2>/dev/null || echo "   (binding may already exist)"
echo "   ✓ IAM binding set"

# Step 4: Start Gmail watch
echo "4. Starting Gmail watch..."
gog gmail watch start \
  --account "$ACCOUNT" \
  --label INBOX \
  --topic "projects/$PROJECT/topics/$TOPIC"
echo "   ✓ Gmail watch started"

# Step 5: Verify
echo ""
echo "5. Verifying..."
gog gmail watch status --account "$ACCOUNT"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  - OpenClaw hooks already configured in openclaw.json"
echo "  - Start the push handler: openclaw webhooks gmail run"
echo "  - Or manual: gog gmail watch serve --account $ACCOUNT --bind 127.0.0.1 --port 8788 --path /gmail-pubsub --hook-url http://127.0.0.1:18789/hooks/gmail --hook-token 7f6dbff8a583eb973b1af58041416900938370e7 --include-body --max-bytes 20000"
