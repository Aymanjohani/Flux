# LinkedIn Intelligence Runner - Native Implementation

This file contains the step-by-step process for Flux to run LinkedIn intelligence gathering using native browser tool.

## Pre-flight Check

```bash
# 1. Check if triggered
ls -la skills/linkedin-intel/output/.cron-trigger-* 2>/dev/null

# 2. Load configuration
cat skills/linkedin-intel/config/targets.json

# 3. Verify last run (avoid duplicate runs same day)
ls -la skills/linkedin-intel/output/*-intel.md | tail -1
```

## Execution Steps

### Setup (Use browser tool directly)

```
Action: browser
- action: start
- profile: openclaw
- target: host

Then:
- action: open  
- profile: openclaw
- targetUrl: https://www.linkedin.com/feed/
```

### Cookie Authentication

```
Action: browser
- action: screenshot (to verify login state)
- profile: openclaw

If not logged in:
- Read skills/linkedin-intel/config/cookies.json
- Inject cookies via browser act → evaluate → document.cookie
- Refresh page
- Verify login state
```

### Phase 1: Hashtag Monitoring

For each hashtag (limit 3):

```
1. Navigate:
   - action: navigate
   - targetUrl: https://www.linkedin.com/search/results/content/?keywords=%23{hashtag}

2. Wait 2-3 seconds (rate limiting)

3. Scroll to load posts:
   - action: act
   - request: {"kind": "evaluate", "fn": "window.scrollBy(0, 800)"}
   - Repeat 2-3 times with 1s delay between

4. Take snapshot:
   - action: snapshot
   - refs: aria
   - maxChars: 50000

5. Extract posts from snapshot.content
   - Look for post containers
   - Extract: author, company, content preview, timestamp, URL
   
6. Analyze for opportunity signals:
   - Keywords: "digital transformation", "Industry 4.0", "hiring", "automation"
   - Context: Saudi manufacturing, IIoT-related
   
7. Random delay 8-15 seconds before next hashtag
```

### Phase 2: Company Monitoring

For each target company (limit 5):

```
1. Convert company name to LinkedIn slug
   - Example: "Saudi Aramco" → "saudi-aramco"
   - Lowercase, spaces to hyphens, remove special chars

2. Navigate:
   - targetUrl: https://www.linkedin.com/company/{slug}/posts/

3. Scroll 2-3 times to load posts

4. Snapshot and extract

5. Analyze for buying signals:
   - New projects
   - Technology mentions
   - Hiring for digital roles
   - Partnership announcements

6. Delay 10-20 seconds before next company
```

### Phase 3: Competitor Monitoring

For each competitor (limit 3):

```
Similar to Phase 2, but focus on:
- New service offerings
- Client wins (if public)
- Marketing messaging changes
- Partnership announcements
```

## Report Generation

### Structure

```markdown
# LinkedIn Intelligence Report — YYYY-MM-DD

**Focus:** SME manufacturers in Saudi industrial sector
**Runtime:** {X minutes}

---

## 🎯 High Priority Opportunities

{For each high-priority find:}

### {Company Name} - {Signal Type}

**Source:** [{hashtag/company}]({url})
**Author:** {person name} ({title})
**Signal:** {What they said/posted}
**Why it matters:** {Context for IIoT Solutions}
**Recommended Action:** {Specific next step}

---

## 📊 Market Intelligence

### Hashtag Activity
- **#saudiarabia**: X posts (theme: ...)
- **#industry40**: X posts (theme: ...)

### Company Activity
- **Company A**: X posts, topics: [digital transformation, hiring]
- **Company B**: X posts, topics: [new facility, automation]

---

## ⚔️ Competitor Intelligence

{Competitor insights}

---

## 📈 Medium Priority Leads

{Brief list}

---

## 💡 Action Items

1. Research {Company X} - {reason}
2. Monitor {Company Y} - {reason}

---

_Generated: {timestamp}_
_Next run: Tomorrow, 2 AM Riyadh time_
```

### Save Report

```
Write to: skills/linkedin-intel/output/YYYY-MM-DD-intel.md
```

## Post-Execution

```
1. Clean up marker file:
   rm skills/linkedin-intel/output/.cron-trigger-*

2. Update active-work.md if urgent findings

3. Send Telegram alert if high-priority opportunities:
   "🔍 LinkedIn Intel: {N} high-priority opportunities detected. 
   Report: skills/linkedin-intel/output/YYYY-MM-DD-intel.md"
   
4. Close browser if no longer needed:
   - action: close
   - profile: openclaw
```

## Rate Limiting Safety

**Critical rules:**
- Max 25 actions per run (well under 50/hour limit)
- Human-like delays (8-20s between major actions)
- If we hit rate limit → stop immediately, log error
- Don't run more than once per 24 hours

## Error Recovery

**Login failure:**
- Alert: "LinkedIn cookies expired. Need manual cookie refresh."
- Instructions in skills/linkedin-intel/SKILL.md

**Rate limit hit:**
- Stop immediately
- Log: "Rate limited. Skipping today's run."
- Don't retry (wait 24h)

**Timeout/Error:**
- Save partial results if any
- Log error details
- Continue with next scheduled run

---

**Performance target:** 8-12 minutes (vs 300s+ with subprocess approach)

**Expected improvement:** 
- No subprocess overhead
- Native tool access
- Better error handling
- Faster snapshots
- Cleaner extraction
