# Active Work

## 🔴 URGENT: Resource Sourcing for Balhamar (Feb 18 Deadline)

**Status:** Critical - Hardware ready Feb 18, must have automation engineer secured

**Three parallel tracks:**
1. **Hamad:** Negotiate with Voltonic (counter-offer: 8.5K but they cover ALL expenses)
2. **Ayman/Mreefah:** Find local Saudi manpower companies (Jeddah/Dammam)
3. **All:** Direct hire search (target 10-15K SAR/month)

**Requirements:**
- Brownfield experience (retrofitting existing machines)
- PLC programming (multiple brands)
- HMI + Flexi programming
- Circuit diagram reading
- Production environment experience
- Based in Dammam or Jeddah
- Has car for mobility

**Why urgent:**
- POC completion = 400K SAR payment (50% down payment)
- Critical for cash flow
- Cannot delay through Ramadan

**Action needed from Hamad:** Send automation engineer job description/requirements to Ayman ASAP

---

## 🔴 URGENT: Module-Based Pricing Model

**Status:** Meeting scheduled TODAY (Feb 4) with Adil, Hamad, Amr

**Context:** Lost Print-to-Pack (440K vs 360K) because:
- Client wanted OEE monitoring only
- We proposed full MES suite
- "Double-dipping" on pricing (software + implementation both scale with machines)

**New strategy:**
- Separate modules: OEE, Scheduling, Planning, Reports
- Match client requirements exactly
- Clear separation of license vs implementation costs
- Example: OEE module alone ~50-100K (vs 150K full suite)

**Timeline:**
- Today: Finalize structure
- Tomorrow: Review and approve
- Next week: 3 new proposals using new model

**Related:** Hamad's standardized evaluation form already created (sent 2 days ago) - must be used for all projects

---

## 🔴 High Priority: Todoist Reform (Waiting on Aadil)

**Status:** Proposal sent 2026-02-03, awaiting feedback

**NEW URGENCY (from today's meeting):**
- Ayman will issue **warnings** for non-compliance
- Multiple projects running (Kiswah, Doha, Balhamar, EBC, new leads)
- Mandatory enforcement starting NOW

**Quote from meeting:**
> "Everyone who does not communicate through email and Todoist, I will issue warnings. We cannot continue working with this chaos." - Ayman

**What's needed:**
1. Aadil's decision: Clean slate vs fix-in-place?
2. Approval of functional architecture (6 areas: Sales, Delivery, Dev, Ops, Marketing, Leadership)
3. Schedule 30-min planning session
4. Execution timeline

**If approved:** Execute migration immediately (2-3 hours work)

**Documentation ready:**
- `docs/todoist-team-guide.md` (18KB usage guide)
- `docs/todoist-restructure-proposal.md` (15KB architecture)
- `reports/todoist-projects-analysis-2026-02-03.md` (19KB analysis)

---

## 🟡 Medium Priority: HubSpot Pipeline Hygiene

**Issue:** 6 stale SIRI deals (>7 days no activity)

**Actions needed:**
1. Follow up on each deal - should they be closed/lost?
2. Update deal stages or add activity notes
3. Consider SIRI economics issue (13 deals, SAR 119K total, high effort/low value)

**Also needed:**
- Loss analysis template (SAR 1.24M closed lost, no post-mortems)
- Weekly pipeline review process (propose Mondays 9 AM)

---

## 🟢 Active Projects (from today's meeting)

**Running:**
1. **Balhamar (POC)** - Starts Feb 18 (hardware ready)
2. **EBC (SCADA)** - Follows Balhamar
3. **Kiswah** - Ongoing
4. **Doha** - Ongoing

**Pipeline:**
1. E1 company (potential)
2. Two visits scheduled (Intake - Feb 4)
3. Monday factory visit (Amr leading - Feb 5)
4. 3 customers need proposals next week (use new pricing)

---

## ✅ Completed: Team Meeting Transcription (2026-02-04)

**Meeting:** Feb 4, 07:06-08:10 UTC (70 minutes)
**Attendees:** Ayman, Adil, Hamad
**Bot:** Recall.ai joined successfully
**Transcription:** Groq Whisper (7 chunks, 70 minutes)
**Summary:** Created and sent to Ayman

**Key decisions:**
1. Reject Voltonic current terms (too expensive)
2. Module-based pricing overhaul
3. Mandatory Todoist enforcement
4. Balhamar urgency (Feb 18 deadline)

**Files:**
- `meetings/2026-02-04/meeting-recording.mp4` (94MB)
- `meetings/2026-02-04/transcript.txt`
- `meetings/2026-02-04/transcript-chunks.json`
- `meetings/2026-02-04/meeting-summary.md` (sent to Ayman)

---

## ✅ Completed: Project Portfolio Analysis (2026-02-03)

**HubSpot Analysis:**
- 26 deals analyzed (SAR 1.94M active pipeline)
- 23% stale rate identified
- Team imbalance noted (Amr: SAR 1.3M, Firas: SAR 87K)
- Report: `reports/projects-analysis-2026-02-03.md`

**Todoist Analysis:**
- 51 tasks, 38 projects analyzed
- Critical finding: 96% tasks have no due dates
- 13 empty projects
- Report: `reports/todoist-projects-analysis-2026-02-03.md`

**Team Coordination:**
- Shared guide with Ayman, Aadil, Mreefah
- Awaiting implementation plan

---

## ✅ Completed: Memory & Cognitive Architecture (2026-02-03 to 2026-02-04)

**Problem:** Context trapped in sessions, lost on reset, conversation continuity issues

**Solution implemented:**
1. Created `scripts/memory-checkpoint.sh` - mandatory before reset
2. Updated AGENTS.md with protocols:
   - Memory checkpoint at 50k tokens
   - Write as we work (not just at session end)
   - Session architecture guidelines
3. Memory files as integration layer
4. Added "Active Session Continuity" protocol (2026-02-04):
   - Files for persistence across sessions
   - Conversation history for continuity within session
   - Fixed issue where I treated prompts as isolated

**Status:** Protocol established, tested, fixed, and following consistently

---

## ✅ Completed: HubSpot Factory Database Import (2026-02-03)

**Result:**
- 5,371 companies successfully imported (99.9%)
- 8 custom properties created
- Backup + SOP created
- Status email sent to team

**Pending Phase 3:** Contacts import (4,969 contacts) - waiting on decision

---

## ✅ Completed: Workspace Cleanup & Technical Fixes (2026-02-04 01:41 UTC)

**Phase 1: Root directory organized**
- 7 data files (5MB) → data/archive/
- 15 HubSpot scripts → scripts/ops/hubspot/
- Voice agent demo → projects/voice-agent-demo/

**Phase 2: Skills pruned**
- Deleted 6 empty/obsolete skills (flux-memory, hybrid-memory, daily-digest, daily-review-ritual, self-development, sales-intelligence)
- Remaining 5 active skills: linkedin-intel, client-intelligence, context-manager, hubspot, todoist

**Phase 3: Technical fixes**
- ✅ Created memory/context-hierarchy/chapters/ directory
- ✅ Fixed memory_engine.js with Gemini→Claude fallback (handles quota exhaustion)
- ✅ Verified scripts/close-chapter.sh works correctly
- ✅ Added 'check' bash alias for check-before-ask.sh

**Workspace status:** Clean and production-ready

**Phase 4: Updated context-manager skill (01:48 UTC)**
- ✅ Aligned with new hierarchical context architecture
- ✅ Added book-outline.md + chapters workflow
- ✅ Integrated new scripts (memory-checkpoint, close-chapter, check-before-ask)
- ✅ Updated anti-patterns with lessons learned
- ✅ Re-ingested to vector memory (43 chunks)

---

## 🔵 Background: System Maintenance

**Pending fixes:**
1. ~~memory_engine.js Gemini→Claude fallback~~ ✅ **FIXED 2026-02-04**
2. ~~LinkedIn Intelligence script timeout~~ ✅ **FIXED 2026-02-04**
3. Token threshold monitor - investigating why hook didn't load
4. Clean up 3 test bots from Recall.ai
5. Production voice bot setup (when needed)
6. **E3 Gmail Pub/Sub:** Run `gcloud auth login` then `./scripts/setup-gmail-pubsub.sh` — replaces 2-hour polling with instant push

**Automated tasks running:**
- ~~Email monitoring (every 2 hours)~~ → **Pending upgrade to Gmail Pub/Sub push (E3)**
- LinkedIn Intelligence (nightly 2 AM Riyadh)
- SSH login alerts (monitored)
- Morning briefing (daily 8:30 AM Riyadh) — now via event-bus
- Meeting prep (daily 8:35 AM Riyadh) — now via event-bus
- Pipeline watchdog (weekly Monday 6:00 AM Riyadh) — now via event-bus
- Accountability check (weekly Sunday 6:00 PM Riyadh) — now via event-bus
- Graph DB re-evaluation reminder (Feb 13, 8:00 AM Riyadh)

---

## 📋 Context Notes

**Key learning from today's meeting (2026-02-04):**
- "Match client requirements exactly - don't upsell full MES when they want monitoring"
- "Once we send proposal, if sentiment is bad, sit with them technically"
- "Resource economics: Why bring someone from Pakistan at 20K/month when we can hire locally for 10-15K?"
- "POC completion = 400K payment. It's in our best interest to finish tomorrow if possible."

**About IIoT Solutions:**
- Strong technical capability, weak operational discipline
- Need structure more than features
- Tools exist, need standards + accountability
- Cash flow sensitive - large projects critical

**Team dynamics:**
- Ayman: directness + systems thinking
- Aadil: technical/process implementation
- Hamad: technical execution, needs to send job requirements
- Mreefah: admin tasks, will help with hiring search

---

**Last updated:** 2026-02-06, 22:40 UTC (E1-E6 infrastructure hardening complete)

---

## ✅ RESOLVED: Embedding Model Fixed

**Discovered:** 2026-02-06 04:00 UTC
**Error:** `text-embedding-004 is not found for API version v1beta`
**Fix:** P0 migrated to OpenAI text-embedding-3-small (1536 dims). All ingestion working.
**Verified:** ayman.md (8 chunks), aadil.md (7 chunks) ingested successfully.
