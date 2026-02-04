# Client Intelligence System

Automated company research and briefing generation for IIoT Solutions' business development.

## Quick Start

**To research a company:**

Ask Flux directly:
```
"Research [Company Name] for business development"
```

Flux will:
1. Search the web for company information
2. Analyze their website
3. Assess digital maturity
4. Identify opportunities
5. Generate a briefing in `output/[company]-brief.md`

## Features

✅ Automated web research
✅ Digital maturity assessment
✅ Opportunity identification
✅ Saudi market focus (SIRI, Industry 4.0)
✅ Decision maker identification
✅ Structured briefing format

## Files

- `SKILL.md` — Main documentation
- `RESEARCH-PROTOCOL.md` — Step-by-step research process
- `templates/briefing.md` — Briefing format template
- `output/` — Generated briefings (gitignored for privacy)

## Integration

**Current:**
- Web search (Brave API)
- Web fetch for website analysis
- Manual compilation by Flux

**Future:**
- HubSpot CRM integration (automatic contact/company creation)
- LinkedIn enrichment
- Saudi company registry lookup
- SIRI assessment database

## Usage Examples

```
"Research SABIC for potential business"
"Create a briefing for Ma'aden"
"Research all companies in the steel sector in Saudi Arabia"
```

## Output

Each research session creates:
- `[company]-brief.md` — Human-readable briefing
- Recommended next actions
- Strategic recommendations

---

**Created:** 2026-02-01 (Overnight self-improvement session)
**Version:** 1.0
