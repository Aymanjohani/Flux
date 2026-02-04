# Self-Development Skill

*Version: 1.1*
*Last Updated: 2026-02-04*

---

## Overview

This skill guides **daily** self-development, learning consolidation, and capability improvement. The core loop runs daily via cron jobs, with deeper weekly reviews.

**Daily Cycle:**
1. Overnight Self-Improvement (2:00 AM) - Build/improve things
2. Memory Consolidation (4:00 AM) - Extract learnings → update `lessons-learned.md`
3. Daily Summary (23:30) - Extract lessons, update state

**Weekly Cycle:**
- Weekly Self-Review (Fridays 6:00 AM) - Deeper capability assessment

---

## Weekly Self-Review Process

**Trigger:** Cron job (Fridays 6:00 AM Riyadh)

### Step 1: Review Current State

Read and analyze:
```
memory/capabilities.md      # Current capabilities
memory/goals.md             # Capability gaps and objectives
memory/semantic/lessons-learned.md  # Recent learnings
```

### Step 2: Assess Progress

For each capability goal, evaluate:
- Progress made this week
- Blockers encountered
- New learnings applied

### Step 3: Identify Gaps

Look for:
- Repeated failures in memory files
- Skills requested but not yet built
- Integration points that caused issues
- Knowledge areas with low confidence

### Step 4: Update Memory Files

Update these files with findings:
```bash
# Update capabilities with new skills developed
memory/capabilities.md

# Update goals with completed items and new gaps
memory/goals.md

# Add review summary
memory/weekly-reviews/YYYY-MM-DD.md
```

### Step 5: Report to Ayman

Send summary via Telegram:
- Key achievements this week
- New capabilities developed
- Priority gaps to address
- Recommended focus for next week

---

## Overnight Self-Improvement Process

**Trigger:** Cron job (Daily 2:00 AM Riyadh)

During quiet hours, work on:

1. **Build over Read** - Create tangible improvements
2. **Priority Order:**
   - Fix broken integrations
   - Build requested skills
   - Improve existing tools
   - Research for future capabilities
3. **Document Everything** - Log work to daily memory file

### What to Build

Check these sources for improvement ideas:
```
memory/goals.md             # Capability gaps
memory/active-work.md       # Pending items
memory/semantic/lessons-learned.md  # Repeated issues to fix
```

### Build Guidelines

- Focus on one substantial improvement per session
- Test before claiming completion
- Update relevant memory files after building
- Don't message Ayman unless urgent

---

## Capability Categories

### Core Capabilities (Must Maintain)
- Session management and context isolation
- Memory retrieval and consolidation
- Communication (Telegram, Email)
- File operations and code editing

### Integration Capabilities
- HubSpot CRM operations
- Gmail reading/sending
- Calendar management
- Todoist task management
- LinkedIn intelligence gathering

### Development Capabilities
- Skill creation and documentation
- Script development
- Hook implementation
- Cron job management

---

## Self-Assessment Framework

Rate each capability area (1-5):
1. **Non-functional** - Broken or not implemented
2. **Basic** - Works with manual intervention
3. **Functional** - Works reliably with some limitations
4. **Strong** - Works well, handles edge cases
5. **Expert** - Optimized, proactively identifies issues

### Assessment Template

```markdown
## Capability Assessment: [YYYY-MM-DD]

### Communication
- Telegram: [1-5] - [notes]
- Email: [1-5] - [notes]

### Memory
- Retrieval: [1-5] - [notes]
- Consolidation: [1-5] - [notes]
- Context Management: [1-5] - [notes]

### Integrations
- HubSpot: [1-5] - [notes]
- Calendar: [1-5] - [notes]
- Todoist: [1-5] - [notes]
- LinkedIn: [1-5] - [notes]

### Gaps Identified
1. [gap description]
2. [gap description]

### Priority Improvements
1. [improvement]
2. [improvement]
```

---

## Memory Files Reference

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `memory/capabilities.md` | Current capability list | Weekly |
| `memory/goals.md` | Objectives and gaps | Weekly |
| `memory/semantic/lessons-learned.md` | Accumulated learnings | Daily (via dream) |
| `memory/weekly-reviews/` | Weekly review summaries | Weekly |

---

## Daily Lessons-Learned Update

**This is the core self-development mechanism.**

Every day at 4:00 AM Riyadh, the Memory Consolidation job runs:

```
./scripts/memory dream
```

This extracts learnings from the daily log and **appends them to `lessons-learned.md`**:

```
Daily Log (memory/YYYY-MM-DD.md)
           ↓
    dream() extracts learnings
           ↓
    Groups by topic
           ↓
    Appends to memory/semantic/lessons-learned.md
           ↓
    Re-ingests to vector DB (with deduplication)
```

The `lessons-learned.md` file is the **living document** of accumulated knowledge:
- Organized by date and topic
- Searchable via vector memory
- Referenced by other skills
- Grows daily with new learnings

---

## Integration with Memory Architecture

This skill connects to the memory system:

1. **Reads from:**
   - `semantic/lessons-learned.md` - Accumulated learnings (CORE)
   - `context-hierarchy/chapters/` - Recent activity patterns
   - `today-brief.md` - Current session context

2. **Writes to:**
   - `semantic/lessons-learned.md` - Via dream() consolidation (daily)
   - `capabilities.md` - Updated capability assessments (weekly)
   - `goals.md` - New objectives and completed goals (weekly)
   - `weekly-reviews/` - Review summaries (weekly)

3. **Triggers:**
   - Memory Consolidation cron job (daily 4 AM) - updates lessons-learned.md
   - Overnight Self-Improvement cron job (daily 2 AM) - builds things
   - Weekly Self-Review cron job (Fridays 6 AM) - deeper review
   - Manual invocation

---

## Quick Commands

```bash
# Check current capabilities
cat memory/capabilities.md

# Check goals and gaps
cat memory/goals.md

# Review recent lessons
./scripts/memory retrieve "lessons learned this week"

# Create weekly review
cat > memory/weekly-reviews/$(date +%Y-%m-%d).md << 'EOF'
# Weekly Review: [DATE]
...
EOF
```

---

## Cognitive Enhancement Backlog

Research-backed improvements for overnight self-improvement sessions. Based on AI cognitive architecture and AGI research.

### Phase 1: Now (Low Effort, High Impact)

#### 1. Failure Post-Mortems
Store structured analysis when things fail:

```markdown
## Failure: [DATE] [Title]

**What happened:** [description]
**Root cause:** [analysis]
**Pattern:** [anti-pattern name]
**Prevention:** [how to avoid]
**Similar past failures:** [links]
```

**Location:** `memory/semantic/failure-analysis.md`
**Implementation:** Create template, update dream() to extract failures

#### 2. Uncertainty Tracking
Add confidence levels to state.json facts:

```json
{
  "fact": "HubSpot portal ID is 147149295",
  "confidence": 0.99,
  "source": "verified in API",
  "lastValidated": "2026-02-04"
}
```

**Why:** Know what I don't know. Reduce hallucination risk.

---

### Phase 2: Soon (Medium Effort, High Impact)

#### 3. Reasoning Chain Memory
Store HOW conclusions were reached, not just the conclusion:

```markdown
- "Use absolute paths for consistency"
  - Reasoning: Relative paths failed in cron context
  - Evidence: scripts/create-daily-chapter.sh bug
  - Confidence: High (tested fix)
```

**Why:** Enables analogical reasoning for similar problems

#### 4. Temporal Decay + Reinforcement
Weight memories by:
- Recency (newer = higher)
- Access frequency (retrieved often = important)
- Validation (confirmed = boost)

```javascript
score = baseScore * recencyFactor * accessCount * validationBoost
```

**Implementation:** Modify memory_engine.js retrieve()

#### 5. Capability Metrics Dashboard
Quantitative self-assessment:

```markdown
| Capability | Success Rate | Trend |
|------------|--------------|-------|
| Email | 94% (17/18) | ↑ |
| HubSpot | 88% (22/25) | → |
| Memory | 91% (32/35) | ↑ |
```

**Location:** `memory/capability-metrics.md`
**Update:** Weekly during self-review

---

### Phase 3: Later (High Effort, Very High Impact)

#### 6. Multi-Hop Retrieval
Follow connections between chunks:

```
Query: "Why did HubSpot fail?"
→ Chunk 1: "API returned 429"
→ Link → Chunk 2: "Rate limit 100/10s"
→ Link → Chunk 3: "Batch made 500 requests"
→ Answer: Batch exceeded rate limit
```

**Research:** Knowledge graphs, reasoning chains
**Implementation:** Add `relatedTo` field to chunks, graph traversal in retrieve()

#### 7. Predictive Context Loading
Before sessions, predict needed context:

```
User: "Check HubSpot deals"
→ Auto-load: hubspot skill, pipeline state
→ Skip: linkedin, todoist
```

**Implementation:** Hook on session start, analyze user patterns

#### 8. Skill Transfer Detection
When learning in one domain, check if applies elsewhere:

```
Learning: "Validate API responses before processing"
Context: HubSpot

→ Check: Gmail API? Calendar? LinkedIn?
→ Generate: Validation patterns for all integrations
```

---

### Phase 4: Future (Research Projects)

#### 9. User Mental Models
Track per-user preferences:

```json
{
  "user": "Ayman",
  "communication": "direct, no fluff",
  "decisions": "wants options + recommendation",
  "timing": "active 9-11 AM Riyadh"
}
```

#### 10. Proactive Memory Maintenance
Self-initiated weekly:
- Identify contradicting facts → resolve
- Find stale information → flag
- Detect knowledge gaps → create tasks
- Merge similar entries → reduce redundancy

#### 11. Contradiction Detection
When storing new facts, check for conflicts:

```
New: "Rate limit is 200/10s"
Existing: "Rate limit is 100/10s"
→ Alert: Contradiction detected
→ Action: Verify and resolve
```

---

### Research References

| Concept | Source | Relevance |
|---------|--------|-----------|
| Hierarchical Memory | Mem0 research | 26% accuracy improvement |
| Spaced Repetition | Cognitive psychology | Memory retention |
| Episodic vs Semantic | Tulving (1972) | Memory architecture |
| Predictive Processing | Clark (2013) | Context anticipation |
| Meta-cognition | Flavell (1979) | Self-awareness |
| Knowledge Graphs | Google/DeepMind | Multi-hop reasoning |

---

### Implementation Tracking

| Enhancement | Status | Started | Completed | Notes |
|-------------|--------|---------|-----------|-------|
| Failure post-mortems | Pending | - | - | Phase 1 priority |
| Uncertainty tracking | Pending | - | - | Phase 1 priority |
| Reasoning chains | Pending | - | - | |
| Temporal decay | Pending | - | - | |
| Capability metrics | Pending | - | - | |
| Multi-hop retrieval | Pending | - | - | |

*Update this table as improvements are implemented*

---

*This skill is invoked by the Weekly Self-Review cron job (Fridays 6 AM Riyadh) and can be triggered manually.*
