# HubSpot Quick Wins - Implementation Checklist

**Priority workflows to build THIS WEEK for immediate ROI**

---

## 1. Stale Deal Alert 🚨
**Time to build:** 15 minutes  
**Impact:** Save 2-3 deals/month ($150K+ value)

### Steps:
1. Automation > Workflows > Create workflow
2. Choose: Deal-based
3. Enrollment: Deal stage = [any open stage] AND Last modified date > 7 days ago
4. Action: Send email to deal owner
5. If >14 days: Alert Ayman
6. Turn on

### Email template:
```
Subject: Deal Alert: [Deal name] needs attention

Hi [Owner],

This deal hasn't been updated in 7+ days. Please take action today:
- Call the prospect
- Send a follow-up email
- Update the deal status

Deal: [Deal name]
Company: [Company]
Stage: [Deal stage]
Amount: [Amount] SAR
Last activity: [Last modified date]
```

---

## 2. Lead Scoring & Auto-Assignment 🎯
**Time to build:** 30 minutes  
**Impact:** 10x faster response to hot leads

### Steps:
**Part A: Create custom property**
1. Settings > Properties > Create property
2. Name: "Lead Score"
3. Type: Number
4. Object: Contacts
5. Save

**Part B: Create scoring workflow**
1. Create contact-based workflow
2. Enrollment: Contact created
3. If industry = Cement/Food/Gypsum → Add 30 to score
4. If employees = 100-500 → Add 20 to score
5. If title contains "Manager"/"Director"/"CTO" → Add 20 to score
6. Save score to "Lead Score" property

**Part C: Create auto-assignment**
1. Create contact-based workflow
2. Enrollment: Lead score > 70
3. Action: Assign to Firas (or Amr based on territory)
4. Action: Create task "HOT LEAD: Contact within 24h"
5. Turn on

---

## 3. Demo Follow-Up Automation 📧
**Time to build:** 20 minutes  
**Impact:** Zero missed follow-ups, 30% faster proposals

### Steps:
1. Create deal-based workflow
2. Enrollment: Deal stage = "Meeting Done" or "Presentation Scheduled"
3. Delay 1 day
4. Send email: "Thanks for the demo!"
5. Delay 2 days
6. Send email: Case study relevant to their industry
7. Create task: "Send proposal" (due in 3 days)
8. Delay 5 days
9. If stage NOT "Proposal Sent" → Remind owner + alert Ayman

### Email templates:
**Email 1 (Thank you):**
```
Subject: Thanks for joining our demo!

Hi [First name],

Great speaking with you today about [Product]. As discussed, here are the key next steps:

- Demo recording: [Link]
- Product specs: [Attachment]
- Pricing guide: [Attachment]

I'll send over a formal proposal by [Date]. In the meantime, please reach out with any questions.

Best regards,
[Owner name]
```

**Email 2 (Case study):**
```
Subject: See how [Similar Company] achieved 30% efficiency gains

Hi [First name],

I thought you'd find this case study interesting - [Similar Company] in the [industry] sector used our [Product] to:

- Reduce downtime by 25%
- Improve OEE from 65% to 85%
- Cut reporting time from 3 hours to 15 minutes

Full case study attached. Looking forward to discussing your proposal soon!

Best,
[Owner name]
```

---

## 4. Welcome Series for New Contacts 👋
**Time to build:** 25 minutes  
**Impact:** 40% increase in engagement

### Steps:
1. Create contact-based workflow
2. Enrollment: Form submission = any website form
3. Send email: Welcome message (immediately)
4. Delay 3 days
5. Send email: Educational content (blog/whitepaper)
6. Delay 5 days
7. Send email: Case study
8. If opened 2+ emails → Set lifecycle to MQL + notify BD

### Email templates:
**Email 1 (Welcome):**
```
Subject: Welcome to IIoT Solutions

Hi [First name],

Thanks for reaching out! We help industrial manufacturers like [Company] transform their operations with:

✓ Real-time production visibility
✓ Predictive maintenance
✓ Energy optimization
✓ Quality tracking

What to expect next:
- Educational content about digital transformation in [industry]
- Relevant case studies from similar companies
- No spam, just value

Have questions? Just reply to this email.

Best regards,
IIoT Solutions Team
```

**Email 2 (Educational):**
```
Subject: How digital transformation drives 25% cost reduction in [industry]

Hi [First name],

Many [industry] manufacturers we work with face the same challenge: too much manual data collection, not enough actionable insights.

Here's a quick read on how real-time MES systems help:
[Link to blog post or whitepaper]

Key takeaways:
- 25% reduction in operational costs
- 30% improvement in OEE
- 80% faster reporting

Worth 5 minutes of your time!

Best,
IIoT Solutions Team
```

**Email 3 (Case study):**
```
Subject: Case study: How [Company] improved OEE by 18%

Hi [First name],

I wanted to share a success story from one of our clients in the [industry] sector.

[Company name] implemented our MES system and saw:
- 18% OEE improvement in 3 months
- $200K annual energy savings
- Real-time visibility across 3 production lines

Full case study attached.

If you'd like to discuss how this could work for [Their company], I'm happy to arrange a quick call. Just let me know!

Best,
IIoT Solutions Team
```

---

## 5. Win/Loss Notifications 🎉
**Time to build:** 10 minutes  
**Impact:** Team morale + win/loss tracking

### Steps:
1. Create deal-based workflow
2. Enrollment: Deal stage = "Closed Won" OR "Closed Lost"
3. If Closed Won → Email team celebrating
4. If Closed Lost → Email owner to document reason
5. Create task: "Document win/loss reason in notes"

---

## Data Cleanup (Do First!)

**Before building workflows, fix these data issues:**

### 1. Fix invalid lifecycle stages
```
Problem: Contacts with stage IDs like "3757100234"
Fix: Update to "Lead" or appropriate stage
```

### 2. Fix stuck leads
```
Problem: 41 contacts stuck at "ATTEMPTED_TO_CONTACT"
Fix: Move to "UNQUALIFIED" or delete if >30 days old
```

### 3. Fix deal stages
```
Problem: 15 deals labeled "stage_2"
Fix: Map to actual stage name (e.g., "Qualified To Buy")
```

### 4. Standardize company names
```
Problem: "SPCC" vs "Southern Province Cement Company"
Fix: Use full name consistently
```

---

## Custom Properties to Create

**Before lead scoring workflow:**

1. **Lead Score** (Number, 0-100)
2. **Industry Subcategory** (Dropdown: Cement, Food, Gypsum, etc.)
3. **Territory** (Dropdown: Jeddah, Riyadh, Eastern Province)
4. **Lead Source Detail** (Dropdown: LinkedIn, Website, Event, Referral, etc.)
5. **Product Interest** (Dropdown: MES, SCADA, IoT Logix, EnOptix, SIRI)

---

## Success Metrics (Track Weekly)

After workflows are live, monitor:

- [ ] Email open rate (target: 25-35%)
- [ ] Email click rate (target: 5-10%)
- [ ] Lead response time (target: <24h for hot leads)
- [ ] Deals idle >7 days (target: 0)
- [ ] Demo-to-proposal time (target: <5 days)
- [ ] Time saved per BD rep (target: 5+ hours/week)

---

## Week 1 Implementation Schedule

**Monday:**
- Morning: Create custom properties (1 hour)
- Afternoon: Data cleanup (2 hours)

**Tuesday:**
- Morning: Build Workflow #1 (Stale Deal Alert) - 15 min
- Afternoon: Build Workflow #2 (Lead Scoring) - 30 min
- Test both workflows

**Wednesday:**
- Morning: Build Workflow #3 (Demo Follow-up) - 20 min
- Afternoon: Build Workflow #4 (Welcome Series) - 25 min
- Test both workflows

**Thursday:**
- Morning: Build Workflow #5 (Win/Loss) - 10 min
- Afternoon: Monitor all workflows, fix issues

**Friday:**
- Review week 1 results
- Get BD team feedback
- Plan week 2 (advanced workflows)

---

## Need Help?

**Building workflows:**
- Flux can guide step-by-step via Telegram
- HubSpot Academy: https://academy.hubspot.com/courses/workflows
- HubSpot Support: Via chat in HubSpot portal

**Questions about logic:**
- "Which stage should trigger this?"
- "How long should the delay be?"
- "What should the email say?"

→ Just ask Flux! I know your business, your sales process, and your team.

---

**Ready to start? Let's build Workflow #1 (Stale Deal Alert) right now. Takes 15 minutes and could save a deal this week. 🚀**
