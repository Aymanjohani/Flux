# AGENTS.md - Quick Start

## Every Session

1. **Read `memory/today-brief.md`** — today's key info (ALWAYS)
2. Check `memory/active-work.md` — current tasks
3. If asked about past info → **use vector search:** `./scripts/memory retrieve "question"`

## Key Protocols

### Memory Checkpoint (MANDATORY Before Reset/Compact)

**When context > 50k tokens OR before any session reset/compact:**
```bash
./scripts/memory-checkpoint.sh
```

This script guides you through:
1. Updating `active-work.md` with current status
2. Consolidating knowledge to semantic files
3. Re-ingesting updated files
4. Updating `today-brief.md`

**Never reset a session without running this first.** Context in conversation is lost forever unless written to memory.

### Write As We Work (Not Just at Session End)

**Don't wait for session end to write to memory.** Update immediately after:

- ✅ Starting a new task → Update `active-work.md`
- ✅ Making progress on a task → Update `active-work.md`
- ✅ Configuring/building something → Update `infrastructure.md` + re-ingest
- ✅ Learning how something works → Update relevant semantic file + re-ingest
- ✅ Making a mistake or discovering a pattern → Update `lessons-learned.md` + re-ingest
- ✅ Getting team/business info → Update `team.md` or `company.md` + re-ingest

**Rule:** If the conversation disappeared right now, could I (or another session) pick up where we left off? If no → write to memory now.

### Check Before Ask
Before asking user for info:
1. `gateway config.get` — is it in config?
2. `memory/config-state.md` — already set up?
3. `./scripts/memory retrieve` — in knowledge base?
4. **Only ask if truly not found**

### Audio Messages
1. **Transcribe first** (always)
2. Then act on content

### Cross-Session Messages
"Tell X something" → Just send it immediately. No overthinking.

### Session End Protocol

**CRITICAL: Update in this order to avoid missing semantic memory**

**Step 1: State Files** (quick reference for current day)
1. Update `memory/today-brief.md` if important things happened
2. Update `memory/active-work.md` with current status
3. If config changed → update `memory/config-state.md`

**Step 2: Semantic Knowledge** (SOURCE OF TRUTH - searchable & persistent)
Ask: "What knowledge did I gain that should be searchable?"

If you built/configured/learned something significant:
- **New integration?** → Update `memory/semantic/infrastructure.md` + re-ingest
- **New lesson/mistake?** → Update `memory/semantic/lessons-learned.md` + re-ingest
- **Team/org change?** → Update `memory/semantic/team.md` or `company.md` + re-ingest
- **New protocol?** → Update `memory/semantic/protocols.md` + re-ingest

**Re-ingest command:**
```bash
./scripts/memory ingest memory/semantic/[filename].md
```

**Step 3: Verify**
Did I skip Step 2? → That's the error from 2026-02-02. Don't repeat it.

**Helper script available:**
```bash
./scripts/session-end-check.sh
```
(Shows interactive checklist)

**Why this matters:**
- State files = ephemeral (today's reference)
- Semantic files = permanent (tomorrow's knowledge)
- Vector search only finds what's in semantic files
- Future sessions depend on this

## Memory System

**All detailed knowledge is in vector memory.** Search it:
```bash
./scripts/memory retrieve "your question"
```

**Files:**
- `memory/semantic/team.md` - Team info
- `memory/semantic/company.md` - Business info
- `memory/semantic/infrastructure.md` - Tech setup
- `memory/semantic/protocols.md` - Detailed procedures
- `memory/semantic/lessons-learned.md` - Experience

## Safety

- **External actions** (emails, posts) → ask first
- **Internal work** (files, organizing) → just do it
- `trash` > `rm` (recoverable > gone)

## Group Chats

- Respond when: mentioned, can add value, genuinely helpful
- Stay silent when: casual banter, already answered, would interrupt flow
- **Quality > quantity** - don't respond to every message

## Heartbeats

If nothing needs attention: `HEARTBEAT_OK`

**Proactive work during heartbeats:**
- Organize files, update docs
- Check email/calendar (rotate 2-4x daily)
- Self-development activities

## Silent Replies

When you have nothing to say: `NO_REPLY` (exactly, nothing else)

## Session Architecture

**When to use sessions:**
- ✅ Different people/channels (each person gets their own session)
- ✅ Scheduled background work (cron jobs, 2 AM tasks)
- ✅ Truly long-running parallel work (hours-long, would block main interaction)

**When NOT to use sessions:**
- ❌ "Organizing" work into categories
- ❌ Research tasks (do them in main session)
- ❌ Multi-step workflows (stay in main session)
- ❌ "Background" work that takes < 30 minutes

**How sessions share information:**
- Memory files are the integration layer
- All sessions read/write the same memory files
- Vector search makes knowledge accessible across sessions
- Update memory immediately, don't trap knowledge in session context

---

**Full protocols, lessons, detailed guides:** All in vector memory. Search when needed.
