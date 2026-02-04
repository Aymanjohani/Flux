# Context Hierarchy System

**Purpose:** Hierarchical memory that prevents context amnesia when sessions compact/reset.

## Architecture

```
Tier 1: Working Memory (raw, verbatim)
  └─> Last ~50 messages in session context

Tier 2: Episodic Memory (compressed 10x)
  └─> "Chapter summaries" of completed work sessions
  └─> Location: memory/context-hierarchy/chapters/

Tier 3: Semantic Knowledge (permanent)
  └─> Facts moved to semantic files + vector DB
  └─> Location: memory/semantic/
```

## The "Book Chapter" Pattern

Each session is a "chapter" in an ongoing book:

1. **During session:** Work happens in raw context (Tier 1)
2. **At chapter close:** Generate high-fidelity summary → Tier 2
3. **Important facts:** Move to semantic files → Tier 3
4. **New session starts:** Load "Book Outline" (summaries of all chapters)

## Files

- `book-outline.md` - The ongoing narrative (loaded into every new session)
- `chapters/YYYY-MM-DD-HH-MM.md` - Individual chapter summaries
- `current-chapter.md` - Temp file for active session notes

## Usage

### Manual Chapter Close
```bash
./scripts/close-chapter.sh
```

### Automatic (on session reset/compact)
- Hook into session-memory internal hook
- Automatically generates chapter summary
- Updates book-outline.md

## Chapter Summary Format

```markdown
# Chapter: [Title] — [Date/Time]

## Context
- Session: [key]
- Duration: [X hours]
- Token count: [approximate]

## What Happened
[High-fidelity 2-3 paragraph summary of work done]

## Key Decisions
- [Decision 1 with reasoning]
- [Decision 2 with reasoning]

## Outcomes
- [Deliverable 1]
- [Deliverable 2]

## Continuity Notes
[What the next session needs to know]
```

## Integration with Memory Checkpoint

The existing `scripts/memory-checkpoint.sh` already captures state before reset.

**Enhancement:** Add chapter summary generation to checkpoint flow:
1. Checkpoint script asks: "What did we accomplish?"
2. Generates chapter summary
3. Appends to book-outline.md
4. Archives full chapter file

## Benefits

- **No more context amnesia** - Each reset preserves narrative continuity
- **Faster context loading** - Book outline is 10-20KB vs re-reading all history
- **Better handoffs** - Future sessions (or sub-agents) know "the story so far"
- **Searchable history** - Chapters are indexed in vector memory

---

**Status:** System designed, ready to implement scripts
**Created:** 2026-02-04
**Author:** Flux
