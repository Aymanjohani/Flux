# Context Management Strategies

*Reference: Load when dealing with context overflow or optimization*

## Strategy 1: Aggressive Summarization

**When:** Conversation > 30 exchanges or topic shift

**Process:**
1. Extract decisions and action items
2. Write 3-5 sentence summary to daily log
3. Update state.json with new facts
4. Continue with clean context

**Template:**
```
Completed [topic]. Decisions: [1-2 key points]. 
Next: [action items]. New facts: [if any].
```

## Strategy 2: Tool Output Compression

**When:** Tool outputs > 5000 chars

**Process:**
1. Extract only relevant data from output
2. Discard verbose metadata/logs
3. Keep error messages verbatim (useful for debugging)

**Examples:**
- `ls -la` output: Keep only relevant files
- API responses: Extract data fields, drop headers
- Build logs: Keep errors, drop success noise

## Strategy 3: Selective Memory Loading

**When:** Starting new session or topic change

**Process:**
1. Check state.json for current facts (always)
2. Check session-context.md for handoff (always)
3. Use memory_search for specific queries (on demand)
4. Load memory/*.md files only when relevant

**Don't:** Load all memory files into every session

## Strategy 4: Fact Lifecycle Management

**States:**
- Active: In state.json, current truth
- Superseded: Moved to invalidated[], kept for audit
- Archived: Compressed into MEMORY.md, removed from state.json

**Lifecycle:**
1. New fact → Add to state.json
2. Fact changes → Move old to invalidated, add new
3. Fact stable for weeks → Archive to MEMORY.md
4. Remove from state.json (searchable via memory_search)

## Strategy 5: Priority-Based Retention

**Tier 1 (Never discard):**
- Current task/goal
- User corrections
- Error states
- Explicit preferences

**Tier 2 (Keep if space):**
- Recent history (last 10 exchanges)
- Active project context
- Search results

**Tier 3 (Discard first):**
- Old tool outputs
- Exploratory tangents
- Superseded information
- Verbose logs

## Strategy 6: Cross-Session Coordination

**Cron jobs:** 
- Read state.json at start
- Write findings to daily log
- Update state.json if facts change
- Don't assume prior context

**Group chats:**
- Always check memory_search before saying "I don't know"
- Check state.json for current facts
- Don't leak private context from DMs

**DMs (main session):**
- Full access to MEMORY.md
- Can update state.json freely
- Primary source of truth

## Anti-Patterns

1. **Context hoarding:** Loading everything "just in case"
2. **Stale retention:** Keeping outdated facts in active context
3. **Duplication:** Same info in multiple places
4. **Premature compression:** Summarizing too early loses nuance
5. **Ignoring session scope:** Assuming DM context in group chat

## Token Budget Reference

Claude Opus 4: 200k input, 32k output
Typical allocation:
- System: 8-10k
- Bootstrap: 10-15k  
- History: 20-50k
- Tools: 10-20k
- Reserve: 30-50k for response + reasoning

**Warning signs:**
- Responses getting slower
- Compaction happening
- Missing earlier context

**Action:** Summarize to daily log, update state.json, continue clean
