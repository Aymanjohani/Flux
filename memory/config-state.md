# Config State

*Last verified: 2026-02-02 07:18 UTC*

## Integrations Status

| Integration | Status | Notes |
|-------------|--------|-------|
| **Telegram** | ✅ Active | Primary channel |
| **Brave Search** | ✅ Active | Web research enabled |
| **Memory Search** | ✅ Active | OpenAI embeddings (text-embedding-3-small) |
| **Todoist** | ✅ Active | Using Ayman's account |
| **STT (Groq)** | ✅ Active | whisper-large-v3-turbo |
| **Browser** | ✅ Active | Chrome headless |
| **Email** | ✅ Active | coding@iiotsolutions.sa (read + send) |
| **Calendar** | ✅ Active | coding@iiotsolutions.sa (view/create) |
| **LinkedIn Intel** | ✅ Active | coding@iiotsolutions.sa (cookie auth, nightly) |
| **Google Drive** | ❌ Not approved | Ayman decision |
| **HubSpot** | ✅ Active | Legacy private app, full CRM access |
| **Recall.ai** | ✅ Active | EU region, meeting bots, transcription |
| **Sales Intelligence** | ✅ Active | Full sales ops orchestration (skills/sales-intelligence/) |

## API Keys & Credentials Available

(Keys exist in config — not listing values here)

- `GROQ_API_KEY` ✅
- `BRAVE_API_KEY` (in tools.web.search) ✅
- `OPENAI_API_KEY` (for embeddings + memory search) ✅
- Telegram bot token ✅
- Todoist token (in ~/.config/todoist-cli/) ✅
- Google OAuth (in workspace/config/google-*.json) ✅
- Recall.ai API key (in workspace/config/recall-ai.json) ✅
- LinkedIn cookies (in skills/linkedin-intel/config/cookies.json) ✅
- `HUBSPOT_ACCESS_TOKEN` ✅

## Heartbeat

- **Schedule:** Hourly
- **Active hours:** Not restricted
- **Checks:** SSH alerts, HEARTBEAT.md tasks

## Models

- **Default:** google/gemini-2.5-pro (general chat)
- **Fallback:** anthropic/claude-opus-4-5 (coding tasks)
- **Alias:** `opus` → anthropic/claude-opus-4-5
- **Image:** Not configured separately
- **STT:** groq/whisper-large-v3-turbo
- **Note:** Use `/model opus` for Claude, `/model gemini` to switch back

---

*Update this file after any config changes.*
