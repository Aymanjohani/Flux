# Check-Before-Ask System

**Built:** 2026-02-02 (Overnight Self-Improvement)  
**Purpose:** Automate "check before ask" instinct to avoid asking for information that already exists

## The Problem

From AGENTS.md:
> "Before asking user for info: Check gateway config → memory → files → then ask"

This was manual, error-prone, and easy to forget. The result: asking Ayman for info that already existed in config, memory, or files.

## The Solution

Three integrated tools:

### 1. `./scripts/ask` (Main Interface)
**What it does:**
- Searches all knowledge sources for your question
- Logs patterns of found vs not-found
- Provides clear verdict: safe to ask or answer exists

**Usage:**
```bash
./scripts/ask "What's Ayman's email?"
./scripts/ask "HubSpot API key"
./scripts/ask "Saudi industrial regulations"
```

**Example Output:**
```
🔍 Running pre-flight check...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Checking Vector Memory...
✓ FOUND in vector memory:
ayman@iiotsolutions.sa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ANSWER EXISTS — Review above
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. `./scripts/check-before-ask.sh` (Core Engine)
**What it searches:**
1. ✓ Gateway Config (`openclaw gateway config.get`)
2. ✓ Vector Memory (`./scripts/memory retrieve`)
3. ✓ Key Files (team.md, company.md, infrastructure.md, protocols.md, config-state.md, state.json, today-brief.md, IDENTITY.md, USER.md)
4. ✓ Daily Logs (last 7 days)
5. ✓ Environment (~/.bashrc)

**Exit Codes:**
- `0` = Safe to ask (no existing answer)
- `1` = Answer found (don't ask)

### 3. `./scripts/ask-pattern-logger.sh` (Analytics)
**What it tracks:**
- Questions asked
- Whether answer existed
- Where it was found (config, memory, files, etc.)
- Timestamp

**View Report:**
```bash
./scripts/ask-pattern-logger.sh report
```

**Example Report:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Ask Pattern Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total questions checked: 47
Answer already existed: 12 (25%)
Legitimately new: 35 (75%)

Most Common Sources (when found):
  8 vector-memory
  3 gateway-config
  1 files

⚠️  WARNING: >20% of questions had existing answers!
   Review patterns and improve check-before-ask habit
```

## Integration with Goals

From `memory/goals.md`:
> **Goal #1: Build "Check Before Ask" Instinct**  
> Before asking Ayman anything → run mental checklist

This tool automates that checklist.

**Target:** Zero "you already have that" moments for 1 week straight

## How to Use (Protocol)

**Before asking Ayman anything technical:**
```bash
./scripts/ask "your question"
```

**If it says "SAFE TO ASK":**
- Go ahead and ask

**If it says "ANSWER EXISTS":**
- Review the results shown
- Use that info instead of asking
- Only ask if the existing answer is insufficient (and explain why)

## Success Metrics

Track weekly:
```bash
./scripts/ask-pattern-logger.sh report
```

**Goal:** <10% of questions should have existing answers

If percentage is high → investigate patterns:
- Am I checking the right sources?
- Are sources out of date?
- Am I phrasing questions poorly?

## Future Enhancements

Ideas for improvement:
- [ ] Add fuzzy matching (typo-tolerant)
- [ ] Search HubSpot notes/contacts
- [ ] Check Gmail history
- [ ] Integration with AGENTS.md's session-end protocol
- [ ] Auto-suggest better search queries
- [ ] Weekly digest: "You asked about X 3 times, here's where it was"

## Files

- `/root/.openclaw/workspace/scripts/ask` — Main interface
- `/root/.openclaw/workspace/scripts/check-before-ask.sh` — Search engine
- `/root/.openclaw/workspace/scripts/ask-pattern-logger.sh` — Analytics
- `/root/.openclaw/workspace/memory/ask-patterns.jsonl` — Log data

## Philosophy

From SOUL.md:
> "Be resourceful before asking. Try to figure it out. Read the file. Check the context. Search for it. Then ask if you're stuck. The goal is to come back with answers, not questions."

This tool embodies that philosophy.
