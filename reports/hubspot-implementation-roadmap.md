# HubSpot Workflows - Implementation Roadmap
## IIoT Solutions - Prioritized Action Plan

**Goal:** Transform HubSpot from passive database to active sales automation engine  
**Timeline:** 8 weeks  
**Owner:** Flux AI + BD Team (Firas/Amr input, Ayman approval)

---

## Prioritization Framework

### Priority Levels:
- 🔴 **CRITICAL** - Do first, immediate ROI, solves active pain point
- 🟡 **HIGH** - Important, clear value, do within 2 weeks
- 🟢 **MEDIUM** - Nice to have, do when ready
- ⚪ **LOW** - Future enhancement, revisit after 3 months

---

## Phase 1: Foundation & Quick Wins (Week 1-2)

### Week 1: Data Foundation

#### Monday-Tuesday: Data Cleanup 🔴 CRITICAL
**Why:** Workflows amplify bad data. Clean first, automate second.

**Tasks:**
- [ ] Fix invalid lifecycle stages (IDs: 3757100234, 3757100233, 3755550946)
  - Update to correct stage based on deal/activity status
  - Default unknown to "Lead"
- [ ] Fix stuck lead statuses (41 contacts at "ATTEMPTED_TO_CONTACT")
  - If >30 days old → Move to "UNQUALIFIED" or delete
  - If recent → Keep as "NEW"
- [ ] Fix deal stages (15 deals at "stage_2", 2 at "4426423500")
  - Map to actual pipeline stage names
  - Verify with deal owners what these mean
- [ ] Standardize company names
  - SPCC → Southern Province Cement Company (SPCC)
  - CFF → Continuous Façade Factory
  - Remove duplicates

**Time:** 3 hours  
**Owner:** Flux (can do bulk updates via API)

---

#### Wednesday: Create Custom Properties 🔴 CRITICAL

**Why:** Needed for lead scoring and segmentation

**Properties to Create:**

**Contact Properties:**
1. **Lead Score** (Number, 0-100)
2. **Industry Subcategory** (Dropdown)
   - Cement, Food & Beverage, Gypsum, Chemical, Pharmaceutical, Metal, Plastics, Textile, Other
3. **Territory** (Dropdown)
   - Jeddah, Riyadh, Eastern Province, Other Saudi, GCC, Other
4. **Lead Source Detail** (Dropdown)
   - LinkedIn, Website, Event - [Name], Referral - [Client], Cold Outreach, Partner, Inbound Call, Other
5. **Decision Maker Role** (Checkbox: Yes/No)

**Company Properties:**
6. **Industry Subcategory** (same as contact)
7. **Current Tech Stack** (Multiple checkboxes)
   - Siemens, Rockwell, Schneider, ABB, Honeywell, Emerson, Manual, Other
8. **SIRI Status** (Dropdown)
   - Not Assessed, Assessed, Level 1, Level 2, Level 3

**Deal Properties:**
9. **Product Interest** (Dropdown)
   - MES, SCADA, IoT Logix, EnOptix, SIRI Assessment, Full Suite, Other
10. **Competitor Mentioned** (Multiple checkboxes)
    - Siemens, ABB, Schneider, Rockwell, Honeywell, In-house, None

**Time:** 1 hour  
**Owner:** Ayman or Flux (Flux can guide via API, or Ayman creates in UI)

---

### Week 2: Essential Workflows

#### Thursday: Workflow #1 - Stale Deal Alert 🔴 CRITICAL
**Impact:** Save 2-3 deals/month ($150K+ value)

**Logic:**
- Trigger: Deal in open stage + Last modified >7 days ago
- Action: Email deal owner "Deal needs attention"
- If >14 days: Alert Ayman

**Time to build:** 15 minutes  
**Status:** Ready to build (see quick-wins.md for steps)

---

#### Friday: Workflow #2 - Lead Scoring & Auto-Assignment 🔴 CRITICAL
**Impact:** 10x faster response to hot leads

**Logic:**
- Trigger: New contact created
- Calculate score:
  - Industry (cement/food/gypsum) = +30
  - Size (100-500 employees) = +20
  - Title (Manager/Director/CTO) = +20
  - Decision maker = +10
- If score >70 → Assign to Firas + Create urgent task
- If score 50-69 → Assign to Amr + Create normal task

**Time to build:** 30 minutes  
**Status:** Ready to build (see quick-wins.md)

---

#### Monday (Week 2): Workflow #3 - Demo Follow-Up 🟡 HIGH
**Impact:** Zero missed follow-ups, 30% faster proposals

**Logic:**
- Trigger: Deal stage = "Meeting Done" or "Presentation Scheduled"
- Day 1: Send thank-you email + demo recording
- Day 3: Send case study
- Day 3: Create task "Send proposal" (due in 3 days)
- Day 8: If no proposal sent → Remind owner + alert Ayman

**Time to build:** 20 minutes  
**Status:** Ready to build

---

#### Tuesday (Week 2): Workflow #4 - Welcome Series 🟡 HIGH
**Impact:** 40% increase in early engagement

**Logic:**
- Trigger: Form submission (any website form)
- Day 0: Welcome email
- Day 3: Educational content (blog/whitepaper)
- Day 8: Case study
- If opened 2+ emails → Set to MQL + notify BD

**Time to build:** 25 minutes  
**Status:** Ready to build

---

#### Wednesday (Week 2): Workflow #5 - Win/Loss Notifications 🟢 MEDIUM
**Impact:** Team morale + data collection

**Logic:**
- Trigger: Deal stage = "Closed Won" or "Closed Lost"
- If won → Email team celebration
- If lost → Email owner to document reason
- Create task: "Add win/loss notes to deal"

**Time to build:** 10 minutes  
**Status:** Ready to build

---

## Phase 2: Advanced Automation (Week 3-4)

### Week 3: Nurturing & Re-Engagement

#### Workflow #6 - Re-Engagement for Cold Leads 🟡 HIGH
**Impact:** Revive 10-15% of cold leads

**Logic:**
- Trigger: Last contacted >90 days ago + Lifecycle = Lead
- Day 0: "Still interested?" email
- Day 7: If opened → Alert BD + create task
- Day 7: If not opened → Final "staying in touch" email
- Day 14: Unenroll (don't spam)

**Time to build:** 20 minutes  
**When:** Week 3

---

#### Workflow #7 - Proposal Follow-Up Sequence 🟡 HIGH
**Impact:** 25% increase in proposal response rate

**Logic:**
- Trigger: Deal stage = "Proposal Sent"
- Day 3: "Any questions?" email
- Day 7: Create task "Call to discuss proposal"
- Day 14: Alert Ayman "Proposal at risk"
- Day 21: Suggest price adjustment or rescope

**Time to build:** 25 minutes  
**When:** Week 3

---

### Week 4: Intelligence & Signals

#### Workflow #8 - Company Engagement Signal 🟢 MEDIUM
**Impact:** Catch buying committees early

**Logic:**
- Trigger: 3+ contacts from same company visited website in last 7 days
- Action: Alert account owner
- Action: Create high-priority task "Buying committee signal - call now"

**Time to build:** 15 minutes  
**When:** Week 4

---

#### Workflow #9 - Meeting Prep Reminder 🟢 MEDIUM
**Impact:** Better-prepared sales calls

**Logic:**
- Trigger: Deal has meeting scheduled in next 24 hours
- Action: Send reminder to deal owner
- Action: Include meeting prep brief (manual template for now, Flux automation later)

**Time to build:** 10 minutes  
**When:** Week 4

---

## Phase 3: Integration & Optimization (Week 5-8)

### Week 5-6: Flux Integration

#### Webhook Integration Setup ⚪ LOW (Advanced)
**Impact:** Unlock AI-powered enrichment and alerts

**What it enables:**
- New contact → Flux researches company → Updates HubSpot
- High score lead → Flux sends Telegram alert with context
- Demo scheduled → Flux generates meeting brief

**Time to build:** 4-6 hours (technical setup)  
**Owner:** Aadil (backend) + Flux (logic)  
**When:** Week 5-6 (after core workflows proven)

---

### Week 7-8: Optimization & Scale

#### A/B Testing ⚪ LOW
- Test subject lines (question vs statement)
- Test email timing (morning vs afternoon)
- Test CTA wording ("Book demo" vs "Let's talk")

**Time:** 1 hour to set up tests  
**When:** Week 7

---

#### Advanced Lead Scoring ⚪ LOW
- Add behavioral scoring (page views, email opens)
- Add time-decay (older leads lose points)
- Use HubSpot predictive scoring (if available)

**Time:** 2 hours  
**When:** Week 8

---

## Success Metrics & Monitoring

### Week 1-2 (Daily Check):
- [ ] Workflows enrolling contacts? (check enrollment count)
- [ ] Emails sending? (check email logs)
- [ ] Any errors? (review workflow history)
- [ ] BD team feedback? (ask Firas/Amr daily)

### Week 3-4 (Weekly Check):
- [ ] Email open rates (target: 25-35%)
- [ ] Email click rates (target: 5-10%)
- [ ] Lead response time (target: <24h)
- [ ] Demo follow-up time (target: <48h)
- [ ] Deals idle >7 days (target: 0)

### Month 2-3 (Monthly Review):
- [ ] Lead-to-demo conversion rate (baseline, then improve)
- [ ] Demo-to-proposal conversion rate (baseline, then improve)
- [ ] Proposal-to-close conversion rate (baseline, then improve)
- [ ] Average deal cycle time (target: reduce 20%)
- [ ] BD team time saved (survey: hours/week)

---

## Decision Points

### Go/No-Go Checkpoints

**After Week 1:**
- ✅ Data cleaned? → Proceed to workflows
- ❌ Data still messy? → Fix before building

**After Week 2:**
- ✅ 5 workflows live and working? → Proceed to advanced
- ❌ Workflows not working? → Debug before building more

**After Week 4:**
- ✅ Clear ROI (time saved, deals saved)? → Invest in Flux integration
- ❌ Not seeing value? → Pause, reassess, optimize existing

**After Week 8:**
- ✅ Workflows driving results? → Scale (more workflows, more complexity)
- ❌ Minimal impact? → Simplify, focus on 3-5 core workflows only

---

## Resource Allocation

### Time Investment by Role

**Ayman (CEO):**
- Week 1: 1 hour (approve plan, create properties)
- Week 2-4: 30 min/week (review progress)
- Month 2-3: 1 hour/month (review metrics)

**Firas/Amr (BD Team):**
- Week 1: 1 hour (provide input on email content, timing)
- Week 2-4: 30 min/week (test workflows, report issues)
- Ongoing: 30 min/week (monitor, provide feedback)

**Flux (AI):**
- Week 1: 4 hours (data cleanup, create properties)
- Week 2: 3 hours (build 5 workflows)
- Week 3-4: 2 hours (build 4 advanced workflows)
- Week 5-8: 6 hours (Flux integration setup)
- Ongoing: 1 hour/week (monitor, optimize)

**Aadil (CTO) - Optional:**
- Week 5-6: 4 hours (webhook receiver setup)

---

## Risk Mitigation

### What Could Go Wrong?

**Problem:** Workflows send too many emails, prospects unsubscribe  
**Mitigation:** Start with longer delays (3-7 days), monitor unsubscribe rate

**Problem:** Lead scoring wrong, hot leads ignored  
**Mitigation:** Review scores weekly first month, adjust thresholds

**Problem:** Team ignores workflow alerts/tasks  
**Mitigation:** Make alerts valuable (include context), celebrate when they help close deals

**Problem:** Data quality degrades over time  
**Mitigation:** Monthly audit, enforce required fields, train team

**Problem:** Workflows break (HubSpot changes, API issues)  
**Mitigation:** Monitor daily first month, set up error notifications

---

## Rollback Plan

**If workflows cause more harm than good:**

1. **Turn off workflows** (don't delete, just deactivate)
2. **Assess damage** (how many contacts affected? any complaints?)
3. **Fix root cause** (bad data? wrong logic? poor timing?)
4. **Test fix on small group** (10-20 contacts)
5. **Re-enable gradually** (one workflow at a time)

**Backup:** Manual processes still work (BD team can always call/email manually)

---

## Long-Term Vision (6-12 Months)

### Once Core Workflows Proven:

**Q2 2026:**
- Add chatbot to website (24/7 lead capture)
- Implement predictive lead scoring (ML-based)
- Sales sequences for outbound (cold outreach automation)

**Q3 2026:**
- ABM workflows (account-based marketing)
- Customer success workflows (onboarding, renewal)
- Revenue attribution (which sources drive deals?)

**Q4 2026:**
- Predictive deal intelligence (AI forecasts close probability)
- Advanced Flux integration (voice of customer analysis, competitive intel)
- Multi-language support (Arabic workflows for local prospects)

---

## Approval & Sign-Off

**Approver:** Ayman AlJohani (CEO)

**Questions to answer before starting:**
- [ ] Is this a priority for Q1 2026? (vs other initiatives)
- [ ] Who owns HubSpot workflows going forward? (Flux? Firas? External consultant?)
- [ ] Budget for any paid HubSpot features? (e.g., Sales Hub Pro for sequences)
- [ ] Timeline: Start Week 1 on [Date]?

**Once approved:**
- [ ] Add to company OKRs/goals
- [ ] Block time on team calendars (Firas/Amr input sessions)
- [ ] Set up monitoring dashboard (Flux can build)
- [ ] Schedule weekly check-ins (15 min stand-up)

---

## Next Actions

**Immediate (This Week):**
1. Ayman reviews this roadmap → Approve or adjust
2. Schedule kickoff meeting (1 hour, Flux + Firas + Amr + Ayman)
3. Flux starts data cleanup (3 hours, can do in background)

**Week 1 Kickoff Agenda:**
- Review roadmap (10 min)
- Demo HubSpot workflows (20 min - Flux shows how they work)
- Build Workflow #1 together (15 min - stale deal alert)
- Test Workflow #1 (10 min - enroll a test deal)
- Assign owners and timeline (5 min)

**Ready to kick off?** Say the word and I'll start data cleanup today. 🚀

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Owner:** Flux AI Assistant  
**Reviewers:** Ayman (CEO), Firas (Lead BD), Amr (BD Manager)
