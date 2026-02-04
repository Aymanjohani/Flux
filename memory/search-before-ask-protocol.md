# Search Before Ask Protocol

**Purpose:** Enforce the "Check Before Ask" instinct to reduce questions about information that already exists.

## The Cardinal Rule

**Before asking the user for ANYTHING, search these 6 locations:**

### 1. Gateway Config (`gateway config.get`)
Check for:
- API keys, tokens, credentials
- Channel configurations
- Model settings
- Service endpoints

**When:** Anytime you need configuration values

### 2. Vector Memory (`./scripts/memory retrieve "query"`)
Check for:
- Past conversations about this topic
- Decisions that were made
- Context from previous sessions
- Team information, processes

**When:** Questions about history, team, company, past work

### 3. Memory Files (Read directly)
- `memory/today-brief.md` - Today's key info
- `memory/active-work.md` - Current tasks
- `memory/semantic/team.md` - Team structure
- `memory/semantic/company.md` - Business context
- `memory/semantic/infrastructure.md` - Tech setup
- `memory/semantic/lessons-learned.md` - Experience
- `memory/context-hierarchy/book-outline.md` - Session narrative

**When:** Need current state, team info, or recent context

### 4. Environment Variables
```bash
printenv | grep -i <term>
```

Check for:
- API keys (OPENAI_API_KEY, etc.)
- Service credentials
- Configuration overrides

**When:** Looking for credentials or service URLs

### 5. Shell Config (`~/.bashrc`, `~/.zshrc`)
Check for:
- Aliases
- Path additions
- Environment setup

**When:** Questions about command availability

### 6. Workspace Files
```bash
find /root/.openclaw/workspace -name "*keyword*" -type f
grep -r "keyword" /root/.openclaw/workspace
```

Check for:
- Documentation
- Scripts
- Configuration files
- Past work

**When:** Anything related to the workspace

## The Automated Tool

Use the automated checker:
```bash
./scripts/check-before-ask.sh "what I'm looking for"
```

**Returns:**
- Exit 0 + "Answer found: [location]" → Use that, don't ask
- Exit 1 + "Not found" → Safe to ask user

## Decision Tree

```
Need information?
    ↓
Run automated check
    ↓
Found? → Use it
    ↓
Not found? → Search memory
    ↓
Still not found? → Check files
    ↓
Still not found? → NOW ask user
```

## Examples

### ❌ Bad (Don't Do This)
```
User: "Set up email monitoring"
Me: "What's your email address?"
```
*It's probably in config or team.md*

### ✅ Good (Do This)
```
User: "Set up email monitoring"
Me: <checks config, finds email: coding@iiotsolutions.sa>
Me: "Found your email in config (coding@iiotsolutions.sa). Setting up monitoring..."
```

### ❌ Bad (Don't Do This)
```
User: "Who's the CTO?"
Me: "Who is your CTO?"
```
*It's in team.md*

### ✅ Good (Do This)
```
User: "Who's the CTO?"
Me: <checks team.md>
Me: "Aadil Feroze is the CTO."
```

## Exceptions (When It's OK to Ask Without Searching)

1. **User explicitly wants YOUR opinion** ("What do you think?")
2. **Confirming destructive action** ("Should I delete this?")
3. **Clarifying ambiguity** ("Did you mean X or Y?")
4. **Information genuinely unknowable** ("What do you want for dinner?")

## Integration with Metacognition

The pre-flight thought loop includes an epistemic check:

```
Epistemic Check:
  → Do I know this? If no → SEARCH
  → Have I verified recently? If no → SEARCH
  → Am I guessing? If yes → SEARCH
```

## Success Metrics

Track:
- **Questions avoided** (found answer without asking)
- **User corrections** ("You already have that") → should be ZERO
- **Search efficiency** (found in <30 seconds)

**Goal:** Zero "you already have that" moments for 1 week straight.

## Quick Reference Checklist

Before asking the user anything:

- [ ] Checked config? (`gateway config.get`)
- [ ] Searched vector memory? (`./scripts/memory retrieve`)
- [ ] Read memory files? (today-brief.md, active-work.md, team.md)
- [ ] Checked environment? (`printenv | grep`)
- [ ] Searched workspace? (`grep -r` or `find`)
- [ ] Used automated tool? (`./scripts/check-before-ask.sh`)

If all NO → OK to ask.

---

**Status:** Protocol defined, tools ready
**Created:** 2026-02-04
**Author:** Flux
