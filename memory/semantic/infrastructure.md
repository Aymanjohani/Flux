# Infrastructure & Technical Setup

*Last updated: 2026-02-04*

This file documents the technical infrastructure, integrations, and systems that power IIoT Solutions' operations.

---

## LinkedIn Intelligence System

**Purpose:** Automated daily market intelligence gathering for Saudi industrial sector

**Architecture:**
```
Cron (2 AM Riyadh) → Marker file → Flux native orchestration → Browser tool → Report generation
```

**Key components:**
- Location: `skills/linkedin-intel/`
- Configuration: `config/targets.json` (hashtags, companies, competitors)
- Authentication: Cookie-based (coding@iiotsolutions.sa `li_at` token)
- Execution: Native browser orchestration (not subprocess)
- Output: Daily reports in `output/YYYY-MM-DD-intel.md`

**Performance:**
- Runtime: 8-12 minutes (down from 300s+ timeout)
- Rate limiting: 50 requests/hour, target 20-25 per run
- Delays: 8-20s between major actions (human-like)

**V2 Architecture (2026-02-04):**
- ❌ Old: Python script → subprocess → openclaw CLI → browser tool (subprocess hell, 176s overhead)
- ✅ New: Cron → marker file → Flux → native browser tool (direct access, zero overhead)

**Monitoring:**
- Primary hashtags: #سعودي, #صناعة, #تحول_رقمي (top 3 of 8)
- Target companies: Top 5 SME prospects
- Competitors: Top 3 major players

**Output format:**
1. High Priority Opportunities (with recommended actions)
2. Market Intelligence (hashtag volumes, company activity)
3. Competitor Intelligence
4. Medium Priority Leads
5. Action Items

**Alert system:**
- Morning Telegram alert to Ayman if high-priority opportunities detected
- Report location: `skills/linkedin-intel/output/YYYY-MM-DD-intel.md`

**Documentation:**
- `SKILL.md` - Overall system guide
- `FLUX_INTEL.md` - Intelligence gathering protocol
- `scripts/intelligence-runner.md` - Execution guide (4.9KB)
- `scripts/linkedin-intel-v2.sh` - Trigger script

**Status:** ✅ Active, production ready

---

## Email & Calendar (Google Workspace)

**Account:** coding@iiotsolutions.sa

**Capabilities:**
- Read inbox (Gmail API)
- Send emails (GOG CLI with keyring)
- View calendar events
- Create calendar events
- Search emails

**Authentication:**
- OAuth 2.0 tokens: `config/google-oauth-token.json`
- Keyring password: `GOG_KEYRING_PASSWORD` (set in `~/.bashrc`)

**Monitoring:**
- Email checks: Every 2 hours via heartbeat rotation
- Calendar checks: Every 2 hours via heartbeat rotation

**Tools:**
- GOG CLI (Google Workspace CLI)
- Gmail API via `skills/gog/`

**Status:** ✅ Active

---

## HubSpot CRM

**Portal ID:** 147149295

**Access:** Legacy private app (full CRM permissions)
- Token: `HUBSPOT_ACCESS_TOKEN` in gateway config
- Location: `skills/hubspot/`

**Capabilities:**
- Contacts (read, create, update, search)
- Companies (read, create, update, search, custom properties)
- Deals (read, create, update, properties)
- Owners (list, map to team members)
- CMS (blog posts - read/create)

**Custom Properties Created (2026-02-03):**
1. `factory_database_id` - Link to original factory DB
2. `factory_region` - Geographic region
3. `factory_size_employees` - Employee count category
4. `primary_industry_sector` - Industrial classification
5. `digitalization_readiness` - Assessment score
6. `manufacturing_type` - Production category
7. `compliance_certifications` - Quality standards
8. `technology_stack` - Current systems

**Data Import (2026-02-03):**
- 5,371 companies imported from Ayman's factory database
- 99.9% success rate (8 failures from duplicates)
- Backup: `backups/companies-backup-YYYY-MM-DD.json`

**Pending:**
- Phase 3: Contacts import (4,969 contacts) - awaiting decision

**Status:** ✅ Active

---

## Todoist (Task Management)

**Account:** Ayman's personal account (shared access)

**API Access:**
- Token stored in OpenClaw gateway config environment variables
- API v2 REST endpoint: `https://api.todoist.com/rest/v2/`
- Skill location: `skills/todoist/` (HubSpot skill also has Todoist integration)
- Programmatic access: Can create/update/assign tasks via API

**Current state (2026-02-03 analysis):**
- 51 active tasks, 38 projects (13 empty)
- **Critical issue:** 96% tasks have no due dates (only 2 of 51 tasks have dates)
- Impact: No accountability, no urgency, vague tasks proliferate

**Analysis Reports (2026-02-03):**
- `reports/todoist-projects-analysis-2026-02-03.md` (19KB) - Full breakdown
- Identified issues: Vague tasks, no ownership visibility, no pipeline discipline

**Restructure proposal:**
- Status: Sent to Aadil 2026-02-03, awaiting decision
- Option A (Recommended): Clean slate rebuild with functional architecture (2-3 hours)
- Option B: Fix in place (5-8+ hours)
- 6 functional areas: Sales, Delivery, Dev, Ops, Marketing, Leadership
- Documentation: `docs/todoist-restructure-proposal.md` (15KB)
- Team guide: `docs/todoist-team-guide.md` (18KB)

**Automation capabilities:**
- Flux can enforce task hygiene (due dates, proper formatting)
- Weekly review automation planned
- HubSpot integration for deal → task workflows

**Status:** ✅ Active, pending restructure decision

---

## Recall.ai (Meeting Intelligence)

**Region:** EU (Frankfurt)

**Capabilities:**
- Join Zoom/Google Meet/Teams meetings as bot
- Real-time transcription (diarized)
- Recording (audio + video)
- Speaker identification
- Webhook delivery (transcripts, recordings)

**API Access:**
- API key: `config/recall-ai.json`
- Skill location: `skills/sales-intelligence/lib/meeting-intelligence.js`

**Current bots:**
- Production: 0 active
- Test: 3 (need cleanup)

**Integration:**
- Part of Sales Intelligence system (`skills/sales-intelligence/`)
- Transcripts analyzed for follow-up actions
- Integrated with HubSpot deal tracking

**Status:** ✅ Active, test cleanup pending

---

## Vector Memory System

**Engine:** LanceDB + Gemini embeddings

**Location:** `/root/.openclaw/workspace/.vector-db/`

**Current state (2026-02-04):**
- 298 chunks total (after latest ingest)
- Score threshold: 0.5 (default)

**Semantic files (SOURCE OF TRUTH):**
- `memory/semantic/team.md` - Team information
- `memory/semantic/company.md` - Business context
- `memory/semantic/infrastructure.md` - Technical setup (this file)
- `memory/semantic/protocols.md` - Procedures and protocols
- `memory/semantic/lessons-learned.md` - Experience and patterns

**Search command:**
```bash
./scripts/memory retrieve "your question"
```

**Ingestion workflow:**
1. Update semantic file with new knowledge
2. Run: `./scripts/memory ingest memory/semantic/[filename].md`
3. Verify chunks added to vector DB

**Critical pattern:**
- State files (today-brief.md, active-work.md) = ephemeral reference
- Semantic files = permanent, searchable knowledge
- Always update semantic files + re-ingest when learning something important

**Status:** ✅ Active

---

## Token Threshold Monitoring

**Purpose:** Prevent context loss by warning before hitting 200k token hard limit

**Design location:** `/root/.openclaw/workspace/token-threshold-system/`

**Thresholds:**
- 50k tokens (25%): ⚠️ Warning - Checkpoint recommended
- 100k tokens (50%): 🚨 Alert - Checkpoint required
- 140k tokens (70%): 🔴 Critical - Immediate action needed
- 195k tokens (97.5%): 🛑 Emergency - Force reset

**Architecture (designed):**
```
Hook → Pre-turn monitoring → Token estimation → Threshold check → System event injection
```

**Components built:**
- `monitor.js` - Token counting logic (estimates ~4 chars/token)
- `hook-integration.js` - OpenClaw hook entry point
- `test-harness.js` - Synthetic session generator for testing
- `test-runner.js` - Test suite for thresholds

**Integration attempted (2026-02-04 02:23 UTC):**
- Files copied to `hooks/internal/token-threshold-monitor/`
- Config updated with `token-threshold-monitor` entry
- Gateway restarted
- **Hook never loaded** (no logs, no execution)

**Status:** 🔴 Not working - Integration failed
- Design is sound (tested standalone)
- Files exist and are correct
- Config looks correct
- Hook system not loading it (unknown cause)
- Need to investigate OpenClaw hook architecture OR build alternative approach

**Workaround:** Manual checkpoint protocol at 50k tokens
- Check session_status regularly
- Run `./scripts/memory-checkpoint.sh` when approaching 50k
- Update AGENTS.md reminds about 50k threshold

**Next steps:**
1. Debug why hook didn't load (check OpenClaw hook requirements)
2. Test if other hooks are working (boot-md, command-logger, session-memory)
3. If hooks broken: Build alternative (scheduled check, manual trigger)
4. Verify solution works before claiming "Done"

**Documentation:**
- `token-threshold-system/README.md` - System overview
- `token-threshold-system/INSTALLATION.md` - Integration guide
- Original design from context management discussions (2026-02-04)

---

## Telegram Bot

**Primary communication channel**

**Capabilities:**
- Receive messages
- Send messages
- Send files/media
- Inline buttons (supported)
- Reactions (minimal mode - sparingly)

**Integration:**
- Gateway config: `channels.telegram`
- Token stored in gateway config

**Status:** ✅ Active

---

## Browser Automation

**Profiles:**
- `openclaw` - Isolated browser for automation
- `chrome` - Chrome extension relay (for user's existing tabs)

**Uses:**
- LinkedIn Intelligence (cookie-based auth)
- General web research
- Screenshot/snapshot capabilities

**Tools:**
- OpenClaw native browser tool (direct access)
- Playwright backend

**Performance note:**
- Direct tool access: <1ms overhead
- Subprocess calls (avoid): ~7000ms overhead per call

**Status:** ✅ Active

---

## Cron Jobs (Scheduled Automation)

**Active jobs:**
1. Heartbeat polls (hourly)
2. Email monitoring (every 2 hours)
3. LinkedIn Intelligence (nightly 2 AM Riyadh = 11 PM UTC)
4. Overnight Self-Improvement (nightly 2 AM Riyadh)

**Cron management:**
- Use `cron` tool (not system crontab)
- Gateway manages jobs
- Session target: `main` (system events) or `isolated` (agent turns)

**Status:** ✅ Active

---

## SSH & Security

**SSH alerts:**
- Log location: `/var/log/ssh-alerts.jsonl`
- Check script: `/usr/local/bin/check-ssh-alerts.sh`
- Monitoring: Heartbeat checks for new logins
- Alert: Telegram message to Ayman with time, user, IP

**Status:** ✅ Active

---

## Development Environment

**Host:** srv1316289 (Hostinger VPS)
**OS:** Linux 6.8.0-90-generic (x64)
**Node:** v22.22.0
**OpenClaw:** Latest (self-updating)

**Workspace:** `/root/.openclaw/workspace/`

**Git repository:**
- Remote: (if configured)
- Local workspace tracked

**Models:**
- Default: google/gemini-2.5-pro
- Fallback: anthropic/claude-sonnet-4-5
- Alias: `opus` → claude-opus-4-5

**Status:** ✅ Operational

---

## Integration Summary

| System | Status | Purpose | Location |
|--------|--------|---------|----------|
| **LinkedIn Intel** | ✅ Active | Market intelligence | skills/linkedin-intel/ |
| **Gmail** | ✅ Active | Email read/send | GOG CLI |
| **Calendar** | ✅ Active | Schedule management | GOG CLI |
| **HubSpot** | ✅ Active | CRM operations | skills/hubspot/ |
| **Todoist** | ✅ Active | Task management | ~/.config/todoist-cli/ |
| **Recall.ai** | ✅ Active | Meeting intelligence | skills/sales-intelligence/ |
| **Vector Memory** | ✅ Active | Knowledge search | .vector-db/ |
| **Telegram** | ✅ Active | Primary comms | Gateway config |
| **Browser** | ✅ Active | Web automation | OpenClaw tool |
| **SSH Alerts** | ✅ Active | Security monitoring | /var/log/ |

---

**Maintenance notes:**
- Update this file when adding/changing integrations
- Re-ingest after updates: `./scripts/memory ingest memory/semantic/infrastructure.md`
- Critical: This file is searchable via vector memory - keep it current
