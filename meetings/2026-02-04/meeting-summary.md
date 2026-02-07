# Team Meeting Summary - February 4, 2026

**Date:** February 4, 2026 (07:06 - 08:10 UTC)  
**Duration:** ~70 minutes  
**Attendees:** Ayman (CEO), Adil (CTO), Hamad (Head of Digital Solutions)

---

## 🎯 Key Decisions

### 1. **Voltonic Resource Strategy - REJECTED Current Terms**

**Problem:**
- Voltonic quoted 8.5K SAR/month per engineer
- IIoT Solutions would pay ALL expenses (housing, visa, travel, food)
- Total cost: ~20K/month for one engineer
- For 3 months (Balhamar): 60K total
- Makes no financial sense vs. hiring directly

**Decision:**
- **Reject current model** - Too expensive
- **Counter-offer:** 8.5K is acceptable ONLY if Voltonic covers everything (housing, visa, travel, insurance)
- **Alternative priority:** Find local Saudi manpower or direct hire

**Action Items:**
| Owner | Task | Deadline |
|-------|------|----------|
| Hamad | Email Voltonic with counter-offer (cover all expenses or no deal) | This week |
| Hamad | Send "Automation Engineer" job description/requirements to Ayman | ASAP |
| Ayman + Mreefah | Search for local Saudi manpower supply companies (Jeddah/Dammam) | This week |
| All | Explore direct hiring (10-15K SAR/month range) | Ongoing |

---

### 2. **Pricing Strategy Overhaul - Module-Based Pricing**

**Root Cause Analysis (Print-to-Pack Loss):**
- **Lost deal:** IIoT bid 440K vs Target Reach 360K
- **Client need:** Only wanted OEE/Monitoring
- **Our proposal:** Full MES suite (Manufacturing Execution + OEE + Planning + Scheduling + Reports)
- **Mistake:** "Double-dipping" - Software cost scales with machines + Implementation scales with machines

**Current Pricing Issues:**
1. License cost tied to machine count
2. Implementation cost tied to machine count
3. Result: Price inflates unnecessarily for small projects
4. Example: 5 machines = 440K, but client only needs monitoring

**New Strategy:**
- **Module-based pricing** (sell OEE separately from Planning, Scheduling, etc.)
- **Match client requirements exactly** - Don't upsell full MES when they want monitoring
- **Separate license from implementation** costs clearly

**Example Module Pricing (draft):**
- OEE module alone: ~50-100K (vs 150K for full suite)
- Result: Would have won Print-to-Pack at competitive price

**Action Items:**
| Owner | Task | Deadline |
|-------|------|----------|
| Adil + Hamad + Amr | Meet to finalize module-based pricing structure | Today (Feb 4) |
| Adil + Hamad | Review/approve new pricing model | Tomorrow (Feb 5) |
| Hamad | Use standardized evaluation form for all new projects | Immediately |

---

### 3. **Print-to-Pack Post-Mortem - Lessons Learned**

**What Went Wrong:**
1. **Scope creep in proposal** - Client asked for monitoring only, we proposed full infrastructure
2. **No technical discussion** - Sent proposal, never sat with client to explain
3. **Price not justified** - 440K vs 360K with no clear differentiation
4. **Inconsistent proposal** - Different machine counts, pricing errors

**Client's Actual Need:**
- 5 machines
- OEE monitoring (Availability + Performance)
- No ERP integration
- No quality tracking
- Simple monitoring dashboard

**Our Proposal:**
- Full MES suite
- ERP integration architecture
- Manufacturing execution
- Planning & scheduling
- 5x the features they wanted

**New Process (Mandatory):**
1. Use Hamad's standardized evaluation form (already created, sent 2 days ago)
2. Proposal must match client requirements exactly
3. Schedule technical review meeting after sending proposal
4. Explain pricing structure and justify differences vs competitors
5. Be flexible - offer "monitoring only" if that's what they want

**Quote from Meeting:**
> "You need to tell the guys who evaluate a project: take their need exactly as-is and build the proposal based on their need. Maybe in the meeting we can discuss improvements, but don't give them a ridiculously high-price proposal because you're assuming your infrastructure is best for them." - Ayman

---

### 4. **Balhamar Project Timeline - URGENT**

**Status:**
- Hardware/network ready: **February 18** (14 days from meeting)
- Client will push for immediate start after readiness
- Cannot delay through Ramadan

**Why Urgent:**
- POC completion triggers **50% down payment (~400K SAR)**
- **Critical for cash flow**
- 3 machines, 20-30 signals per machine

**Technical Scope:**
- Brownfield implementation (existing machines in production)
- PLC connections, HMI programming, Flexi programming
- Requires experienced engineer (not entry-level)
- Downtime will be limited - must work around production schedule

**Ramadan Strategy:**
- Must execute during Ramadan if hardware ready
- No luxury to wait
- Resource availability critical

---

### 5. **Resource Requirements - Automation Engineer**

**Critical Skills Needed:**
- **Brownfield experience** (retrofitting existing machines, not greenfield)
- PLC programming (multiple brands - not just one)
- HMI programming
- Flexi programming
- Circuit diagram reading
- Production environment experience (working with downtime constraints)

**Location:**
- Based in Dammam or Jeddah (not Riyadh)
- Must have car for site mobility
- Prefer Saudi-based to avoid visa/housing costs

**Salary Range:**
- Target: 10-15K SAR/month for Saudi-based
- One candidate mentioned: 15K (but currently employed)
- Compared to 20K/month for Voltonic model

---

### 6. **Project Management - Todoist Enforcement**

**Problem:**
- Multiple projects (Kiswah, Doha, Balhamar, EBC, new leads)
- Everyone in separate "bubbles"
- No unified task tracking
- Lack of visibility

**Decision:**
- **Mandatory Todoist adoption** for ALL projects
- Ayman will issue **warnings** for non-compliance
- Every task must have deadline
- Structure already sent by Adil

**Quote:**
> "Everyone who does not communicate through email and Todoist, I will issue warnings. We cannot continue working with this chaos." - Ayman

---

### 7. **Upcoming Projects & Priorities**

**Active Projects:**
1. **Balhamar** (POC) - Starts Feb 18
2. **EBC** (SCADA system) - Follows Balhamar
3. **Kiswah** - Ongoing
4. **Doha** - Ongoing

**New Opportunities:**
1. E1 company (potential)
2. Two visits scheduled (Intake today)
3. Monday factory visit (Amr leading)

**Sales Pipeline:**
- 3 customers need proposals next week
- Using new module-based pricing
- Using standardized evaluation form

---

## 📋 Summary of All Action Items

### Immediate (This Week)
- [ ] **Hamad:** Email Voltonic counter-offer
- [ ] **Hamad:** Send automation engineer job description to Ayman
- [ ] **Ayman/Mreefah:** Research local Saudi manpower companies
- [ ] **Adil/Hamad/Amr:** Meet today to finalize module pricing
- [ ] **All:** Mandatory Todoist adoption starting now

### Short-term (Next 2 Weeks)
- [ ] **Adil/Hamad:** Approve final module-based pricing (Feb 5)
- [ ] Secure automation engineer before Feb 18
- [ ] Prepare for Balhamar start (hardware ready Feb 18)
- [ ] 3 new proposals using new pricing model

### Strategic
- [ ] Enforce standardized evaluation process for all new projects
- [ ] Build library of module-based pricing options
- [ ] Direct hire vs. subcontractor decision for long-term

---

## 💡 Key Insights & Lessons

1. **Pricing Philosophy:** "We're not in a position to tell clients we'll only do it 'the right way.' Match their needs first, upsell later."

2. **Sales Process:** "Once we send the proposal, if there's not good sentiment, we sit with them and discuss technically. We never did this with Print-to-Pack."

3. **Resource Economics:** "Why bring someone from Pakistan at 20K/month when we can hire locally for 10-15K with no visa/housing costs?"

4. **Cash Flow Priority:** "POC is 50% down payment. It's in our best interest to finish tomorrow if possible."

5. **Project Management:** "Before we had one project, everyone in same place. Now we have 4+ projects - we MUST use Todoist."

---

## 📊 Financial Impact

| Item | Amount | Impact |
|------|--------|--------|
| Voltonic model (rejected) | 20K/month | Would drain margins |
| Local hire target | 10-15K/month | 25-50% cost savings |
| Balhamar POC completion | 400K payment | Critical cash flow |
| Print-to-Pack loss | 440K project | Could have won at 330K |

---

**Next Meeting:** Saturday (pricing review) or post-APC meeting  
**Recording & Transcript:** Saved to `meetings/2026-02-04/`
