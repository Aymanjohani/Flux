# Check Before Ask - Pre-flight Check Script

**Purpose:** Enforce the "Check Before Ask" discipline (Goal #1 from goals.md)

**Problem it solves:** Prevents asking the user for information that already exists in config, memory, or files.

---

## Usage

```bash
./scripts/check-before-ask.sh "what you're looking for"
```

**Example:**
```bash
./scripts/check-before-ask.sh "groq api key"
./scripts/check-before-ask.sh "todoist"
./scripts/check-before-ask.sh "hubspot token"
```

---

## What It Searches (6 Locations)

1. **Gateway Config** - OpenClaw gateway configuration
2. **Vector Memory** - Semantic knowledge base (most reliable)
3. **Memory Files** - state.json, config-state.md, active-work.md, today-brief.md
4. **Environment Variables** - Shell environment
5. **Shell Config** - ~/.bashrc, ~/.profile, ~/.bash_profile
6. **Workspace Config** - config/ and ~/.config/ files

---

## Exit Codes

- **0** - Information found (don't ask user)
- **1** - Information not found (safe to ask)
- **123** - Gateway timeout (not critical, other checks still run)

---

## Integration with Workflow

**Before asking Ayman anything:**

```bash
# Run check first
./scripts/check-before-ask.sh "thing I need"

# If exit code 0 → Information exists, use it
# If exit code 1 → Safe to ask
```

**Mental checklist (from goals.md):**
1. Is it in config? → `check-before-ask.sh` handles this
2. Is it in memory? → `check-before-ask.sh` handles this
3. Is it in files? → `check-before-ask.sh` handles this
4. Did I already do this? → Check daily logs manually

---

## When To Use

✅ **Use this script when:**
- Looking for API keys, tokens, credentials
- Checking if integration is configured
- Finding tool locations or configuration
- Verifying if something was already set up
- Before asking "do we have X?"

❌ **Don't use for:**
- Subjective decisions (user preference needed)
- Time-sensitive questions (script takes ~5-10 seconds)
- Complex context that requires understanding (use vector search directly)

---

## Example Output

**Found:**
```
🔍 Check Before Ask - Searching for: "todoist"
================================================

📋 [1/6] Checking Gateway Config...
   ❌ Not in gateway config

🧠 [2/6] Searching Vector Memory...
   ✅ FOUND in vector memory!
   
   [Shows relevant chunks from infrastructure.md]

================================================
✅ ANSWER FOUND - Information exists! Check results above.

💡 Next step: Use the information found (don't ask user)
```

**Not found:**
```
🔍 Check Before Ask - Searching for: "some-random-thing"
================================================

[All checks return ❌ Not found]

================================================
❌ NOT FOUND - Information doesn't exist in accessible locations.

✅ Safe to ask user for: "some-random-thing"

📝 Once you get the answer, consider adding it to:
   - memory/semantic/ files (for searchable knowledge)
   - memory/config-state.md (for config reference)
   - memory/state.json (for current state)
```

---

## Success Metrics (from goals.md)

**Target:** Zero "you already have that" moments for 1 week straight

**Tracking:**
- Log each use of this script in daily files
- Track prevented questions (found before asking)
- Track false negatives (asked when info existed)

**Weekly review question:**
- Did I ask for info I already had? (Target: 0)

---

## Maintenance

**When to update:**
- Add new search locations if we store config elsewhere
- Adjust output verbosity if too noisy
- Add filtering if duplicate results become a problem

**Current limitations:**
- Gateway timeout (not critical - other checks work)
- Doesn't understand context (just keyword matching)
- Can't answer "why" questions (just finds references)

---

## Future Enhancements

**Possible improvements:**
1. Semantic understanding (not just keyword match)
2. Confidence scoring (how likely is this the right answer?)
3. Interactive mode (ask for clarification)
4. Cache results for faster subsequent searches
5. Integration with session-end protocol

---

**Created:** 2026-02-04  
**Related:** goals.md Goal #1 (Build "Check Before Ask" Instinct)
