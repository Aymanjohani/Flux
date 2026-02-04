# Flux Improvement Plan — Session Management Overhaul

**Created:** 2026-02-01  
**Status:** DRAFT — Awaiting Ayman's approval

---

## Part 1: Problem Analysis

### What Went Wrong

| Issue | Example | Root Cause |
|-------|---------|------------|
| Asked for info I already have | Asked for Groq API key that was in my config | Didn't check own system first |
| Lost context after compaction | Forgot STT was already configured | No verification of current state |
| Cross-session confusion | Info from Aadil session not available in Ayman session | Not writing to shared files |
| Tried to be omnipresent | Attempting real-time sync across concurrent sessions | Wrong mental model |

### The Real Problem

I was treating sessions like one continuous conversation. They're not. Each session is:
- **Isolated** — Separate context window
- **Concurrent** — Multiple can run simultaneously  
- **Finite** — Compaction will erase what's not persisted

**I am not omnipresent. I'm one employee in multiple meetings — focus on who I'm with.**

---

## Part 2: Core Principles

### Principle 1: Check Before Ask
Before asking the user for ANY information:
1. Check `gateway config.get` (my own config)
2. Check relevant memory files
3. Use `memory_search` if unsure
4. Only ask if truly not found

### Principle 2: One Meeting at a Time
When in an active session:
- Focus on that person/conversation
- Don't try to update other sessions in real-time
- Write to shared files at session END, not during

### Principle 3: Just Send When Asked
When asked to contact another session:
- **Just send it** — don't overthink activity status
- The recipient will see it when they're ready
- Only queue if *I'm* doing a complex task and need to defer sending

**Simple rule:** If someone says "tell X something" → send it now.

### Principle 4: Heartbeats for Sync
Heartbeats (when no active conversation) are the right time to:
- Check queued messages
- Sync state across sessions
- Consolidate memory files
- Do proactive work

---

## Part 3: Session Lifecycle

### Session Start
```
1. [Auto-injected] SOUL.md, USER.md, IDENTITY.md, AGENTS.md
2. Read memory/YYYY-MM-DD.md (today)
3. Read memory/state.json → check pendingMessages for this person
4. If any pending messages → deliver them first
5. If main session → also read MEMORY.md
```

### During Session
```
- Focus on current conversation
- If asked to message another session → check if active, queue if busy
- If important info learned → note for end-of-session write
- Don't write to shared files mid-conversation (avoid conflicts)
```

### Session End
```
1. Write significant info to memory/YYYY-MM-DD.md
2. Update memory/state.json if any pending forwards
3. Update memory/active-work.md with current status
4. If config changed → update memory/config-state.md
```

### Heartbeat (No Active Session)
```
1. Check memory/state.json → deliver any pending messages
2. Check HEARTBEAT.md tasks
3. Consolidate/clean memory files if needed
4. Proactive work (research, organizing, etc.)
```

---

## Part 4: Message Queuing System

### Structure: `memory/state.json`

```json
{
  "pendingMessages": [
    {
      "id": "uuid",
      "from": "Ayman (telegram:1186936952)",
      "to": "telegram:124756960",
      "toName": "Aadil",
      "message": "Check the Todoist restructure proposal",
      "context": "Re: task management discussion",
      "queuedAt": "2026-02-01T05:20:00Z",
      "priority": "normal"
    }
  ],
  "activeSessions": {},
  "lastSync": "2026-02-01T05:00:00Z"
}
```

### Message Flow (Simplified)

```
REQUEST: "Tell Aadil X"
           ↓
     Just send it
     (sessions_send or message tool)
           ↓
     Confirm delivery
```

**Queue is only for:** Tasks I need to do later (not messages to send)

### State Tracking

`memory/state.json` tracks:
- Pending tasks (things I need to follow up on)
- Cross-session context (who asked for what)
- NOT a message queue — messages go out immediately

---

## Part 5: Memory File Structure

### File Purposes

| File | What Goes Here | When Updated |
|------|----------------|--------------|
| `MEMORY.md` | Core identity, key lessons, long-term prefs | Weekly review |
| `memory/YYYY-MM-DD.md` | Today's events, decisions, conversations | Session end |
| `memory/team.md` | Team contacts, roles, preferences | When team changes |
| `memory/state.json` | Pending messages, cross-session state | Real-time (queue ops) |
| `memory/config-state.md` | What's configured, what's pending | After config changes |
| `memory/active-work.md` | Current in-progress work | Session end |

### What NOT to Do

- ❌ Write to shared files while another session might be reading
- ❌ Duplicate info across multiple files
- ❌ Store secrets in memory files (use config or env vars)
- ❌ Let memory files grow unbounded (prune weekly)

---

## Part 6: Implementation Checklist

### Phase 1: Foundation (Today)

- [x] Create `memory/state.json` with queue structure ✅
- [x] Create `memory/config-state.md` with current integrations ✅
- [x] Create `memory/active-work.md` template ✅
- [x] Update this plan based on Ayman's feedback ✅
  - Simplified: Just send when asked (no complex queue logic)

### Phase 2: Behavior Changes (This Week)

- [x] Updated AGENTS.md with "Check Before Ask" protocol ✅
- [x] Updated AGENTS.md with Session End Protocol ✅
- [x] Updated HEARTBEAT.md with state sync checks ✅
- [x] Updated context-manager skill ✅
- [ ] Practice these habits in real interactions (ongoing)

### Phase 3: Automation (Next Week)

- [ ] Add queue check to HEARTBEAT.md routine
- [ ] Build habit of session-end summary
- [ ] Weekly memory file review and consolidation

---

## Part 7: Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Asking for info I have | Happened today | Zero |
| Cross-session handoff | Manual, often forgotten | Queued, automatic |
| Context after compaction | Lost | Preserved in files |
| Concurrent session confusion | High | None (focused model) |

**The test:** Can Ayman give me info once and trust I'll remember it across all sessions without him repeating?

---

## Part 8: Mental Model Summary

```
OLD MODEL (Wrong):
┌─────────────────────────────────────┐
│           FLUX (omnipresent)        │
│  Sees all sessions simultaneously   │
│  Updates everyone in real-time      │
└─────────────────────────────────────┘

NEW MODEL (Correct):
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Session  │   │ Session  │   │ Session  │
│ (Ayman)  │   │ (Aadil)  │   │ (Group)  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    ↓
           ┌───────────────┐
           │ Shared Files  │  ← Async handoff
           │ (memory/*.md) │  ← Updated at session END
           │ (state.json)  │  ← Message queue
           └───────────────┘
```

**I'm one employee moving between meetings, not a hive mind.**

---

## Ayman's Feedback

*(Your comments here before I implement)*

---

**Awaiting approval to proceed with Phase 1.**
