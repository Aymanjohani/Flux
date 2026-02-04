# Client Intelligence Skill

**Purpose:** Automated research and briefing generation for IIoT Solutions' business development.

**Created:** 2026-02-01 (Day 2 overnight self-improvement)

## What It Does

Researches companies and generates structured briefings to support sales and business development:

1. **Company Research** — Web search for background, industry, size, digital maturity
2. **Opportunity Analysis** — Identify potential IIoT/MES/SCADA needs
3. **Decision Maker Identification** — Find key contacts (when possible)
4. **Briefing Generation** — Create formatted documents for sales preparation
5. **Saudi Market Focus** — Special attention to local context and SIRI readiness

## When to Use

- Before sales calls or meetings
- When qualifying new leads
- Researching competitors
- Preparing proposals
- Building target account lists

## Usage

### Research a Company

```bash
./skills/client-intelligence/scripts/research-company.sh "Company Name"
```

Outputs:
- `output/COMPANY-NAME-brief.md` — Formatted briefing
- `output/COMPANY-NAME-raw.json` — Structured research data

### Generate Briefing from Research

```bash
./skills/client-intelligence/scripts/generate-briefing.sh "Company Name"
```

### Batch Research (from list)

```bash
./skills/client-intelligence/scripts/batch-research.sh targets.txt
```

## Templates

- `templates/briefing.md` — Standard company briefing format
- `templates/opportunity-assessment.md` — Digital transformation opportunity template
- `templates/siri-readiness.md` — Industry 4.0 readiness notes

## Integration Points

### Current
- Web search (Brave API)
- Web fetch for company websites
- Manual compilation

### Planned
- HubSpot CRM (once access enabled)
- LinkedIn data enrichment
- Saudi company registry lookup
- SIRI assessment database

## Output Format

Each briefing includes:

1. **Company Overview** — Industry, size, location, ownership
2. **Digital Maturity** — Current tech stack, automation level
3. **Pain Points** — Identified challenges and opportunities
4. **Decision Makers** — Key contacts (title, background if available)
5. **Recommended Approach** — How to position IIoT Solutions' services
6. **SIRI Context** — Industry 4.0 readiness (for Saudi companies)

## Workflow

```
Target identified → Research company → Generate briefing → 
Add to HubSpot (manual for now) → Prep sales approach
```

## Files

```
client-intelligence/
├── SKILL.md (this file)
├── scripts/
│   ├── research-company.sh — Main research automation
│   ├── generate-briefing.sh — Create formatted brief
│   └── batch-research.sh — Process multiple targets
├── templates/
│   ├── briefing.md — Briefing format
│   └── opportunity-assessment.md — Opportunity template
└── output/ — Generated briefings (gitignored)
```

## Notes

- Research is automated but requires human validation
- Sensitive client data should go in HubSpot, not local files
- Update templates based on what works in real sales conversations
- Consider rate limits on web searches (Brave API)

---

**Status:** v1.0 — Initial build, ready for testing
