# Todoist Team Usage Guide
**IIoT Solutions**  
**Version:** 1.0 (Draft)  
**Last Updated:** 2026-02-03  
**Prepared by:** Flux

---

## Why Todoist?

**Problem we're solving:**
- Tasks get lost in chat messages and emails
- No clear ownership → "someone will do it" = no one does it
- Deadlines slip because nothing has due dates
- Can't see team workload or project status at a glance
- Client deliverables get forgotten

**What Todoist gives us:**
- ✅ Single source of truth for all tasks
- ✅ Clear ownership and deadlines
- ✅ Project-level visibility
- ✅ Mobile access (manage tasks anywhere)
- ✅ Integrations (email, Slack, calendar)

**Goal:** Every task that needs to be done is in Todoist with an owner and a due date.

---

## Core Principles

### 1. **If it's not in Todoist, it doesn't exist**
- Verbal agreements → Create task
- Email requests → Create task
- Meeting action items → Create task
- "I'll do that" → Create task

### 2. **Every task needs 3 things:**
- **What:** Clear, actionable description
- **Who:** Assigned owner
- **When:** Due date (or "Someday" label for backlog)

### 3. **Due dates are commitments**
- If you assign a due date, you're committing to deliver
- Can't make it? Update the due date NOW, don't let it go overdue
- Overdue tasks = broken commitments

### 4. **Review weekly**
- Every Monday: Review your tasks
- Update due dates
- Close completed tasks
- Add new tasks from the week ahead

---

## Project Structure

### **Level 1: Categories (Main folders)**

```
📁 CLIENT DELIVERY
📁 BUSINESS DEVELOPMENT  
📁 GOVERNMENT & PARTNERSHIPS
📁 PRODUCT DEVELOPMENT
📁 INTERNAL OPERATIONS
📁 PERSONAL (individual folders)
```

### **Level 2: Projects (Under each category)**

**Naming Convention:**
```
[Client/Initiative Name] | [Project Type] | [Optional: Program]
```

**Examples:**
- ✅ `Addoha | Track & Trace | ITMAM`
- ✅ `Kiswa | Quality Vision | ITMAM`
- ✅ `EPC | MES Implementation`
- ✅ `SIRI Platform | Internal Development`
- ❌ `Smart Line IIoT SSF` (unclear, no separators)

**Project Description:**
Every project should have a description with:
- Brief overview (1-2 sentences)
- Key stakeholders
- Expected timeline
- Link to project folder/documentation

**Example:**
```
Track-and-trace system for Addoha Poultry production line.
Stakeholders: Ayman (PM), Aadil (Tech Lead), Client: Ahmed Al-Rashid
Timeline: Jan 15 - Mar 30, 2026
Docs: [Google Drive Link]
```

---

## Task Naming Standards

### **Format: [Verb] [Object] [Context]**

**Good Examples:**
- ✅ `Review Addoha requirements document`
- ✅ `Install printers in production area (Zone A)`
- ✅ `Send KAUST proposal (v2 with pricing)`
- ✅ `Fix AMR navigation accuracy (target: ±5cm)`
- ✅ `Schedule site visit with SIDCO team`

**Bad Examples:**
- ❌ `APIs` (What about APIs?)
- ❌ `Salem` (Who? What action?)
- ❌ `Technical Info` (Get? Send? Review?)
- ❌ `Update stuff` (What stuff?)

### **Task Naming Rules:**

1. **Start with an action verb:**
   - Create, Review, Send, Install, Test, Document, Schedule, Follow up, Call, Email

2. **Be specific:**
   - Not: "Fix bug"
   - Yes: "Fix AMR navigation drift in Zone C"

3. **Include context in parentheses if needed:**
   - `Call KAUST procurement (follow up on Jan 15 meeting)`
   - `Update company profile (add new services page)`

4. **Use prefixes for types:**
   - `[URGENT]` - Needs attention today
   - `[BLOCKED]` - Waiting on someone else
   - `[RECURRING]` - Repeating task

---

## Task Descriptions

Every task should have a description with:

### **Minimum (for simple tasks):**
```
Why: Brief reason this matters
Done when: Clear completion criteria
```

### **Standard (for most tasks):**
```
Why: [Why this task matters]
Done when: [How we know it's complete]
Resources: [Links to docs, files, tools]
Notes: [Any additional context]
```

### **Complex tasks:**
```
Why: [Business value / reason]
Done when: [Acceptance criteria - checkboxes]
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Criterion 3
Dependencies: [Tasks that must finish first]
Resources: [Links, files, documentation]
Owner: [Primary person + backup]
Notes: [Context, decisions, history]
```

**Example:**

**Task:** `Integrate track-and-trace with SAP ERP`

**Description:**
```
Why: Enables automatic batch number generation and inventory updates

Done when:
  - [ ] REST API endpoint created and tested
  - [ ] SAP credentials configured securely
  - [ ] Test batch generated successfully
  - [ ] Client approval on test run

Dependencies: 
  - "Setup network" must be complete
  - SAP credentials from client IT team

Resources:
  - SAP API docs: [link]
  - Integration spec: [Google Drive link]
  - Test environment: http://test.addoha.local

Owner: Ahmad (dev) + Aadil (technical review)

Notes: Client IT team available Mon-Wed only. Need VPN access to test environment.
```

---

## Due Dates

### **Rule: Client-facing tasks MUST have due dates**

**Categories:**

1. **Client Deliverables** → Due date REQUIRED
   - Proposals, reports, installations, go-lives
   
2. **Internal with Deadline** → Due date REQUIRED
   - Prep for client meetings, proposals before RFP deadline
   
3. **Important but Flexible** → Due date RECOMMENDED
   - Internal improvements, documentation, training
   
4. **Backlog / Someday** → Tag with "Someday" label, no due date
   - Nice-to-have features, future ideas

### **Setting Due Dates:**

**Be realistic:**
- Don't set "tomorrow" for a 3-day task
- Add buffer time (estimate + 20%)
- Consider dependencies

**Use natural language:**
- `tomorrow`
- `next Monday`
- `Feb 15`
- `every Thursday` (recurring)

**Communicate changes:**
- If you need to push a due date, update it ASAP
- Tag the task owner or project lead
- Comment why (e.g., "Waiting on client data")

---

## Priority Levels

Todoist uses P1 (highest) to P4 (lowest). **Don't mark everything P1!**

### **P1 (Red) - Critical**
- Blocking client go-live
- Overdue with client escalation
- Security issue or system down
- **Limit: Max 2-3 tasks per person at any time**

**Example:** `[URGENT] Fix production line AMR - Addoha line stopped`

### **P2 (Orange) - Important**
- Due this week
- Client deliverable coming up
- Blocking other team members
- **Most client tasks should be P2**

**Example:** `Send KAUST proposal (due Friday)`

### **P3 (Blue) - Normal**
- Due next week or later
- Internal improvements
- Non-blocking work
- **Default priority for most tasks**

**Example:** `Update company profile on website`

### **P4 (White) - Low**
- Backlog items
- Nice-to-have features
- "Someday" tasks
- **Use sparingly - consider archiving instead**

**Example:** `Research new CRM platform options`

---

## Task Assignment

### **Who Assigns?**
- **Project Lead** assigns tasks to team
- **Self-assign** if you commit to doing something
- **Default to unassigned** if unclear → Discuss in next standup/meeting

### **Rules:**
1. **One owner per task** (no shared tasks)
   - If 2 people collaborate, pick primary owner
   - Add the other in description as "Collaborator"

2. **Assign when creating** (don't leave unassigned)
   - Can't assign yet? Add comment: "Need to determine owner"

3. **Re-assign when delegating**
   - Don't just tell someone verbally
   - Re-assign in Todoist + comment why

### **Workload Balance:**
Check before assigning:
- Don't overload one person
- Consider task complexity, not just count
- Ask: "Do you have capacity for this?"

---

## Subtasks vs. Separate Tasks

### **Use subtasks when:**
- Steps within a single deliverable
- All owned by the same person
- Parent task can't be done without all subtasks

**Example:**
```
Task: Prepare SIRI assessment report for ARTIC
  - [ ] Collect production data from site visit
  - [ ] Analyze digital maturity score
  - [ ] Draft recommendations section
  - [ ] Get Ayman's review
  - [ ] Send final report to client
```

### **Use separate tasks when:**
- Different owners
- Different due dates
- Can be done independently

**Example:** (Don't use subtasks for these)
- `Schedule ARTIC site visit` (Firas)
- `Conduct ARTIC site visit` (Firas + Aadil)
- `Analyze ARTIC data` (Aadil)
- `Write ARTIC report` (Firas)

---

## Labels

Use labels for cross-cutting categories:

### **Recommended Labels:**

- `@Client-Facing` - Anything client will see
- `@Blocked` - Waiting on someone/something
- `@Quick-Win` - Can be done in <30 min
- `@High-Value` - Big impact
- `@Someday` - No due date, backlog
- `@Recurring` - Repeating tasks
- `@Needs-Review` - Waiting for approval/feedback

**By Department:**
- `#BD` - Business development
- `#Tech` - Technical/development
- `#Admin` - Administrative
- `#Management` - Leadership decisions

**By Project Type:**
- `$MES` - MES projects
- `$SIRI` - SIRI assessments
- `$SCADA` - SCADA projects
- `$Integration` - System integration

---

## Weekly Review Process

### **Every Monday Morning (9:00 AM)**

**Individual Review (15 min):**
1. **Inbox Zero:** Process all tasks in Inbox
2. **Review Overdue:** Update or complete overdue tasks
3. **This Week:** Confirm this week's due dates are realistic
4. **Next Week:** Add known tasks for next week
5. **Archive:** Move completed tasks to history

**Team Review (30 min, optional weekly standup):**
1. **Wins:** What got done last week?
2. **Blockers:** What's stuck? (Use `@Blocked` label)
3. **This Week:** Top 3 priorities per person
4. **Red Flags:** Any client deliverables at risk?

---

## Common Workflows

### **1. Action Item from Meeting**

**During meeting:**
- Write down action items
- Note: Who, what, when

**After meeting:**
1. Open Todoist
2. Create task: `[Action from Meeting Name]`
3. Add description with context
4. Assign owner
5. Set due date
6. Add to relevant project

**Tip:** Use Flux to auto-extract action items from meeting recordings (Recall.ai integration)

---

### **2. Email Request → Task**

**When you get a task request via email:**
1. Create task in Todoist
2. Name: What needs to be done
3. Description: Copy relevant email content
4. Add label: `@Client-Facing` if from client
5. **Reply to email:** "Got it! Added to our task list, will update you by [date]"

**Tip:** Forward email to Todoist: `[your-todoist-email]@todoist.com`

---

### **3. Client Deliverable Project Setup**

**When starting new client project:**
1. Create project: `[Client] | [Type] | [Program]`
2. Add project description (stakeholders, timeline, docs link)
3. Break down into phases/milestones
4. Create tasks for each phase
5. Assign owners
6. Set due dates working backward from deadline
7. Add project to appropriate category folder

**Example breakdown:**
```
Project: Beta Trading | MES Implementation

Phase 1: Discovery (Week 1-2)
  - [ ] Kickoff meeting (Jan 15)
  - [ ] Site survey (Jan 16-17)
  - [ ] Requirements documentation (Jan 22)
  
Phase 2: Design (Week 3-4)
  - [ ] System architecture (Jan 29)
  - [ ] Get client approval on design (Feb 1)
  
Phase 3: Development (Week 5-8)
  - [ ] ...
```

---

### **4. Recurring Tasks**

**For regular activities:**

**Setup:**
1. Create task with recurring due date
2. Use natural language: `every Monday`, `every 2 weeks`, `1st of every month`
3. Add description with checklist if steps are involved

**Examples:**
- `Weekly pipeline review` (every Monday)
- `Addoha team meeting` (every Thursday 2pm)
- `Submit monthly financial report` (last Friday of month)
- `Check HubSpot for new leads` (every weekday)

**Tip:** Don't overdo recurring tasks - only for truly regular activities

---

### **5. Delegating a Task**

**When you need someone else to do your task:**
1. Open the task
2. Click assign
3. Choose new owner
4. Add comment: "Delegating because [reason]. Let me know if you need context."
5. Adjust due date if needed
6. **Tell them verbally/via chat** (don't assume they saw the notification)

---

## Todoist Tips & Tricks

### **Keyboard Shortcuts (Desktop/Web)**
- `Q` - Quick add task
- `A` - Add task to current project
- `T` - Set/edit due date
- `Enter` - Complete task
- `/` - Search

### **Natural Language for Due Dates**
- "tomorrow 3pm"
- "next Monday"
- "every Friday"
- "in 3 days"
- "Feb 15 at 2pm"

### **Task Links**
Right-click task → Copy link → Share exact task with team

### **Filters (Advanced)**
Create custom views:
- `@Blocked & !#Done` - All blocked tasks
- `assigned to: me & overdue` - My overdue tasks
- `#Client Delivery & today` - Client tasks due today

### **Integrations**
- **Email:** Forward emails to Todoist
- **Calendar:** Sync tasks to Google Calendar
- **Slack:** Get notifications in Slack (future)

---

## What NOT to Do

### ❌ **Don't Use Todoist For:**

1. **Long-term storage of information**
   - Use: Google Drive, Notion, Wiki
   - Not: Todoist task descriptions

2. **Conversations**
   - Use: Telegram, Email, Meetings
   - Not: Task comments (use for updates only)

3. **File attachments**
   - Use: Google Drive + link in task
   - Not: Todoist file uploads (limited)

4. **Project documentation**
   - Use: Google Docs, Confluence
   - Not: Todoist project descriptions (keep brief)

### ❌ **Don't Create:**

1. **Vague tasks** - "Follow up on thing", "Check status"
2. **Tasks without context** - Future you won't remember
3. **Permanent tasks** - "Monitor X forever" (use recurring instead)
4. **Meta-tasks** - "Organize Todoist" (just do it, don't task it)
5. **One-word tasks** - "APIs", "Salem", "Meeting"

---

## Team Adoption Plan

### **Phase 1: Immediate (This Week)**

**Quick Wins:**
- [ ] Clean up existing tasks (remove vague, add due dates)
- [ ] Archive empty projects
- [ ] Add project descriptions to active projects
- [ ] Assign all tasks to owners
- [ ] Set up recurring tasks properly

**Team Training:**
- [ ] Share this guide with team
- [ ] 15-min walkthrough in team meeting
- [ ] Q&A session

---

### **Phase 2: Establish Habits (Week 2-3)**

**Daily:**
- Check Todoist in morning
- Update task status when things change
- Complete/archive finished tasks

**Weekly:**
- Monday morning: Personal task review
- Monday team standup: Share priorities

**Rules:**
- All meeting action items → Todoist within 24 hours
- All client requests → Todoist immediately
- Task without due date? Add one or tag `@Someday`

---

### **Phase 3: Optimization (Month 2+)**

**Measure:**
- Tasks completed per week (team)
- On-time completion rate
- Overdue task count
- Tasks without due dates (goal: 0%)

**Improve:**
- Refine project structure based on usage
- Add more helpful labels
- Set up automations (Flux integration)
- Create templates for common project types

**Integrate:**
- Todoist ↔ HubSpot (CRM)
- Todoist ↔ Google Calendar
- Todoist ↔ Recall.ai (meeting action items)
- Todoist ↔ Email (smart forwarding)

---

## Flux Integration (Automated Support)

### **What Flux Will Do:**

**Daily Monitoring:**
- Flag tasks without due dates
- Alert on overdue tasks
- Identify vague/unclear tasks
- Check for unassigned tasks

**Weekly Reports (Monday 8 AM):**
- Team completion summary
- Project health scores
- Overdue task report
- Workload balance check

**Meeting Support:**
- Extract action items from Recall.ai recordings
- Auto-create Todoist tasks
- Pre-meeting prep (pull related tasks)
- Post-meeting follow-up

**Project Intelligence:**
- Client project status summaries
- Risk alerts (tasks at risk of missing deadlines)
- Dependency tracking
- Capacity planning

---

## FAQ

**Q: What if I don't know the due date?**  
A: Use your best estimate + 20% buffer. You can always adjust. Or tag it `@Someday` if truly no deadline.

**Q: How do I handle urgent interruptions?**  
A: Create task immediately, mark P1, do it, mark done. Takes 30 seconds.

**Q: What if someone asks me to do something verbally?**  
A: Say "Let me add that to Todoist" → Create task while they're there → Confirm due date with them.

**Q: My task list is overwhelming!**  
A: You probably need to:
1. Delegate some tasks
2. Push out some due dates
3. Archive "someday" tasks
4. Talk to your manager about workload

**Q: Do I need to put EVERYTHING in Todoist?**  
A: No. Don't add:
- Routine work you do automatically
- Things that take <2 minutes (just do them)
- Vague "keep an eye on X" (set up alerts instead)

**Q: How detailed should subtasks be?**  
A: Enough that you won't forget steps. If it's more than 5 subtasks, consider breaking into separate tasks.

**Q: Can I use Todoist for personal tasks too?**  
A: Yes! Create a "Personal" project. Keep work and personal separate.

**Q: What if the client changes the deadline?**  
A: Update the due date immediately + add comment: "Client moved deadline to [date]"

**Q: How do I handle tasks that depend on others?**  
A: 
1. Add dependency in task description
2. Tag `@Blocked` if waiting
3. Add comment with what you're waiting for
4. Follow up with that person

---

## Quick Reference Card

```
📋 TASK CREATION CHECKLIST
  [ ] Clear action verb (Review, Send, Install...)
  [ ] Specific object/context
  [ ] Assigned to someone
  [ ] Due date (or @Someday label)
  [ ] Description with "Why" and "Done when"
  [ ] In the right project
  [ ] Appropriate priority (P2 for most)

📁 PROJECT NAMING
  [Client/Initiative] | [Type] | [Program]
  Example: Addoha | Track & Trace | ITMAM

📅 DUE DATE RULES
  ✅ Client deliverables: REQUIRED
  ✅ Internal with deadline: REQUIRED
  ⚠️ Important but flexible: RECOMMENDED
  ⭕ Backlog/someday: Tag @Someday

🎯 PRIORITY GUIDE
  P1 (Red): Blocking/Critical (max 2-3)
  P2 (Orange): Important, due soon (most client work)
  P3 (Blue): Normal (default)
  P4 (White): Low/Backlog

🔄 WEEKLY RHYTHM
  Monday AM: Review your tasks (15 min)
  Monday Team: Share priorities (30 min)
  Daily: Check Todoist morning & evening
  After Meetings: Add action items immediately
```

---

## Next Steps

1. **Review this guide** - Ayman + Aadil meeting
2. **Customize** - Adjust for IIoT Solutions specifics
3. **Share with team** - Distribute final version
4. **Training session** - 30 min walkthrough
5. **Launch** - Start using immediately
6. **Review in 2 weeks** - What's working? What needs adjustment?

---

**Questions or suggestions?**  
Contact: Flux (AI Employee) or Aadil (CTO)

**Version History:**
- v1.0 (2026-02-03): Initial draft by Flux

---

*This is a living document. As we learn what works for IIoT Solutions, we'll update it.*
