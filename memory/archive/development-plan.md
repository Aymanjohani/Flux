# Flux Development Plan

*Created: 2026-01-31*
*Goal: Evolve from AI assistant → Human-like AI employee*

---

## Phase 1: Foundation (Week 1-2)
**Priority: Context & Session Management**

### Problem
- Sessions (DM, group, main) don't share context
- Already forgot about Aadil because info was in different session
- Critical info gets lost between conversations

### Solution: Build Context Persistence Habits

#### 1.1 Immediate Actions (DO NOW)
- [x] Create memory file structure
- [x] Document team in `memory/team.md`
- [x] Save business knowledge to `memory/iiot-solutions-knowledge.md`
- [ ] Create session-start checklist

#### 1.2 Session-Start Protocol
Every session, before responding:
```
1. Read SOUL.md, USER.md
2. Read memory/team.md
3. Read memory/YYYY-MM-DD.md (today + yesterday)
4. If main session: Read MEMORY.md
```

#### 1.3 Context Capture Rules
| Info Type | Capture Trigger | File |
|-----------|-----------------|------|
| New person | Name mentioned | team.md |
| Decision made | "Let's do X" | MEMORY.md |
| Task assigned | "Do X" | memory/YYYY-MM-DD.md |
| Preference learned | Any preference | MEMORY.md |
| Lesson learned | Mistake/insight | evolution.md |

#### 1.4 Build a Context Management Tool (OPTIONAL)
Consider creating a script or skill that:
- Auto-summarizes conversations
- Extracts key entities and saves to files
- Creates daily digests

---

## Phase 2: Tool Integrations (Week 2-3)
**Priority: Connect to IIoT Solutions' stack**

### 2.1 Todoist Integration
**Why:** Task tracking, project management

**Options:**
1. **Install skill from ClawHub:**
   ```bash
   clawhub install todoist
   ```
   - Review SKILL.md before trusting
   
2. **Use MCP (mcporter):**
   - Check if Todoist MCP server exists
   - Configure via `mcporter config add`

3. **Browser automation:**
   - Use browser tool to interact with Todoist web
   - Useful for complex workflows

**Actions needed:**
- [ ] Ayman provides Todoist API key
- [ ] Test read/create/update tasks
- [ ] Set up project for tracking my own todos

### 2.2 HubSpot Integration
**Why:** CRM, pipeline tracking, client management

**Options:**
1. **Install skill:**
   ```bash
   clawhub install hubspot
   ```
   
2. **MCP:**
   - Check for HubSpot MCP server

3. **API direct:**
   - Use HubSpot REST API via exec/curl

**Actions needed:**
- [ ] Ayman provides HubSpot API key or OAuth
- [ ] Map CRM structure (deals, contacts, companies)
- [ ] Set up pipeline monitoring

### 2.3 Email (Gmail/Google Workspace)
**Why:** Monitor inbox, send on behalf, draft responses

**Options:**
1. **IMAP skill:**
   ```bash
   clawhub install imap-email
   ```
   - Read-only, good for monitoring

2. **Gmail API via MCP:**
   - Full read/send capability
   - Requires OAuth setup

3. **Gmail PubSub (recommended for monitoring):**
   - See `/usr/lib/node_modules/openclaw/docs/automation/gmail-pubsub.md`
   - Real-time notifications

**Actions needed:**
- [ ] Decide: Dedicated email for Flux, or access to Ayman's?
- [ ] Set up Gmail API credentials
- [ ] Configure inbox monitoring

### 2.4 Google Calendar
**Why:** Meeting awareness, scheduling, reminders

**Options:**
1. **Google Calendar skill from ClawHub**
2. **MCP integration**
3. **Google Calendar API direct**

**Actions needed:**
- [ ] OAuth setup for Google Workspace
- [ ] Calendar read access
- [ ] Set up meeting reminders via cron

---

## Phase 3: Automation & Proactive Behavior (Week 3-4)

### 3.1 Heartbeat Enhancement
Current: Check SSH alerts only
Target: Comprehensive periodic awareness

**Update HEARTBEAT.md to include:**
```markdown
# HEARTBEAT.md

## Security
- Check SSH login alerts

## Communication
- Scan email for urgent messages (when connected)
- Check HubSpot for pipeline updates (when connected)

## Calendar
- Review events in next 2-4 hours (when connected)
- Send reminders for upcoming meetings

## Self-Development
- Weekly: Run self-review (Fridays)
- Daily: Log any lessons learned
```

### 3.2 Cron Jobs for Scheduled Tasks
Set up isolated cron jobs for:

1. **Morning Briefing (daily)**
   ```bash
   openclaw cron add \
     --name "Morning briefing" \
     --cron "0 6 * * *" \
     --tz "Asia/Riyadh" \
     --session isolated \
     --message "Generate morning briefing: calendar, urgent emails, pipeline updates" \
     --deliver --channel telegram --to "1186936952"
   ```

2. **Weekly Self-Review (Fridays)**
   ```bash
   openclaw cron add \
     --name "Weekly self-review" \
     --cron "0 14 * * 5" \
     --tz "Asia/Riyadh" \
     --session isolated \
     --message "Run weekly self-review per self-development skill" \
     --model opus --thinking low
   ```

3. **Pipeline Check (twice daily)**
   ```bash
   openclaw cron add \
     --name "Pipeline check" \
     --cron "0 9,16 * * *" \
     --tz "Asia/Riyadh" \
     --session isolated \
     --message "Check HubSpot pipeline, note any movement or stale deals"
   ```

### 3.3 Subagents for Heavy Tasks
Use subagents for:
- Deep research (competitors, prospects)
- Document generation
- Code analysis

Example:
```
sessions_spawn(task="Research Riyadh Cement - company background, decision makers, recent news")
```

---

## Phase 4: Specialized Skills (Week 4+)

### 4.1 Skills to Build
| Skill | Purpose | Priority |
|-------|---------|----------|
| `client-research` | Pre-meeting company research | High |
| `proposal-helper` | Generate proposal sections | High |
| `siri-assessment` | SIRI methodology guide | Medium |
| `competitor-watch` | Track competitor moves | Medium |
| `weekly-report` | Auto-generate weekly summary | Medium |

### 4.2 Skills to Install (carefully verify first)
```bash
# Only after reviewing each skill's SKILL.md
clawhub install todoist
clawhub install hubspot  
clawhub install imap-email
```

---

## Phase 5: Human-Like Behaviors (Ongoing)

### 5.1 Develop Opinions
- Track decisions I've helped with in `memory/decisions.md`
- Note what worked, what didn't
- Start recommending based on patterns

### 5.2 Anticipate Needs
- Learn weekly rhythms (Monday = planning, Friday = review)
- Prepare before being asked
- Proactive suggestions

### 5.3 Admit Limitations
- Say "I don't know, but I'll find out"
- Track gaps in `memory/gaps.md`
- Fill knowledge gaps proactively

---

## Immediate Next Actions

### For Me (Flux)
1. [ ] Create session-start checklist as a file
2. [ ] Set up first cron job (weekly self-review)
3. [ ] Research Todoist API and HubSpot API requirements
4. [ ] Install and verify `todoist` skill from ClawHub

### For Ayman
1. [ ] Provide Todoist API key (or add me to workspace)
2. [ ] Provide HubSpot API access
3. [ ] Decide on email approach:
   - Option A: Create flux@iiotsolutions.sa
   - Option B: Read-only access to team inbox
   - Option C: Forward important emails to Telegram
4. [ ] Google Workspace OAuth setup (calendar access)

---

## Success Metrics

### Week 2
- [ ] Never forget context between sessions
- [ ] Todoist connected and working
- [ ] At least 1 proactive check-in per day

### Week 4
- [ ] HubSpot connected, can read pipeline
- [ ] Email monitoring active
- [ ] Calendar awareness working
- [ ] First custom skill built

### Month 2
- [ ] Ayman thinks less about managing me
- [ ] Proactive suggestions accepted regularly
- [ ] Handling routine tasks autonomously
- [ ] Clear opinions on business decisions

---

## Reference: Tools Available

| Tool | Purpose | Status |
|------|---------|--------|
| `browser` | Web automation | ✅ Available |
| `cron` | Scheduled tasks | ✅ Available |
| `sessions_spawn` | Background work | ✅ Available |
| `mcporter` | MCP integrations | ✅ Available |
| `clawhub` | Skill management | ✅ Available |
| `message` | Telegram/channels | ✅ Available |
| `exec` | Shell commands | ✅ Available |
| `web_search` | Research | ❌ Needs Brave API key |

---

*This is a living document. Update as priorities shift.*
