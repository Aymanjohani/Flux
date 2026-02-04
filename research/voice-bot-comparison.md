# Interactive Meeting Bot: API Comparison
**Date:** 2026-02-02  
**Requested by:** Ayman  
**Question:** Can we use ElevenLabs or Groq instead of OpenAI Realtime API?

**Answer:** YES! Multiple approaches available, each with tradeoffs.

---

## Architecture Overview

All solutions use **Recall.ai** to join meetings (Google Meet, Zoom, Teams). The difference is in the voice processing stack.

```
Meeting Platform (Google Meet, etc.)
    ↓
Recall.ai Bot (joins meeting, streams audio)
    ↓
Your Webpage (processes audio, generates responses)
    ↓
Voice Processing Stack ← THIS IS WHERE WE CHOOSE
    ↓
Bot speaks back into meeting
```

---

## Option 1: OpenAI Realtime API (Original Research)

### What It Is
**Unified speech-to-speech model** — single model processes audio directly, no intermediate steps.

### Architecture
```
Meeting Audio → OpenAI Realtime API → Audio Response
```

### Pros
✅ **Lowest latency** (single model, no pipeline)  
✅ **Most natural conversation** (understands emotion, interruptions)  
✅ **Simplest to implement** (one API call)  
✅ **Handles interruptions** natively  
✅ **Dynamic voice adjustment** (can change tone/emotion on the fly)  
✅ **Already working demos** from Recall.ai

### Cons
❌ **Most expensive:** ~$8-10/hour of conversation  
❌ **Vendor lock-in** (OpenAI only, can't use other LLMs)  
❌ **Only 10 preset voices**  
❌ **Less control** over individual components  
❌ **Transcripts can be inaccurate** (audio-first, text is secondary)

### Pricing
- Audio input: **$32 per 1M tokens** ($0.40 cached)
- Audio output: **$64 per 1M tokens**
- **Rough cost:** $0.13-0.17 per minute (~$8-10/hour)

### Best For
- Prototypes (fastest to build)
- Use cases where voice quality/latency is critical
- When you don't mind paying premium

---

## Option 2: ElevenLabs Agents (Native Platform)

### What It Is
**Managed conversational AI platform** with modular architecture (STT → LLM → TTS).

### Architecture
```
Meeting Audio → ElevenLabs Agent (STT → LLM → TTS) → Audio Response
```

### Pros
✅ **Much cheaper:** $0.10/minute (~$6/hour) — **40% cheaper than OpenAI**  
✅ **5,000+ voices** (vs OpenAI's 10)  
✅ **Custom voice cloning** available  
✅ **Better function calling** (80% accuracy vs OpenAI's 66.5%)  
✅ **Better instruction following** (50% vs OpenAI's 30.5%)  
✅ **Better reasoning** (90% vs OpenAI's 82%)  
✅ **Choose your LLM** (GPT, Claude, Gemini, Groq, custom models)  
✅ **Built-in testing tools** and analytics  
✅ **Multi-agent workflows** (transfer between specialized agents)  
✅ **More telephony integrations** (Twilio, Genesys, SIP)  
✅ **Advanced turn-taking** (understands "um", "ah", natural pauses)

### Cons
❌ **Slightly higher latency** than OpenAI (but still very fast)  
❌ **Modular architecture** = more moving parts  
❌ **WebRTC/WebSocket native** — not clear if direct Recall.ai integration exists  
❌ May need custom integration with Recall.ai

### Pricing
- **$0.10 per minute** (recently reduced 50%)
- Plus LLM costs (varies by model choice)
- **Estimated total:** $0.12-0.15/min (~$7-9/hour)

### Integration Challenge
ElevenLabs Agents is designed for:
- Direct web integration (WebRTC)
- Phone calls (Twilio, SIP)
- Mobile apps

**Recall.ai integration:** Not documented. Would need custom work to connect ElevenLabs Agent to Recall.ai's Output Media webpage.

### Best For
- Production deployments (better benchmarks, cheaper)
- When you want control over LLM choice
- Complex multi-agent workflows
- When voice quality/variety is important

---

## Option 3: Custom Pipeline (Groq + ElevenLabs TTS)

### What It Is
**Build your own voice pipeline** using separate services for each step.

### Architecture
```
Meeting Audio → Groq Whisper (STT) → Your LLM → ElevenLabs TTS → Audio Response
```

### Component Choices

#### Speech-to-Text (STT)
**We already have Groq configured!**
- Model: `whisper-large-v3-turbo`
- We use this for voice message transcription in Telegram
- **Pricing:** FREE tier available, then pay-as-you-go (very cheap)

#### Language Model (LLM)
**Your choice:**
- Groq (ultra-fast, cheap, `llama-3.3-70b-versatile`)
- OpenAI GPT-4o (smart, mid-price)
- Anthropic Claude Sonnet (what we use now)
- Google Gemini (we have API key)
- Local/custom models

#### Text-to-Speech (TTS)
**ElevenLabs TTS API** (not Agents platform)
- **Pricing:** 1 credit per character (standard), 0.5 credits (turbo)
- Turbo model: Sub-second latency (perfect for real-time)
- Same 5,000+ voice library
- Voice cloning available

### Pros
✅ **Maximum flexibility** — pick the best tool for each step  
✅ **Potentially cheapest** (can optimize each component)  
✅ **Use existing Groq STT** (already configured)  
✅ **Choose your preferred LLM** (Claude, GPT, Groq, Gemini, etc.)  
✅ **Full control** over every aspect  
✅ **Accurate transcripts** (dedicated STT model)  
✅ **Easy to swap components** (test different LLMs, voices, etc.)

### Cons
❌ **Highest latency** (3 API calls in sequence)  
❌ **Most complex to build** (you manage the pipeline)  
❌ **More potential failure points** (3 services vs 1)  
❌ **Pipeline management** (buffering, streaming, error handling)  
❌ **Interruption handling** is harder (need custom logic)

### Implementation
Build a **custom webpage** for Recall.ai's Output Media that:
1. Receives meeting audio via MediaStream API
2. Sends audio chunks to Groq Whisper (STT)
3. Sends text to your chosen LLM (with conversation context)
4. Sends LLM response to ElevenLabs TTS
5. Plays audio back → bot speaks into meeting

### Estimated Pricing
- **Groq Whisper:** ~$0.01-0.02/min (very cheap)
- **LLM:** Varies widely
  - Groq Llama: ~$0.01/min
  - Claude Sonnet: ~$0.05/min
  - GPT-4o: ~$0.10/min
- **ElevenLabs TTS Turbo:** ~$0.03-0.05/min

**Total estimated:** $0.05-0.17/min (~$3-10/hour depending on LLM choice)

### Best For
- Maximum control freaks 🤓
- When you want to use Claude/Gemini instead of GPT
- Cost optimization (use cheap Groq LLM)
- Learning/experimentation

---

## Side-by-Side Comparison

| Feature | OpenAI Realtime | ElevenLabs Agents | Custom (Groq+ElevenLabs) |
|---------|-----------------|-------------------|--------------------------|
| **Latency** | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐⭐ Very Fast | ⭐⭐⭐ Good |
| **Cost/hour** | ~$8-10 | ~$7-9 | ~$3-10 (varies) |
| **Voices** | 10 presets | 5,000+ | 5,000+ |
| **LLM Choice** | GPT only | Any | Any |
| **Complexity** | ⭐ Easiest | ⭐⭐ Medium | ⭐⭐⭐⭐⭐ Most complex |
| **Control** | Limited | High | Maximum |
| **Recall.ai Integration** | ✅ Documented | ❓ Unclear | ✅ Custom build |
| **Benchmarks** | Good | Better | Depends on choices |
| **Production Ready** | ✅ Yes | ✅ Yes | ⚠️ Need to build |
| **We Have API Keys** | ❌ Need OpenAI | ❌ Need ElevenLabs | ✅ Have Groq (need ElevenLabs) |

---

## Recommendation

### For Quick Prototype (This Week)
**→ OpenAI Realtime API**
- Fastest to implement (demo code exists)
- Proven to work with Recall.ai
- Test the concept with ~$20 of credits
- Can always switch later

### For Production (After Validation)
**→ Custom Pipeline: Groq Whisper + Claude Sonnet + ElevenLabs TTS**

**Why:**
1. **We already have Groq STT** configured
2. **We use Claude Sonnet** as primary model (familiar, good at instructions)
3. **Lower cost** than OpenAI Realtime (~$4-6/hour vs $8-10)
4. **Maximum flexibility** to optimize later
5. **Use our existing infrastructure**

**Build it as:**
- Custom webpage for Recall.ai Output Media
- Groq Whisper for transcription (we already use this!)
- Claude Sonnet for reasoning (what we use everywhere)
- ElevenLabs TTS Turbo for voice output
- All tied together in a Node.js/Python server

### If ElevenLabs Agents Integration Works
**→ ElevenLabs Agents Platform**
- Best benchmarks (function calling, reasoning)
- Easier than custom pipeline
- Still cheaper than OpenAI
- Professional platform with analytics

**But:** Need to research if it can integrate with Recall.ai Output Media (not documented).

---

## Implementation Plan

### Phase 1: Validate Concept (1-2 days, ~$20)
**Use OpenAI Realtime API**
1. Get OpenAI API key, add $50 credits
2. Clone Recall.ai voice-agent-demo
3. Test with real meeting
4. Validate that this approach works for IIoT Solutions

**Cost:** ~$20 testing

### Phase 2: Build Production System (1 week)
**Switch to Custom Pipeline**
1. Build custom webpage for Recall.ai Output Media
2. Integrate Groq Whisper (reuse existing config)
3. Use Claude Sonnet for LLM (our default model)
4. Add ElevenLabs TTS API
5. Deploy to Hostinger VPS
6. Test and optimize latency

**Cost:** ~$4-6/hour in production

### Phase 3: Enhance (Ongoing)
- Add HubSpot integration (lookup contacts during calls)
- Add calendar checking
- Add product knowledge base
- Optimize voice, personality, interruption handling
- Monitor costs, adjust components as needed

---

## Key Decisions Needed

1. **Start with OpenAI for quick validation?** (~$20 test)
   - ✅ Recommended: Yes, validate concept first

2. **Which LLM for production?**
   - Claude Sonnet (our current favorite)
   - GPT-4o (smarter but expensive)
   - Groq Llama (fastest, cheapest)
   
3. **Create ElevenLabs account?**
   - Needed for production (TTS)
   - ~$10-20 to test TTS quality

4. **Timeline priority?**
   - Fast prototype: This week
   - Production ready: 2-3 weeks

---

## Resources

### OpenAI Realtime
- Demo: https://github.com/recallai/voice-agent-demo
- Docs: https://platform.openai.com/docs/guides/realtime
- Video: https://www.loom.com/share/2a02fac2643441c1990da861e829892c

### ElevenLabs Agents
- Platform: https://elevenlabs.io/voice-agents
- Comparison: https://elevenlabs.io/blog/elevenlabs-agents-vs-openai-realtime-api-conversational-agents-showdown
- Docs: https://elevenlabs.io/docs/agents-platform/overview

### Custom Pipeline
- LiveKit + Groq guide: https://console.groq.com/docs/livekit
- Pipecat framework: https://github.com/pipecat-ai/pipecat
- Voice-Agents library: https://github.com/The-Swarm-Corporation/Voice-Agents

### Recall.ai
- Output Media: https://docs.recall.ai/docs/stream-media
- Our API key: Configured (EU region)
- Our config: `/root/.openclaw/workspace/config/recall-ai.json`

---

## Next Steps

**Immediate:**
1. Decide on approach (prototype with OpenAI? Jump to custom?)
2. Create necessary API accounts
3. Test voice quality (try ElevenLabs voices)

**This Week:**
1. Build working prototype with chosen stack
2. Deploy to VPS
3. Test in real IIoT Solutions meetings

**This Month:**
1. Optimize for production use
2. Add business integrations (HubSpot, calendar)
3. Monitor costs and tune components
4. Roll out to sales team

---

**Bottom Line:**  
For **prototype**: Use OpenAI Realtime (fastest path).  
For **production**: Build custom pipeline with Groq + Claude + ElevenLabs (best cost/control).  
**We can build this!** 🚀
