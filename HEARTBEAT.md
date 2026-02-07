# HEARTBEAT.md

## State Sync (Every Heartbeat)
Quick checks to keep state consistent:
1. Read `memory/state.json` — any pending items to follow up on?
2. Read `memory/active-work.md` — anything stalled or needs attention?
3. If memory files seem stale, consolidate recent daily logs

## SSH Login Alerts
Check /var/log/ssh-alerts.jsonl for new entries. If there are new logins, alert Ayman via Telegram with the details (time, user, IP).

Command to check: /usr/local/bin/check-ssh-alerts.sh

## LinkedIn Intelligence (Nightly, 2 AM Riyadh Time)

**NEW (2026-02-04): Native browser orchestration** - Much faster than subprocess approach

Check for trigger marker during night hours:
```bash
ls skills/linkedin-intel/output/.cron-trigger-* 2>/dev/null
```

If marker exists:
1. Read `skills/linkedin-intel/scripts/intelligence-runner.md` for execution protocol
2. Run intelligence gathering using native browser tool (NOT Python subprocess)
3. Generate report: `output/YYYY-MM-DD-intel.md`
4. Clean up marker file after completion
5. Alert Ayman via Telegram if high-priority opportunities found

**Why the change:** The old Python script used subprocess calls for every browser action, causing 300s timeouts. Native browser tool is 10x faster (8-12 min vs 300s+).

**Follow-up actions:**
- Flag high-priority opportunities to Ayman (Telegram in morning)
- Update prospect research files with new signals
- Add competitor intel to memory
- Update active-work.md if immediate actions needed

**Status:** ✅ Configured with cookie-based auth (coding@iiotsolutions.sa)  
**Focus:** SME manufacturers in Saudi industrial sector - clients, competitors, partners  
**Rate limits:** Max 50 requests/hour, target 20-25 per run, 24h between runs

## Self-Development (Daily + Weekly)

**Daily (2:30 AM Riyadh time - after LinkedIn intel completes):**
Two action points - both focused on memory:
1. **Development:** Build/improve hot/warm memory solutions, tools, and optimizations
2. **Research:** Study memory management techniques, context optimization, consolidation strategies

Document findings and solutions in daily memory file.

**Model:** Use opus4.5 with thinking mode for self-development
**Scope:** Memory issues ONLY - no other development topics

**Weekly Reviews (Fridays 6 AM Riyadh time):**
Formal weekly reflection:
1. Read `skills/self-development/SKILL.md`
2. Run the weekly self-review
3. Update `memory/capabilities.md` and `memory/goals.md`
4. Write to `memory/weekly-reviews/YYYY-MM-DD.md`

## Off-Hours Self-Improvement (When No Active Tasks)
During quiet hours (late night Riyadh time, weekends), use time productively:

### Research & Learning
- Deepen IIoT/MES/SCADA knowledge
- Research competitors
- Study Saudi industrial market
- Read OpenClaw docs to learn new capabilities

### Build Skills
- Work on context/token management skill
- Create tools that will help the team
- Improve existing skills based on lessons learned

### Organize & Reflect
- Review and consolidate memory files
- Update MEMORY.md with important learnings
- Clean up and improve documentation
- Reflect on recent interactions - what can I do better?

### Proactive Preparation
- Research upcoming client meetings (if known)
- Prepare templates or tools that might be needed
- Think about how to solve recurring problems

**Rule:** Don't message the team during off-hours unless urgent. Work quietly, save progress, be ready for the next day.
