# Infrastructure & Technical Setup

*Last updated: 2026-02-07*

This file documents the technical infrastructure, integrations, and systems that power IIoT Solutions' operations.

---

## Authorization Hook (RBAC System)

**Purpose:** Role-based access control for team members interacting with Flux

**Built:** 2026-02-07 by Ayman
**Location:** `hooks/internal/authorization/`

**Architecture:**
- Advisory enforcement — permissions injected into system prompt on every agent turn
- Flux sees what each user is allowed to do and acts accordingly
- Works with Telegram DMs and Gmail hooks

**Roles (3 tiers):**
| Role | Level | Permissions |
|------|-------|-------------|
| Admin | 3 | memory, crm, config, comms, admin |
| Manager | 2 | memory, crm, comms |
| User | 1 | memory |

**Feature Groups (5):**
- `memory` — Search, checkpoint, chapters, semantic memory
- `crm` — HubSpot, pipeline, deals, contacts
- `config` — Crons, gateway, settings, system config
- `comms` — Emails, messages, notifications
- `admin` — Role/user management, audit logs

**Commands:**
- `/grant-role <telegram_id> <role> [name]` — Admin only
- `/revoke-role <telegram_id>` — Admin only
- `/grant-permission <telegram_id> <permission>` — Admin only
- `/revoke-permission <telegram_id> <permission>` — Admin only
- `/list-roles` — Admin only
- `/my-permissions` — Any user
- `/request-access` — Unknown users

**Pre-configured Users:**
| Name | Telegram ID | Role | Extra |
|------|-------------|------|-------|
| Ayman AlJohani | 1186936952 | admin | immutable |
| Aadil Feroze | 124756960 | manager | — |
| Mreefah AlTukhaim | 1059703822 | user | — |
| Amr Elmayergy | 1473856272 | user | +crm |

**Files:**
- `hooks/internal/authorization/index.js` — Main hook entry
- `hooks/internal/authorization/rbac.js` — RBAC logic
- `hooks/internal/authorization/commands.js` — Command handlers
- `config/roles.json` — User role assignments
- `config/permissions.json` — Role/feature definitions

**Access Request Flow:**
1. Unknown user messages Flux → gets "unknown user" response with `/request-access`
2. User runs `/request-access` → creates pending request in `roles.json`
3. Admin gets notified, runs `/grant-role` to approve
4. User now has access with assigned role

**Status:** ✅ Active, production ready

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
- ~~Email checks: Every 2 hours via heartbeat~~ → **Upgrading to Gmail Pub/Sub push (E3)**
- Calendar checks: Every 2 hours via heartbeat rotation

**Gmail Pub/Sub (E3 — configured 2026-02-06):**
- OpenClaw hooks configured in `openclaw.json` (Gmail mapping, gemini-2.5-flash model)
- Safety: `allowUnsafeExternalContent: false`
- Setup script: `scripts/setup-gmail-pubsub.sh`
- **Pending:** `gcloud auth login` → run setup script → enables instant push (replaces 2-hour polling)
- Topic: `projects/awesome-aspect-486106-p8/topics/gog-gmail-watch`

**Email Processor (E4 — 2026-02-06):**
- `scripts/email-processor.js` — sanitization, injection scanning, LLM classification
- Auto-reply ONLY to `@iiotsolutions.sa` (hardcoded domain allowlist)
- Routes via event bus: urgent→Telegram, normal→briefing, low/spam→log only

**Tools:**
- GOG CLI (Google Workspace CLI)
- Gmail API via `skills/gog/`

**Status:** ✅ Active (push notifications pending gcloud auth)

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
- Token location: `~/.config/todoist-cli/config.json` AND `TODOIST_API_TOKEN` in gateway config
- Token value: `c313ae015831be8ef77bfdc442d30aacf2d92630` (updated 2026-02-04)
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

**Task Assignment Workflow (2026-02-04):**
- Team reference: `config/todoist-team.json` (all team Todoist IDs and emails)
- Assign script: `./scripts/todoist-assign.sh <task_id> <person> --notify`
- Create+Assign: `./scripts/todoist-create-and-assign.sh <person> <task> <due> <priority> <project> --notify`
- Email notifications: Automatic via GOG CLI (coding@iiotsolutions.sa)
- Guide: `docs/todoist-workflow-guide.md`

**Status:** ✅ Active, email notifications working, pending restructure decision

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

**Engine:** LanceDB + OpenAI embeddings (text-embedding-3-small)

**Location:** `/root/.openclaw/workspace/.vector-db/`

**Current state (2026-02-06):**
- 417 chunks total (rebuilt with OpenAI embeddings)
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

## Event Bus (E1 — 2026-02-06)

**Purpose:** Thin event abstraction over filesystem + gateway. Swappable to NATS/Redis/MQTT later.

**Location:** `scripts/event-bus.js`

**Methods:**
- `publish(topic, payload, options)` — log + route to gateway by topic
- `subscribe(topic, handler)` — for long-running services (future)
- `notify(message, options)` — shorthand: publish + Telegram delivery (always)
- `logEvent(topic, payload)` — append to event log only (no delivery)

**Event log:** `memory/events/YYYY-MM-DD.jsonl` (JSON lines, ~5 KB/day)
**Failed events:** `memory/events/failed-YYYY-MM-DD.jsonl`

**Topic routing:**
| Prefix | Action |
|--------|--------|
| `alert.*` | Telegram notify (immediate) |
| `report.*` | Telegram notify + save to reports/ |
| `briefing.*` | Telegram notify |
| `email.urgent` | Telegram notify |
| `email.*` | Log only |
| `memory.*` | Log only |
| `system.*` | Log only |

**Retry:** On gateway failure, retry once after 2s. If still fails, log to failed events.

**Bash wrapper:** `scripts/emit-event.sh` — allows bash scripts to publish events.

**DM capability (F2b — 2026-02-07):**
- `deliverTelegramDM(chatId, message)` — sends to specific Telegram user via Bot API
- Reads bot token from `/root/.openclaw/openclaw.json`
- 2-attempt retry with 2-second delay
- Used by `personal-briefing.js` for personalized morning DMs

**Scripts using event bus (E5):**
- `personal-briefing.js` → topic `briefing.personal` (F2b, DM per team member)
- `morning-briefing.js` → topic `briefing.daily`
- `pipeline-watchdog.js` → topic `report.pipeline`
- `accountability-check.js` → topic `report.accountability`
- `meeting-prep.js` → topic `briefing.meeting.{company}`
- `onboard-telegram.js` → topic `system.onboarding` (log only)

All scripts have try/catch fallback to direct curl if event-bus fails to load.

**Status:** ✅ Active

---

## File Locking (E2 — 2026-02-06)

**Purpose:** Prevent state.json corruption from concurrent writes (dream cron + user session).

**Implementation:** `lockedWriteJSON()` in `memory_engine.js`
- mkdir-based atomic locking (same protocol as bash `file-lock.sh`)
- Lock directory: `/tmp/openclaw-locks/`
- 30-second wait timeout, 5-minute stale detection
- Atomic write: write to `.tmp` → rename

**Compatibility:** Node.js `lockedWriteJSON()` and bash `file-lock.sh` / `safe-write.sh` can safely interleave.

**Status:** ✅ Active — all state.json writes now locked

---

## Cron Jobs (Scheduled Automation)

**Active jobs:**
1. Heartbeat polls (hourly)
2. ~~Email monitoring (every 2 hours)~~ → Upgrading to Gmail Pub/Sub push (E3)
3. LinkedIn Intelligence (nightly 2 AM Riyadh = 11 PM UTC)
4. **Personal briefing (F2b)** — `0 5 * * *` (8:00 AM Riyadh) — personalized DMs per team member
5. Morning briefing — `30 5 * * *` (8:30 AM Riyadh)
6. Meeting prep — `35 5 * * *` (8:35 AM Riyadh)
7. Pipeline watchdog — `0 3 * * 1` (6:00 AM Riyadh Monday)
8. Accountability check — `0 15 * * 0` (6:00 PM Riyadh Sunday)
9. Graph DB re-evaluation — `0 5 13 2 *` (Feb 13 one-time, 8:00 AM Riyadh)
10. **Pipeline health watchdog** — `0 */2 * * *` (every 2 hours)
11. **Session cleanup** — `15 */4 * * *` (every 4 hours, offset from :00)
12. Telegram onboarding emails — `0 7 8 2 *` (one-time: Sunday Feb 8, 10:00 AM Riyadh)

**Cron management:**
- System crontab for scheduled scripts
- Gateway manages webhook/hook jobs
- Session target: `main` (system events) or `isolated` (agent turns)

**Status:** ✅ Active

---

## RBAC Authorization (2026-02-07)

**Purpose:** Role-based access control for multi-user Flux interactions (Telegram, email sessions).

**Architecture:**
- 3-tier model: Admin (level 3) → Manager (level 2) → User (level 1)
- 5 feature groups: memory, crm, config, comms, admin
- Enforcement: Advisory (injected into system prompt per session, not hard-blocking)

**Files:**
- `config/permissions.json` — Feature group definitions with keywords
- `config/roles.json` — User registry with roles and per-user overrides
- `hooks/internal/authorization/rbac.js` — Core engine: `authorize()`, `authorizeByEmail()`, `grantRole()`, `revokeRole()`
- `hooks/internal/authorization/commands.js` — 7 slash commands (`/grant-role`, `/revoke-role`, `/grant-permission`, `/revoke-permission`, `/list-roles`, `/my-permissions`, `/request-access`)
- `hooks/internal/authorization/index.js` — Hook registration, intercepts `agent_turn_start`

**Role permissions:**
| Role | Permissions |
|------|-------------|
| Admin | memory, crm, config, comms, admin |
| Manager | memory, crm, comms |
| User | memory |

**Registered users (as of 2026-02-07):**
| User | Role | Extra |
|------|------|-------|
| Ayman | admin (immutable) | — |
| Aadil | manager | — |
| Mreefah | user | — |
| Amr | user | +crm |

**Email authorization:** For Gmail hook sessions (`hook:gmail:*`), looks up user by sender email via `authorizeByEmail()`.

**File locking:** Uses `lockedWriteJSON()` from `memory_engine.js` for safe concurrent writes to `roles.json`.

**Status:** ✅ Active

---

## Pipeline Health Watchdog (2026-02-07)

**Purpose:** Detect when memory pipeline components stop running.

**Location:** `scripts/pipeline-health-watchdog.sh`

**Checks:**
1. summarize-brief.sh (6-hour cadence)
2. create-daily-chapter.sh (daily)
3. today-brief.md staleness (24h threshold)
4. Vector DB reachability
5. Cron entries (memory crons exist in crontab)

**Alert:** Telegram notification with 12-hour cooldown per issue.

**Cron:** `0 */2 * * *` (every 2 hours)

**Status:** ✅ Active

---

## Session Cleanup (2026-02-07)

**Purpose:** Prune stale hook/cron sessions, archive old transcripts, report orphans.

**Location:** `scripts/session-cleanup.js`

**Supports:** `--dry-run` flag for safe preview.

**Cron:** `15 */4 * * *` (every 4 hours, offset from :00 jobs)

**Note:** Runs via system crontab, not OpenClaw cron (which would create its own sessions to clean up).

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
- Remote: https://github.com/Aymanjohani/Flux.git
- SSH key: `/root/.ssh/flux_github` (ed25519, deploy key with write access)
- Commit identity: Flux <coding@iiotsolutions.sa>
- Branch: master
- Configured: 2026-02-04
- Security: Sensitive files excluded (.gitignore covers config/, API keys, OAuth tokens)

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
| **Vector Memory** | ✅ Active | Knowledge search | memory/vector_db/ |
| **Telegram** | ✅ Active | Primary comms | Gateway config |
| **Browser** | ✅ Active | Web automation | OpenClaw tool |
| **SSH Alerts** | ✅ Active | Security monitoring | /var/log/ |
| **GitHub** | ✅ Active | Version control | github.com/Aymanjohani/Flux |
| **Event Bus** | ✅ Active | Event routing & audit | scripts/event-bus.js |
| **Personal Briefing** | ✅ Active | Personalized task/deal DMs | scripts/personal-briefing.js |
| **Email Processor** | ✅ Active | Email security sandbox | scripts/email-processor.js |
| **RBAC Authorization** | ✅ Active | Role-based access control | hooks/internal/authorization/ |
| **Pipeline Watchdog** | ✅ Active | Memory pipeline monitoring | scripts/pipeline-health-watchdog.sh |
| **Session Cleanup** | ✅ Active | Stale session pruning | scripts/session-cleanup.js |
| **File Locking** | ✅ Active | Concurrent write safety | memory_engine.js |
| **Gmail Pub/Sub** | ⏳ Pending | Instant email push | scripts/setup-gmail-pubsub.sh |

---

**Maintenance notes:**
- Update this file when adding/changing integrations
- Re-ingest after updates: `./scripts/memory ingest memory/semantic/infrastructure.md`
- Critical: This file is searchable via vector memory - keep it current
