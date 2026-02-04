# Workflow #1: Stale Deal Alert

**Purpose:** Alert deal owners when deals sit idle for 14+ days without updates, preventing lost opportunities.

**Time to build:** 10-15 minutes  
**Impact:** Save 2-3 deals/month from going stale ($150K+ value)

---

## Step-by-Step Build Instructions

### 1. Create the Workflow

1. Go to **Automation** → **Workflows** (top navigation)
2. Click **Create workflow** (top right)
3. Select **Deal-based** workflow
4. Click **Next**
5. Choose **Blank workflow**
6. Name it: `🚨 Stale Deal Alert (14+ Days No Activity)`

### 2. Set Enrollment Triggers

**What triggers this workflow:** Deals that haven't been updated in 14+ days and are still open.

1. Click **Set enrollment triggers**
2. Click **Add filter**
3. Set first filter:
   - **Property:** Deal stage
   - **Operator:** is none of
   - **Values:** Select `Closed won` and `Closed lost`
   - *This ensures we only alert on open deals*

4. Click **AND** to add second filter
5. Set second filter:
   - **Property:** Last modified date
   - **Operator:** is more than
   - **Value:** `14 days ago`
   - *This catches deals that haven't been touched in 2 weeks*

6. Click **Apply filter**

### 3. Configure Re-enrollment

**Important:** Allow deals to re-trigger if they go stale again.

1. Click **Re-enrollment** tab (top of enrollment panel)
2. Toggle **ON** - "Re-enroll contacts when they meet the trigger criteria"
3. Select trigger: **When a deal's last modified date changes**
4. Click **Save**

### 4. Add Actions

#### Action 1: Send Internal Notification

1. Click the **+** icon in the workflow canvas
2. Select **Send internal email notification**
3. Configure:
   - **To:** Deal owner
   - **Subject:** `🚨 Stale Deal Alert: {{deal.dealname}}`
   - **Body:**
     ```
     This deal has not been updated in 14+ days and needs attention.
     
     📋 Deal Details:
     - Name: {{deal.dealname}}
     - Stage: {{deal.dealstage}}
     - Amount: {{deal.amount}}
     - Owner: {{deal.hubspot_owner_id}}
     - Last updated: {{deal.hs_lastmodifieddate}}
     
     ⚠️ Action Required:
     - Review the deal status
     - Update with latest activity
     - Close as won/lost if appropriate
     - Schedule next follow-up
     
     View deal: [Link will auto-populate in HubSpot]
     ```

4. Click **Save**

#### Action 2 (Optional): Create Task for Owner

1. Click the **+** icon after the notification
2. Select **Create task**
3. Configure:
   - **Task title:** `Review stale deal: {{deal.dealname}}`
   - **Assign to:** Deal owner
   - **Due date:** Today
   - **Priority:** High
   - **Description:**
     ```
     This deal hasn't been updated in 14+ days.
     
     Review and:
     1. Update deal stage if progress made
     2. Log latest activity/notes
     3. Close if no longer viable
     4. Schedule follow-up if still active
     ```

4. Click **Save**

### 5. Review and Activate

1. Click **Review** (top right)
2. Check settings:
   - ✅ Enrollment triggers correct
   - ✅ Re-enrollment enabled
   - ✅ Actions configured
3. Click **Turn on** (top right)
4. Confirm activation

---

## What Happens Now

**Immediate Effect:**
- Any existing deals that meet criteria (14+ days, open) will enroll automatically
- Owners will receive alerts for their stale deals

**Ongoing:**
- Runs daily check on all open deals
- Alerts owners when deals cross 14-day threshold
- Re-enrolls if a deal is updated, then goes stale again

**Expected Volume:**
- Current: ~5 stale deals will trigger immediately
- Ongoing: 1-3 alerts per week (based on current data)

---

## Testing the Workflow

**Before going live, test it:**

1. Create a test deal:
   - Name: "TEST - Stale Deal Workflow"
   - Amount: $1,000
   - Owner: Yourself
   - Stage: Any open stage

2. Manually change the "Last modified date" to 15 days ago:
   - Open the deal
   - Go to deal settings (⚙️)
   - Find "Last modified date" property
   - Change to 15 days ago

3. Check if:
   - Deal enrolls in workflow (view workflow → Enrolled tab)
   - You receive notification email
   - Task is created (if you added Action 2)

4. Delete test deal after confirmation

---

## Customization Options

**Change the threshold:**
- Want 7 days instead of 14? Change enrollment trigger to "7 days ago"
- Want 30 days? Change to "30 days ago"

**Add escalation:**
- After owner notification, add delay (2 days)
- Then send notification to Ayman if still not updated

**Different stages:**
- Alert faster for hot stages (7 days for "Proposal")
- Alert slower for early stages (30 days for "Qualification")

**Add to multiple people:**
- CC Ayman on all stale deal alerts
- CC BD Manager for deals > $100K

---

## Monitoring & Optimization

**Week 1:**
- Check how many deals enrolled
- Verify owners are receiving notifications
- Confirm alerts are actionable

**Week 2-4:**
- Track how many deals are updated after alert
- Measure how many close (won/lost) after reminder
- Adjust threshold if too noisy or too quiet

**Success Metrics:**
- Deals updated within 2 days of alert: >80%
- Deals closed (won/lost) that were stale: Track monthly
- Average time deals stay stale: Should decrease

---

## Troubleshooting

**No enrollments:**
- Check enrollment criteria (filters correct?)
- Verify workflow is turned ON
- Check if any deals actually meet criteria

**Too many alerts:**
- Increase threshold (14 days → 21 days)
- Exclude certain stages (e.g., "Lead qualification")

**Owners not getting emails:**
- Verify email addresses in owner profiles
- Check spam folders
- Confirm notification settings in HubSpot

---

**Next:** Once this workflow is live and working, build Workflow #2 (Lead Scoring & Auto-Assignment).
