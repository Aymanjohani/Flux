# Quick Query Tool

Fast way to search Flux's knowledge base from the command line.

## Usage

```bash
./scripts/quick-query.sh "your question"
```

## Examples

```bash
# Find team information
./scripts/quick-query.sh "Who handles BD?"

# Check integrations
./scripts/quick-query.sh "HubSpot"

# Look up past decisions
./scripts/quick-query.sh "KESWA meeting"

# Find technical details
./scripts/quick-query.sh "LinkedIn authentication"
```

## What It Searches

1. **Vector memory** — All ingested knowledge (223 chunks)
2. **State files** — config-state.md, team.md, active-work.md, state.json
3. **Recent logs** — Last 7 days of daily logs

## Output Format

```
🔍 Searching for: [your query]

📚 Vector Memory Results:
[Top 5 semantic matches with scores and sources]

📋 State Files Check:
[Matches from current state files]

📅 Recent Logs:
[Matches from last 7 days]

💡 Tip: For detailed context, ask me directly via chat
```

## When to Use

**Use quick-query when:**
- You want a fast lookup without asking me
- You need to verify something quickly
- You're debugging or checking state
- You want to see what I know about a topic

**Ask me directly when:**
- You need interpretation or analysis
- The question requires context
- You want recommendations, not just facts
- It's a complex multi-part question

## Under the Hood

**Script:** `/root/.openclaw/workspace/scripts/quick-query.sh`

**Dependencies:**
- `./scripts/memory retrieve` (vector search)
- `grep`, `jq` (state file parsing)
- Standard Unix tools

**Performance:** Returns results in 1-2 seconds

## Integration

Can be called from:
- Command line (manual)
- Other scripts (programmatic)
- Cron jobs (scheduled checks)
- Custom automations

## Limitations

- Case-insensitive search only
- No fuzzy matching (exact word matching)
- Limited to last 7 days for log searches
- Returns raw matches, no AI interpretation

For complex queries or analysis, ask me directly via chat instead.
