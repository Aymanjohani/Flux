# LinkedIn Intelligence - Flux Native Orchestration

**Problem:** The original Python script used subprocess calls for every browser action, causing 300s timeouts.

**Solution:** Flux orchestrates directly using the native browser tool (10x faster).

---

## How It Works

1. **Cron trigger** (2 AM Riyadh time) creates marker file
2. **Flux detects marker** during heartbeat
3. **Flux runs intelligence** using native browser tool
4. **Generate report** and save to `output/YYYY-MM-DD-intel.md`
5. **Alert Ayman** if high-priority opportunities found

---

## Intelligence Gathering Protocol

### Phase 1: Hashtag Monitoring (Top 3 Primary)

For each hashtag in `config/targets.json` → `hashtags.primary_saudi[:3]`:

1. Navigate to search: `https://www.linkedin.com/search/results/content/?keywords=%23{tag}`
2. Scroll 2-3 times to load posts
3. Take snapshot (refs="aria" for stability)
4. Extract posts using aria snapshot
5. Analyze for opportunities (signals: hiring, digital transformation, new projects)

**Rate limiting:** 8-15 second delays between searches

### Phase 2: Company Monitoring (Top 5 Prospects)

For each company in `target_categories.potential_clients.companies[:5]`:

1. Navigate to company page: `https://www.linkedin.com/company/{slug}/posts/`
2. Scroll to load recent posts
3. Take snapshot
4. Extract posts and analyze for buying signals

**Rate limiting:** 10-20 second delays between companies

### Phase 3: Competitor Monitoring (Top 3)

For each competitor in `target_categories.competitors.companies[:3]`:

1. Navigate to company page
2. Extract recent posts
3. Analyze for competitive intelligence (new offerings, client wins, partnerships)

**Rate limiting:** 10-20 second delays

---

## Opportunity Detection Signals

### High Priority
- Mentions of "digital transformation", "Industry 4.0", "IIoT"
- Hiring for: "digitalization", "automation", "MES", "SCADA"
- New factory/facility announcements
- ERP implementation projects mentioned
- Government contract wins (Vision 2030 related)

### Medium Priority
- General manufacturing updates
- Leadership changes
- Partnership announcements
- Conference participation

---

## Report Generation

Save to: `output/YYYY-MM-DD-intel.md`

**Structure:**
1. High Priority Opportunities (with recommended actions)
2. Market Intelligence (hashtag volumes, company activity)
3. Competitor Intelligence
4. Medium Priority Leads
5. Action Items

**Morning alert to Ayman:**
- Send summary via Telegram if 1+ high-priority opportunities
- Keep it brief: "LinkedIn Intel: X high-priority opportunities. Report ready: output/YYYY-MM-DD-intel.md"

---

## Rate Limiting Strategy

- **Max 50 requests per hour** (LinkedIn limit)
- **Target: ~20-25 actions per run** (well within limits)
- **Random human-like delays:** 8-20 seconds between major actions
- **Short delays:** 2-3 seconds between scroll/snapshot

**Total expected runtime:** ~8-12 minutes (well under 300s timeout)

---

## Error Handling

- If login fails → check cookies expiration, alert Ayman
- If rate limited → stop immediately, log, try again tomorrow
- If timeout → reduce number of targets for next run

---

## Implementation

When Flux detects cron trigger marker:
1. Read this file for protocol
2. Load `config/targets.json` for hashtags/companies
3. Use browser tool with profile="openclaw"
4. Follow phases 1-3 above
5. Generate report
6. Clean up marker file
7. Update `memory/active-work.md` with any urgent findings

---

**Status:** Ready to implement (2026-02-04)  
**Expected performance:** 8-12 minutes per run (vs 300s+ timeout with subprocess approach)
