#!/bin/bash
# Quick bot creation script for IIoT Solutions Interactive Voice Bot

echo "🤖 IIoT Solutions - Interactive Meeting Bot Creator"
echo "================================================"
echo ""
read -p "Enter Google Meet/Zoom URL: " MEETING_URL

if [ -z "$MEETING_URL" ]; then
    echo "❌ Error: Meeting URL cannot be empty"
    exit 1
fi

echo ""
echo "Creating bot for meeting: $MEETING_URL"
echo "Bot name: IIoT Solutions Assistant"
echo ""

RESPONSE=$(curl --silent --request POST \
  --url https://eu-central-1.recall.ai/api/v1/bot/ \
  --header 'Authorization: Token 4465e2ccbbc3d295dbcb0af9dc1438e2a3ad5a12' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data "{
    \"meeting_url\": \"$MEETING_URL\",
    \"bot_name\": \"IIoT Solutions Assistant\",
    \"output_media\": {
      \"camera\": {
        \"kind\": \"webpage\",
        \"config\": {
          \"url\": \"https://recallai-demo.netlify.app?wss=wss://sponsors-nominated-group-qty.trycloudflare.com\"
        }
      }
    }
  }")

echo "$RESPONSE" | jq

BOT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')

if [ -n "$BOT_ID" ]; then
    echo ""
    echo "✅ Bot created successfully!"
    echo "Bot ID: $BOT_ID"
    echo ""
    echo "The bot will join your meeting shortly."
    echo "Start talking to test the voice interaction!"
else
    echo ""
    echo "❌ Failed to create bot. Check the response above for errors."
fi
