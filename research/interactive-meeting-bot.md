# Interactive Meeting Bot Research
**Date:** 2026-02-02  
**Requested by:** Ayman  
**Goal:** Create a bot that talks and listens in real-time during Google Meet calls

---

## Recommended Solution: Recall.ai + OpenAI Realtime API

**Why this combo:**
- Recall.ai handles the meeting platform integration (joins Google Meet, Zoom, Teams, etc.)
- OpenAI Realtime API provides speech-to-speech AI with natural conversation
- Single model processes audio directly (no speech-to-text → text → text-to-speech pipeline)
- Lower latency, more natural responses

### What It Does
✅ Joins meetings automatically  
✅ Listens to all participants  
✅ Responds with natural voice in real-time  
✅ Can see shared content (with image input)  
✅ Can call functions/APIs during conversation  
✅ Detects emotion, tone, intent  
✅ Switches languages mid-sentence  

---

## How It Works

### Architecture
```
Meeting (Google Meet) 
    ↓
Recall.ai Bot (streams meeting audio to webpage)
    ↓
Your Webpage (hosted publicly via ngrok/VPS)
    ↓
OpenAI Realtime API (processes speech-to-speech)
    ↓
Bot speaks back into meeting
```

### The Flow
1. **You trigger bot** via API call to Recall.ai
2. **Bot joins meeting** as a participant
3. **Bot loads your webpage** (running locally or on VPS)
4. **Webpage receives live audio** from meeting via MediaStream API
5. **Audio streams to OpenAI Realtime API** via WebSocket
6. **OpenAI responds with audio** (speech-to-speech, no transcription step)
7. **Webpage plays audio** → Bot speaks it into meeting
8. **Real-time transcript** available via WebSocket (optional)

---

## Technical Requirements

### Infrastructure
- **Public HTTPS endpoint** for your bot's webpage
  - Can use **ngrok** for testing (tunnels localhost)
  - Production: Host on VPS (we already have Hostinger)
- **Node.js or Python server** for backend logic
- **Frontend webpage** (HTML/CSS/JS) that controls bot behavior

### API Keys Needed
- ✅ **Recall.ai API** (we already have this, EU region)
- ❌ **OpenAI API key** (need to create, add credits)

### Bot Compute Resources
Recall.ai charges based on bot variant:
- `web` (default): 250 millicores CPU, 750MB RAM → **included in base price**
- `web_4_core`: 2250 millicores, 5250MB RAM → **+$0.10/hour**
- `web_gpu`: 6000 millicores, 13250MB RAM, WebGL → **+$1.00/hour**

**Recommendation:** Start with `web_4_core` for smooth real-time processing.

---

## Cost Breakdown

### Recall.ai
- **Meeting bot base rate:** Varies by plan
- **4-core variant:** +$0.10/hour
- **We have:** $5 free credit

### OpenAI Realtime API
**New pricing (Jan 2026, 20% cheaper than preview):**
- Audio input: **$32 per 1M tokens** ($0.40 cached)
- Audio output: **$64 per 1M tokens**

**Rough estimates:**
- 1 minute of audio ≈ 1,500 tokens
- 1 hour conversation ≈ 90,000 tokens input + 90,000 output
- **Cost per hour:** ~$2.88 input + $5.76 output = **~$8-10/hour**

**Total cost per 1-hour meeting:** ~$8-11 (OpenAI + Recall.ai)

---

## Implementation Steps

### Phase 1: Quick Test (30 minutes)
**Use Recall.ai's pre-hosted demo frontend** (no need to host your own yet)

1. **Set up OpenAI API key**
   - Create account at platform.openai.com
   - Add $20-50 credits to test
   - Generate API key

2. **Set up backend server**
   ```bash
   # Clone Recall.ai's voice agent demo
   git clone https://github.com/recallai/voice-agent-demo.git
   cd voice-agent-demo/node-server
   npm install
   
   # Add OpenAI key to .env
   echo "OPENAI_API_KEY=sk-..." > .env
   
   # Start server
   npm run dev
   
   # In another terminal, expose it publicly
   ngrok http 3000
   ```

3. **Create a bot**
   ```bash
   curl --request POST \
     --url https://eu-central-1.recall.ai/api/v1/bot/ \
     --header 'Authorization: Token 4465e2ccbbc3d295dbcb0af9dc1438e2a3ad5a12' \
     --header 'content-type: application/json' \
     --data '{
       "meeting_url": "YOUR_GOOGLE_MEET_URL",
       "bot_name": "Flux Voice",
       "output_media": {
         "camera": {
           "kind": "webpage",
           "config": {
             "url": "https://recallai-demo.netlify.app?wss=wss://YOUR_NGROK_URL"
           }
         }
       },
       "variant": {
         "google_meet": "web_4_core"
       }
     }'
   ```

4. **Test:** Bot joins meeting, you can talk to it!

### Phase 2: Customize (1-2 days)
1. **Clone frontend** and modify behavior
2. **Change agent personality** in `conversation_config.ts`
3. **Add function calling** (e.g., check CRM, calendar, send emails)
4. **Deploy to VPS** instead of ngrok

### Phase 3: Production (1 week)
1. **Host on Hostinger VPS** (public domain)
2. **Integrate with IIoT Solutions systems**
   - HubSpot CRM lookup
   - Calendar checking
   - Email sending
   - Product info retrieval
3. **Add security** (auth tokens in URL)
4. **Monitor costs** and optimize

---

## Use Cases for IIoT Solutions

### Sales & BD
- **Meeting assistant** that takes notes and answers questions
- **Product expert** that can explain technical details
- **Pricing calculator** that quotes on the fly
- **Demo helper** that walks through SCADA/MES features

### Internal
- **Meeting moderator** for team standups
- **Interview assistant** for recruiting
- **Onboarding buddy** for new hires

### Client Support
- **24/7 support bot** for client questions
- **Troubleshooting assistant** during technical calls

---

## Alternatives Considered

### 1. Vapi.ai / Bland.ai
- **Focus:** Phone calls, not video meetings
- **Pros:** Simpler setup for telephony
- **Cons:** Doesn't support Google Meet/Zoom
- **Verdict:** Not suitable for video meeting use case

### 2. Self-hosted (OpenAI Realtime only)
- **Pros:** More control, no Recall.ai fees
- **Cons:** Have to build meeting platform integration from scratch (complex)
- **Verdict:** Not worth it, Recall.ai solves the hard part

### 3. Traditional STT → LLM → TTS pipeline
- **Pros:** More flexibility in model choice
- **Cons:** Higher latency, less natural conversation
- **Verdict:** Realtime API is superior for voice interaction

---

## Demo Resources

- **Voice Agent Demo:** https://github.com/recallai/voice-agent-demo
- **Real-time Translator Demo:** https://github.com/recallai/real-time-translator-demo
- **Recall.ai Docs:** https://docs.recall.ai/docs/stream-media
- **OpenAI Realtime API:** https://platform.openai.com/docs/guides/realtime
- **Video Demo:** https://www.loom.com/share/2a02fac2643441c1990da861e829892c

---

## Next Steps

### Immediate (if approved):
1. ✅ Create OpenAI account for IIoT Solutions
2. ✅ Add $50 credits for testing
3. ✅ Clone voice-agent-demo repo
4. ✅ Test with a quick Google Meet

### Short-term:
- Customize agent personality for IIoT Solutions
- Add HubSpot integration for meeting context
- Deploy to Hostinger VPS

### Long-term:
- Build production-ready meeting assistant
- Monitor costs and optimize
- Expand to other use cases (support, sales demos)

---

**Recommendation:** This is the most mature, production-ready solution available. Start with Phase 1 testing (~$10) to validate the concept, then move to customization.
