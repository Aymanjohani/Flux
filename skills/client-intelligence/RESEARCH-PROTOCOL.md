# Client Intelligence Research Protocol

## When User Asks to Research a Company

Follow this protocol to generate comprehensive intelligence:

### Step 1: Initial Web Search (3 searches)

1. **Company Overview Search**
   ```
   "[Company Name] Saudi Arabia industry manufacturing"
   ```
   Goal: Company background, industry, size, location

2. **Technology/Digital Search**
   ```
   "[Company Name] automation technology digital transformation industry 4.0"
   ```
   Goal: Current tech stack, digital maturity, automation level

3. **News/Recent Developments**
   ```
   "[Company Name] news expansion investment"
   ```
   Goal: Recent activities, growth, challenges

### Step 2: Website Analysis (if found)

Fetch and analyze company website:
- Look for "About Us" — size, history, leadership
- Look for "Products/Services" — what they manufacture/provide
- Look for "Careers" — growth indicators
- Look for "News/Press" — recent developments
- Check for technology mentions — ERP, automation, systems

### Step 3: Decision Maker Search (if needed)

```
"[Company Name] CEO Operations Manager Plant Manager"
```

### Step 4: Industry Context (for Saudi companies)

```
"[Industry] Saudi Arabia Industry 4.0 SIRI digital transformation"
```

### Step 5: Compile Briefing

1. Create file: `skills/client-intelligence/output/[company]-brief.md`
2. Use template: `templates/briefing.md`
3. Fill in all sections with research findings
4. Mark TBD for missing information
5. Add sources list at bottom
6. Flag confidence level (High/Medium/Low) for each section

### Step 6: Analysis

Add strategic recommendations:
- Which IIoT Solutions services fit best?
- What's the likely decision-making process?
- What are the competitive dynamics?
- What's our unique angle?

### Step 7: Next Actions

Create a follow-up task list:
- Who should we contact?
- What additional research is needed?
- Should this go in HubSpot?
- Should we prepare a custom pitch?

## Output Location

All briefs go to: `skills/client-intelligence/output/`

## Post-Research

1. Log in today's memory file what was researched
2. If high-value target, suggest adding to HubSpot
3. Offer to prepare follow-up materials (pitch, email, etc.)

## Quality Standards

- **Accuracy:** Only state facts found in sources
- **Citations:** List all sources
- **Speculation:** Clearly mark inferences vs facts
- **Actionability:** Every brief must have clear next steps
- **Saudi Focus:** Always consider local context, SIRI, and government initiatives

## Example Flow

```
User: "Research SABIC for potential business"

Flux:
1. Search "SABIC Saudi Arabia petrochemical manufacturing"
2. Search "SABIC digital transformation automation"
3. Search "SABIC news expansion 2026"
4. Fetch sabic.com
5. Compile briefing
6. Suggest: "SABIC is massive (Fortune 500), likely uses Siemens/Rockwell stack.
   Opportunity: Digital twin implementation, predictive maintenance, MES upgrades.
   Decision makers: Plant-level operations managers.
   Shall I add to HubSpot and prepare an approach strategy?"
```

---

**Remember:** This is intelligence gathering to help sales. Be thorough but don't overstate confidence. When in doubt, mark as "Needs validation."
