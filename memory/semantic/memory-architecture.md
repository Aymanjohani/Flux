# Memory Architecture — Complete System Design

*Last Updated: 2026-02-04*
*Version: 2.1 (Hierarchical Tiered Memory with Deduplication)*

---

## Overview

This document describes the complete memory architecture for maintaining context across sessions, channels, users, and time. The system uses a **hierarchical tiered approach** with automatic compression, vectorization, and deduplication.

**Key principle:** Each piece of information exists in the vector DB exactly once.

---

## Memory Tiers

| Tier | Name | Age | Storage | Search | Vectorized | Notes |
|------|------|-----|---------|--------|------------|-------|
| **1** | Hot Memory | 0-6h | `today-brief.md` | Grep | No | Raw, accumulating |
| **2** | Warm Memory | 6-24h | `summaries/*.md` | Vector | Yes | Compressed 10x |
| **3** | Cold Memory | >24h | `chapters/*.md` | Vector | Yes | Daily narrative |
| **4** | Permanent | Forever | `semantic/*.md` | Vector | Yes | Facts, protocols |

---

## Data Flow (No Duplication)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CONTINUOUS INPUT                             │
│   (Telegram, Email, Sessions, Auto-checkpoints, Multiple Users)     │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 1: HOT MEMORY (0-6 hours)                                     │
│  ├── today-brief.md                                                 │
│  ├── Raw events, auto-checkpoint snapshots                          │
│  ├── Searchable via: grep (fast, exact match)                       │
│  └── NOT vectorized (too fresh, may change)                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                          Every 6 hours
                          (Cron: 0 */6 * * * UTC)
                          ./scripts/summarize-brief.sh
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 2: WARM MEMORY (6-24 hours)                                   │
│  ├── summaries/YYYY-MM-DD-HH00.md                                   │
│  ├── LLM-summarized (compressed 10x)                                │
│  ├── Searchable via: vector search                                  │
│  └── VECTORIZED immediately after creation                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                          End of day
                          (Cron: 55 23 * * * Asia/Riyadh)
                          ./scripts/create-daily-chapter.sh
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 3: COLD MEMORY (>24 hours)                                    │
│  ├── chapters/YYYY-MM-DD.md                                         │
│  ├── Cohesive daily narrative (combines 4 summaries)                │
│  ├── book-outline.md updated with chapter summary                   │
│  ├── Searchable via: vector search                                  │
│  │                                                                  │
│  │  DEDUPLICATION STEP:                                             │
│  │  1. Chapter created and VECTORIZED                               │
│  │  2. Summary vectors DELETED from DB                              │
│  │  3. Summary files ARCHIVED (kept for audit, not in vector)       │
│  │                                                                  │
│  └── Result: Only chapter in vector DB (single source of truth)     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                          Manual updates
                          (./scripts/memory-checkpoint.sh)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 4: PERMANENT MEMORY                                           │
│  ├── semantic/infrastructure.md                                     │
│  ├── semantic/protocols.md                                          │
│  ├── semantic/lessons-learned.md                                    │
│  ├── semantic/team.md                                               │
│  ├── semantic/company.md                                            │
│  ├── semantic/memory-architecture.md (this file)                    │
│  ├── state.json (facts, contacts)                                   │
│  └── VECTORIZED after each manual update                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Deduplication Strategy

**Problem:** If we vectorize 6-hour summaries AND the daily chapter (which contains the same info), we have duplication.

**Solution:** Delete summary vectors when creating daily chapter.

```
Timeline:     6h          12h         18h         24h
              │           │           │           │
Summaries:    S1──────────S2──────────S3──────────S4
              │           │           │           │
Vector DB:    +S1         +S2         +S3         +S4
              │           │           │           │
At 24h:       │           │           │           ├── Create chapter
              │           │           │           ├── Vectorize chapter
              │           │           │           ├── DELETE S1,S2,S3,S4 vectors
              │           │           │           └── Archive S1,S2,S3,S4 files
              │           │           │           │
Result:       Only chapter in vector DB ──────────┘
```

**Commands:**
```bash
# Delete vectors by source pattern
./scripts/memory delete "memory/summaries/2026-02-04-*"

# Delete specific file's vectors
./scripts/memory delete "memory/summaries/2026-02-04-0600.md"
```

---

## Retrieval Strategy

When answering a question, search in this order:

### 1. Book Outline First (Navigation)
```bash
cat memory/context-hierarchy/book-outline.md
```
- Identifies which chapters are relevant
- Provides narrative context
- Always loaded at session start

### 2. Hot Memory (Grep) — For recent discussions
```bash
grep -i "query" memory/today-brief.md
```
- Finds discussions < 6 hours old
- Exact match, fast
- Not vectorized

### 3. Vector Search (All Vectorized Tiers)
```bash
./scripts/memory retrieve "query"
```
- Searches: summaries (6-24h) + chapters (>24h) + semantic (permanent)
- Semantic similarity matching
- No duplication in results

### 4. Multi-Tier Search Script (Comprehensive)
```bash
./scripts/memory-search.sh "query"
```
- Searches ALL tiers automatically
- Reports where results were found
- Combines grep + vector search

---

## Cron Jobs

| Job | Schedule | Script | What It Does |
|-----|----------|--------|--------------|
| **6-Hour Summarization** | `0 */6 * * * UTC` | `summarize-brief.sh` | Summarizes today-brief → creates 6hr summary → vectorizes it → clears today-brief |
| **Daily Chapter** | `55 23 * * * Asia/Riyadh` | `create-daily-chapter.sh` | Combines 4 summaries → creates chapter → vectorizes chapter → **deletes summary vectors** → archives summaries |

---

## Scripts Reference

| Script | Purpose | Vectorizes | Deletes | Trigger |
|--------|---------|------------|---------|---------|
| `auto-checkpoint.sh` | Safety net, appends to today-brief | No | No | Auto (token monitor) |
| `summarize-brief.sh` | 6-hour summarization | Yes (summary) | No | Cron (6h) |
| `create-daily-chapter.sh` | Daily chapter creation | Yes (chapter) | Yes (summaries) | Cron (daily) |
| `memory-checkpoint.sh` | Full manual checkpoint | No | No | Manual |
| `close-chapter.sh` | Interactive chapter close | No | No | Manual |
| `memory-search.sh` | Multi-tier search | No | No | Manual |
| `check-before-ask.sh` | Search before asking user | No | No | Manual |

---

## Token Threshold Integration

The token-threshold-monitor hook integrates with this architecture:

```
Token Count → Threshold Crossed → Action
─────────────────────────────────────────
< 50k      → Normal            → Continue
50k+       → Warning           → System prompt warning
100k+      → Alert             → + Telegram notification
140k+      → Critical          → + Auto-checkpoint to today-brief
195k+      → Emergency         → + Auto-checkpoint to today-brief
```

Auto-checkpoint appends to today-brief.md, which gets summarized at the next 6-hour mark.

---

## Session Start Protocol

When starting a new session:

1. **Load book-outline.md** — Narrative continuity (what chapters exist)
2. **Read today-brief.md** — Recent context (< 6h, not yet summarized)
3. **Check active-work.md** — Current tasks
4. **Check state.json** — Known facts, contacts

```bash
# Quick context load
cat memory/context-hierarchy/book-outline.md
cat memory/today-brief.md | head -100
cat memory/active-work.md | head -50
```

---

## Directory Structure

```
memory/
├── today-brief.md              # Hot memory (0-6h, grep-searchable)
├── active-work.md              # Current tasks
├── state.json                  # Facts, contacts
├── config-state.md             # System config
│
├── summaries/                  # Warm memory (6-24h, vectorized)
│   ├── 2026-02-04-0600.md      # 6-hour summary (vectorized)
│   ├── 2026-02-04-1200.md      # 6-hour summary (vectorized)
│   └── archive/                # Archived after daily chapter
│       └── 2026-02-03/         # Vectors deleted, files kept
│
├── context-hierarchy/          # Cold memory (>24h, vectorized)
│   ├── book-outline.md         # Narrative (always loaded)
│   ├── chapters/
│   │   ├── 2026-02-03.md       # Daily chapter (vectorized)
│   │   └── 2026-02-04.md       # Daily chapter (vectorized)
│   └── README.md
│
├── semantic/                   # Permanent memory (vectorized)
│   ├── infrastructure.md
│   ├── protocols.md
│   ├── lessons-learned.md
│   ├── team.md
│   ├── company.md
│   └── memory-architecture.md  # This file
│
└── vector_db/                  # LanceDB vector store
    └── memory_chunks.lance/    # Single source of truth
```

---

## Memory Engine Commands

```bash
# Ingest file to vector DB
./scripts/memory ingest <file-path>

# Search vector DB
./scripts/memory retrieve "query"

# Delete vectors by source pattern
./scripts/memory delete "pattern"
./scripts/memory delete "memory/summaries/*"
./scripts/memory delete "memory/summaries/2026-02-04-0600.md"

# Consolidate episodic → semantic
./scripts/memory dream [days-back]

# Rebuild vector DB from semantic/ only
./scripts/memory rebuild
```

---

## Multi-User / Multi-Channel Support

This architecture supports multiple users and channels because:

1. **Centralized today-brief.md** — All channels append here
2. **6-hour batching** — Summarizes all activity, regardless of source
3. **Vector search** — Finds relevant info across all sources
4. **No session isolation** — Memory is shared (by design)

**Per-user isolation (if needed):**
- Use `state.json` contacts to track user-specific facts
- Tag summaries with channel/user in content
- Filter retrieval results by user context

---

## Key Principles

1. **Freshness tiers** — Recent info grep-searchable, old info vectorized
2. **Compression over time** — Raw → 6hr summary → daily chapter → book outline
3. **No duplication** — Summary vectors deleted when chapter created
4. **Single source of truth** — Each fact in vector DB exactly once
5. **Book outline = continuity** — Loaded every session, tells the story
6. **Safety net = auto-checkpoint** — Token monitor triggers preservation automatically
7. **Audit trail preserved** — Files archived even after vectors deleted

---

## Troubleshooting

### "Can't find discussion from 2 hours ago"
- Check `today-brief.md` with grep (not yet summarized)
- Wait for next 6-hour summarization, or search manually

### "Can't find discussion from 12 hours ago"
- Should be in `summaries/*.md` (vectorized)
- Run: `./scripts/memory retrieve "topic"`

### "Can't find discussion from 3 days ago"
- Should be in `chapters/*.md` (vectorized)
- Check `book-outline.md` for which chapter
- Run: `./scripts/memory retrieve "topic"`

### "Duplicate results in vector search"
- Deduplication may have failed
- Check if old summaries still in vector DB
- Run: `./scripts/memory delete "memory/summaries/YYYY-MM-DD-*"`

### "Vector search returns nothing"
- File may not be ingested yet
- Run: `./scripts/memory ingest <file>`

### "Memory search too slow"
- Use `memory-search.sh` for targeted multi-tier search
- Use grep for exact matches on recent content

---

## Research Basis

This architecture is based on:

- **Hierarchical Context Pattern** (Mem0 research): 26% accuracy improvement, 91% latency reduction
- **Book Chapter Pattern**: Compressed narrative summaries for continuity
- **Temporal Tiering**: Different search strategies for different freshness levels

*Reference: cognitive-architecture-analysis.md*

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial hierarchical architecture |
| 2.0 | 2026-02-04 | Added cron-based summarization |
| 2.1 | 2026-02-04 | Added deduplication (delete summary vectors) |
