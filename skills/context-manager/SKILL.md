---
name: context-manager
description: Manage context window efficiently across sessions. Use when context is bloating, sessions need to share state, conversations need summarizing, or you need to audit token usage. Triggers on context overflow, cross-session handoffs, "what do you know about X", state synchronization, and memory consolidation tasks.
---

# Context Manager

**Updated:** 2026-02-04 (Aligned with Hierarchical Context Architecture)

Manage the finite context window as a scarce resource. Sessions are isolated — use files as bridges.

## Core Principles

1. **Context window is finite** — every token counts
2. **Sessions don't share memory** — files are the bridge
3. **State changes over time** — old facts need invalidation
4. **Files for persistence, conversation for continuity** — both matter
5. **Hierarchical memory** — book outline (compressed) + chapters (detailed)

## Quick Reference

### Key Scripts (New Architecture)
```bash
./scripts/memory-checkpoint.sh        # Manual checkpoint (interactive, full preservation)
./scripts/auto-checkpoint.sh          # Auto checkpoint (triggered by token monitor)
./scripts/close-chapter.sh            # End session: generate chapter summary
./scripts/check-before-ask.sh "X"     # Search before asking user
./scripts/memory retrieve "query"     # Vector search semantic memory
./scripts/memory ingest file.md       # Re-ingest updated semantic files
```

### State File Location
```
/root/.openclaw/workspace/memory/state.json
```

### When to Use This Skill

| Trigger | Action |
|---------|--------|
| Context > 50k tokens | Run `./scripts/memory-checkpoint.sh` |
| Session ending | Run `./scripts/close-chapter.sh` |
| Need to ask user | Run `./scripts/check-before-ask.sh` first |
| "What do I know about X" | `./scripts/memory retrieve "X"` |
| Facts changed | Update state.json |
| Learning something new | Update semantic files + re-ingest |

---

## 1. Hierarchical Context System (NEW)

**Architecture:** Book Outline (compressed narrative) + Chapters (detailed sessions)

### The Book Outline

`memory/context-hierarchy/book-outline.md` is a **running narrative** of all sessions:
- Loaded at session start (provides continuity)
- Updated at session end (via `close-chapter.sh`)
- Compressed summaries, not full transcripts
- Think: Table of contents for your entire existence

### Chapters

`memory/context-hierarchy/chapters/YYYY-MM-DD-HH-MM.md` are **detailed session logs**:
- One chapter per session/work period
- Contains full notes from `current-chapter.md`
- Searchable via vector memory (after ingestion)
- Archived for reference

### Current Chapter

`memory/context-hierarchy/current-chapter.md` is **active session notes**:
- Raw notes during session
- Cleared when chapter closes
- Think: Scratch pad

### Workflow

**Session Start:**
1. Load `book-outline.md` for continuity
2. Start fresh `current-chapter.md` for notes

**During Session:**
- Take notes in `current-chapter.md` as needed
- Update semantic files immediately when learning something significant

**Session End:**
1. Run `./scripts/close-chapter.sh`
2. Generate summary (2-3 sentences)
3. Archive chapter to `chapters/`
4. Append summary to `book-outline.md`
5. Clear `current-chapter.md`

**Before Reset (50k tokens):**
1. Run `./scripts/memory-checkpoint.sh`
2. Update active-work.md, semantic files
3. Re-ingest updated files
4. Update today-brief.md

---

## 2. State Management

### The State File

Maintain `/root/.openclaw/workspace/memory/state.json` as the **single source of truth** for current facts:

```json
{
  "version": 1,
  "updatedAt": "2026-02-01T03:00:00Z",
  "facts": {
    "user.location": {
      "value": "Jeddah",
      "updatedAt": "2026-01-31",
      "source": "user stated"
    },
    "user.preferredLanguage": {
      "value": "Python",
      "updatedAt": "2026-01-31",
      "source": "observed from requests"
    }
  },
  "invalidated": [
    {
      "key": "user.location",
      "oldValue": "Riyadh",
      "invalidatedAt": "2026-01-31",
      "reason": "user corrected"
    }
  ]
}
```

### State Operations

**Read state before answering questions about user/context:**
```bash
cat /root/.openclaw/workspace/memory/state.json | jq '.facts'
```

**Update a fact:**
1. Read current state.json
2. Move old value to `invalidated` array
3. Add new value with timestamp and source
4. Write back

**Never delete facts** — move to `invalidated` for audit trail.

---

## 3. Session Bridging

Sessions are isolated. Use these files as bridges:

| File | Purpose |
|------|---------|
| `memory/state.json` | Current facts, pending items |
| `memory/config-state.md` | What's configured |
| `memory/active-work.md` | Current work in progress |
| `memory/YYYY-MM-DD.md` | Today's events and decisions |

### Key Files to Read on Session Start

1. `memory/config-state.md` — So you don't ask "is X configured?"
2. `memory/active-work.md` — What's in progress
3. `memory/state.json` — Current facts
4. Today's `memory/YYYY-MM-DD.md` — Recent context

### When to Write

- **Session END** — not during (avoid conflicts with concurrent sessions)
- After config changes → update `config-state.md`
- After learning new facts → update `state.json`
- After completing/starting work → update `active-work.md`

---

## 4. Conversation Compression

When conversations get long, compress before context overflow.

### Compression Triggers

- Conversation > 20 exchanges
- Token estimate > 50k
- Topic shift detected
- Before session end

### Compression Process

1. **Extract key decisions** — what was decided?
2. **Extract action items** — what needs doing?
3. **Extract new facts** — update state.json
4. **Write summary** — to daily log `memory/YYYY-MM-DD.md`
5. **Optionally clear context** — if truly bloated

### Summary Template

```markdown
## Session Summary [HH:MM UTC]

**Topic:** [main subject]

**Decisions:**
- [decision 1]
- [decision 2]

**Actions:**
- [ ] [action item]

**New Facts:**
- [fact to add to state.json]

**Context for next session:**
[1-2 sentences of handoff context]
```

---

## 5. Memory Priority

Not all context is equal. Prioritize:

### High Priority (always keep)
- Current task/goal
- Recent user corrections
- Active project state
- Explicit user preferences

### Medium Priority (keep if space)
- Recent conversation history
- Related project context
- Relevant memory search results

### Low Priority (compress/discard first)
- Old tool outputs
- Verbose command results
- Exploratory tangents
- Superseded information

---

## 6. Token Estimation

Quick heuristics:
- **1 token ≈ 4 characters** (English)
- **1 token ≈ 0.75 words**
- **Code**: closer to 1 token per 3 characters

### Context Budget Guidelines

| Component | Target | Max |
|-----------|--------|-----|
| System prompt | 5k | 10k |
| Bootstrap files | 10k | 20k |
| Conversation history | 20k | 50k |
| Tool outputs | 10k | 30k |
| **Reserve for response** | 16k | 32k |

If approaching limits, compress conversation history first.

---

## 7. Scripts

### Memory Checkpoint (Manual - Full Preservation)

Run when context > 50k tokens or before any session reset:

```bash
./scripts/memory-checkpoint.sh
```

**Guides you through:**
1. Update active-work.md
2. Update semantic files (infrastructure, lessons-learned, protocols, team, company)
3. Re-ingest updated files
4. Update today-brief.md

### Auto Checkpoint (Automatic - Safety Net)

**Triggered automatically** by token-threshold-monitor hook at critical/emergency levels:

```bash
./scripts/auto-checkpoint.sh [token_count] [level]
```

**What it does:**
1. Extracts recent conversation snapshot
2. **Appends to `today-brief.md`** (working memory)
3. Sends Telegram notification

**When it triggers:**
- 140k tokens (critical) - Auto-checkpoint runs
- 195k tokens (emergency) - Auto-checkpoint runs

**Flow:**
```
Auto-checkpoint → today-brief.md (accumulates)
                        ↓
              End of session/day
                        ↓
         close-chapter.sh compacts → ONE chapter
                        ↓
              book-outline.md updated
```

**Why this flow:**
- Avoids creating many granular chapter files
- today-brief.md = working memory (accumulates during day)
- chapters/ = meaningful session summaries (one per session/day)
- book-outline.md = high-level narrative

**Note:** Auto-checkpoint is a safety net, not a replacement for manual checkpoint.

### Close Chapter (Session End)

Generate session summary and update book outline:

```bash
./scripts/close-chapter.sh
```

**Prompts for:**
- Chapter summary (2-3 sentences)
- Chapter title
- Continuity notes (optional)

### Check Before Ask

Search all knowledge sources before asking user:

```bash
./scripts/check-before-ask.sh "query"
# Or use alias: check "query"
```

**Searches:**
1. Gateway config
2. Vector memory (semantic search)
3. Memory files (state.json, config-state.md, active-work.md)
4. Environment variables
5. Shell config
6. Workspace config

### Vector Memory Search

Retrieve from semantic memory:

```bash
./scripts/memory retrieve "query"
```

### Re-ingest Updated Files

After updating semantic files:

```bash
./scripts/memory ingest memory/semantic/filename.md
```

---

## Anti-Patterns to Avoid

1. **Don't retrieve everything** — only what's needed for current task
2. **Don't keep stale context** — invalidate outdated facts
3. **Don't duplicate across files** — one source of truth
4. **Don't summarize too early** — context is valuable, compress only when needed
5. **Don't ignore session isolation** — always write important state to files
6. **Don't treat files as replacement for conversation** — files = persistence (across resets), conversation = continuity (within session)
7. **Don't wait for session end to write** — update immediately when learning something significant
8. **Don't skip memory checkpoint** — mandatory at 50k tokens to prevent context loss
9. **Don't ask without searching first** — run `check-before-ask.sh` to avoid dumb questions
10. **Don't forget to re-ingest** — updating semantic files without re-ingesting = knowledge not searchable

---

## Integration with Vector Memory

**Vector memory (LanceDB + Gemini embeddings)** is the primary knowledge base:

### Semantic Files (SOURCE OF TRUTH)
Located in `memory/semantic/`:
- `team.md` - Team information, emails, roles
- `company.md` - Business context, market position
- `infrastructure.md` - Technical setup, integrations
- `protocols.md` - Procedures and operating standards
- `lessons-learned.md` - Experience, mistakes, patterns

### Search Priority
1. **Vector search first:** `./scripts/memory retrieve "query"`
2. **State.json second:** For current facts with timestamps
3. **Ask user last:** Only if not found in 1 or 2

### Writing to Memory
**Write-as-we-work protocol:**
- Don't wait for session end
- Update semantic files immediately when learning
- Re-ingest after updates: `./scripts/memory ingest filename.md`
- State files (today-brief, active-work) = quick reference
- Semantic files = permanent, searchable knowledge

### The Two-Layer System
- **State files** (ephemeral): Today's reference, current work status
- **Semantic files** (permanent): Long-term knowledge, searchable via vector memory

Both are essential. State files for speed, semantic files for persistence.

---

## Related Documentation

- `AGENTS.md` - Full memory protocols and session architecture
- `memory/semantic/protocols.md` - Detailed operating procedures
- `memory/semantic/lessons-learned.md` - Experience and patterns
- `scripts/memory-checkpoint.sh` - Checkpoint implementation
- `scripts/close-chapter.sh` - Chapter closing workflow
