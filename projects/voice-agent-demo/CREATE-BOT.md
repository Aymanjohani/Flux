# Interactive Meeting Bot - Ready to Use!

## ✅ What's Running

1. **WebSocket Server** - Port 3000 (Python server with OpenAI Realtime API)
2. **Cloudflare Tunnel** - Public HTTPS URL with WebSocket support
3. **Public URL:** `https://sponsors-nominated-group-qty.trycloudflare.com`

## 🚀 How to Use

### Step 1: Create a Test Meeting
Create a Google Meet or Zoom meeting to test with.

### Step 2: Create the Bot

Use this command (replace `YOUR_MEETING_URL` with your actual meeting link):

```bash
curl --request POST \
  --url https://eu-central-1.recall.ai/api/v1/bot/ \
  --header 'Authorization: Token 4465e2ccbbc3d295dbcb0af9dc1438e2a3ad5a12' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "meeting_url": "YOUR_MEETING_URL",
    "bot_name": "IIoT Solutions Assistant",
    "output_media": {
      "camera": {
        "kind": "webpage",
        "config": {
          "url": "https://recallai-demo.netlify.app?wss=wss://sponsors-nominated-group-qty.trycloudflare.com"
        }
      }
    }
  }'
```

### Step 3: Test It!
1. The bot will join your meeting
2. Start talking - it will respond with voice
3. The bot uses OpenAI's real-time voice model
4. Current configuration is in `python-server/.env`

## 📊 Monitoring

### Check Server Status
```bash
ps aux | grep "python server.py"
```

### Check Logs
```bash
# Python server logs
cd /root/.openclaw/workspace/voice-agent-demo/python-server
tail -f nohup.out

# Cloudflare tunnel logs  
# (running in OpenClaw session: calm-nexus)
```

### Check Active Bots
```bash
curl --request GET \
  --url https://eu-central-1.recall.ai/api/v1/bot/ \
  --header 'Authorization: Token 4465e2ccbbc3d295dbcb0af9dc1438e2a3ad5a12'
```

## 🔧 Configuration

### Change Bot Personality
Edit: `client/src/lib/conversation_config.ts`

### Change OpenAI Model/Settings
Edit: `python-server/server.py`

### OpenAI API Key
Location: `python-server/.env`

## ⚠️ Important Notes

### Cloudflare Tunnel Limitations
- This is a **temporary tunnel** (for testing)
- No uptime guarantee
- May disconnect after some time
- For production: Set up a named tunnel or use your own domain

### Restart Tunnel If Disconnected
```bash
cd /root/.openclaw/workspace/voice-agent-demo
cloudflared tunnel --url http://localhost:3000
```
(New URL will be generated - update bot creation command)

### Costs
- OpenAI Realtime API: **~$8-10 per hour** of conversation
- Make sure your OpenAI account has credits
- Check usage: https://platform.openai.com/usage

## 🎯 Next Steps

### For Production Use:
1. **Set up named Cloudflare Tunnel** (persistent URL)
2. **Or use subdomain:** `bot.iiotsolutions.sa` with SSL certificate
3. **Customize the bot:** Edit conversation config
4. **Add integrations:** HubSpot lookup, calendar checking, etc.
5. **Monitor costs:** Track OpenAI usage

### Quick Test Script

Save this as `test-bot.sh`:
```bash
#!/bin/bash
# Quick bot creation script
read -p "Enter meeting URL: " MEETING_URL

curl --request POST \
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
  }" | jq
```

## 📚 References

- Research: `/root/.openclaw/workspace/research/voice-bot-comparison.md`
- Recall.ai Docs: https://docs.recall.ai/docs/stream-media
- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- Original Demo: https://github.com/recallai/voice-agent-demo

---

**Ready to test!** Just create a meeting and run the curl command above.
