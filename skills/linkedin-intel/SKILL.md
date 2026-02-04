---
name: linkedin-intel
description: Daily LinkedIn intelligence for Saudi industrial market - monitor hashtags, companies, and flag opportunities aligned with IIoT Solutions strategy
metadata:
  openclaw:
    emoji: 💼
    requires:
      bins: ["python3"]
      python: ["linkedin-api"]
---

# linkedin-intel

Automated LinkedIn intelligence gathering for IIoT Solutions business development.

## Purpose

Daily monitoring of Saudi industrial sector on LinkedIn with **focus on SMEs** to identify:

**🎯 Potential Clients:**
- SME manufacturers (50-500 employees) seeking digital transformation
- Companies mentioning MES/SCADA/Industry 4.0 needs
- Facilities with production/quality pain points
- SIRI assessment participants

**⚔️ Competitors:**
- Track Siemens, ABB, Schneider, Rockwell, etc.
- Monitor their project wins, partnerships, and market activity
- Understand competitive positioning

**🤝 Potential Partners:**
- ERP vendors, system integrators, equipment suppliers
- Complementary solution providers
- Channel/referral opportunities

## Setup

### 1. Account Creation

**Account details:**
- Email: coding@iiotsolutions.sa
- Name: Research Assistant (or similar non-personal name)
- Title: Industrial Research
- Company: Leave blank or generic
- Profile photo: Professional but generic (not personal)
- Privacy: No Premium required

**Important:**
- Don't link to IIoT Solutions company page
- Don't post or engage publicly
- Research mode only
- People will see views (no Premium = no anonymous mode)

### 2. Install Dependencies

```bash
cd /root/.openclaw/workspace/skills/linkedin-intel
python3 -m venv venv
source venv/bin/activate
pip install linkedin-api
```

### 3. Store Credentials

```bash
# Create secure credentials file
cat > config/credentials.json <<EOF
{
  "email": "coding@iiotsolutions.sa",
  "password": "YOUR_PASSWORD_HERE"
}
EOF

chmod 600 config/credentials.json
```

### 4. Test Connection

```bash
./scripts/test-connection.sh
```

## Daily Analysis

Run daily (integrated into HEARTBEAT.md):

```bash
./scripts/daily-intel.py
```

**Output:** `output/YYYY-MM-DD-intel.md`

## Target Monitoring

### Hashtags Tracked

Primary (Saudi Industry 4.0):
- #IndustryKSA
- #SaudiManufacturing
- #SIRI
- #VisionKSA
- #Industry40Saudi
- #DigitalTransformationKSA

Secondary (Technology):
- #MES
- #SCADA
- #IIoT
- #SmartFactory
- #Industry4

### Companies Monitored

See `config/targets.json` for full list. Key categories:

**🎯 Potential Clients (SME Focus):**
- Saudi Steel Pipe Company
- Yanbu Cement Company
- Saudi Ceramic Company
- Saudi Paper Manufacturing Company
- United Wire Factories Company
- Other MODON tenants (50-500 employees)

**⚔️ Competitors:**
- Siemens Saudi Arabia
- ABB Saudi Arabia
- Schneider Electric KSA
- Rockwell Automation
- Emerson, Honeywell, Yokogawa, GE Digital

**🤝 Potential Partners:**
- Intek Digital Solutions
- MODON
- Giza Systems
- SAP/Microsoft/Oracle Saudi Arabia
- Local ERP implementers

### Detection Patterns

**High Priority Signals:**
- Digital transformation announcements
- New facility/expansion plans
- SIRI assessment mentions
- MES/SCADA/ERP projects
- Industry 4.0 initiatives
- Government partnership announcements
- Budget allocation signals

**Medium Priority:**
- Hiring IIoT engineers, digital transformation roles
- Executive moves (new CIO, CTO, Operations Director)
- Conference participation (Industry 4.0 events)
- Technology partnership announcements

**Competitor Activity:**
- Project wins mentioned
- New partnerships
- Product launches

## Rate Limiting

**Critical:** LinkedIn bans accounts for excessive automation

**Limits:**
- Max 50 requests/hour
- Random delays 3-8 seconds between requests
- Max 200 requests/day
- Human-like session behavior

**Strategy:**
- Run once daily (morning, Riyadh time)
- Spread requests over 10-15 minutes
- Randomize search order
- Maintain persistent session cookies

## Output Format

Daily intelligence report:

```markdown
# LinkedIn Intel — YYYY-MM-DD

## 🎯 High Priority Opportunities

### [Company Name] - Digital Transformation Announcement
**Source:** [Post URL]
**Author:** [Name, Title]
**Signal:** Mentioned "MES implementation" and "Industry 4.0 roadmap"
**Action:** Research company, assess fit, prepare outreach

---

## 📊 Market Trends

- SIRI mentions: 12 posts (+20% vs last week)
- Industry 4.0 hashtag volume: 45 posts
- Most active companies: SABIC (8 posts), Ma'aden (5 posts)

---

## 👥 People Moves

- **[Name]** joined **[Company]** as CIO (Source: [URL])
  - Previously at [Company]
  - Background in manufacturing digitalization
  - Potential contact for outreach

---

## 🏭 Company Activity

### Ma'aden
- 3 posts this week
- Topics: Sustainability, Vision 2030, mining technology
- Engagement: High (500+ likes/post)

### SABIC  
- 5 posts this week
- Announced new R&D facility in Jubail
- Mentioned "smart manufacturing" 2x

---

## ⚠️ Competitor Intelligence

- **Siemens KSA** announced partnership with [Company X]
- **ABB** posted about MES implementation at [Customer Y]
- Monitor for follow-up

---

## 💡 Action Items

1. Research [Company A] - mentioned MES project
2. Connect with [Person B] - new CTO at target company
3. Monitor [Competitor C] - active in our target segment
```

## Risk Management

### Account Protection

**To avoid bans:**
1. Rate limit strictly (50 req/hour max)
2. Random human-like delays
3. Don't like/comment/connect (read-only mode)
4. Rotate search patterns daily
5. Maintain realistic session times (30-60 min/day)

**Warning signs:**
- Login challenges (CAPTCHA)
- "Unusual activity" warnings
- Requests timing out
- Profile restricted

**If detected:**
- Stop immediately (24-48 hour pause)
- Reduce request volume by 50%
- Increase delays between requests

### Fallback Plan

If account banned:
1. Create new account with different email
2. Switch to manual mode (team shares posts, I analyze)
3. Consider commercial API (Proxycurl) if critical

## Integration with HEARTBEAT.md

Add to daily checks:

```markdown
## LinkedIn Intelligence (Daily, 9 AM Riyadh)

./skills/linkedin-intel/scripts/daily-intel.py

Review output/YYYY-MM-DD-intel.md and:
- Flag high-priority opportunities to Ayman
- Update prospect research files
- Add competitor intel to memory
```

## Commands

```bash
# Daily intelligence run
./skills/linkedin-intel/scripts/daily-intel.py

# Search specific hashtag
./skills/linkedin-intel/scripts/search-hashtag.py "#IndustryKSA"

# Monitor company
./skills/linkedin-intel/scripts/company-monitor.py "maaden"

# Test connection
./skills/linkedin-intel/scripts/test-connection.sh
```

## Files

```
skills/linkedin-intel/
├── SKILL.md (this file)
├── README.md (quick reference)
├── config/
│   ├── credentials.json (secure, gitignored)
│   ├── targets.json (companies, hashtags)
│   └── rate-limits.json (safety thresholds)
├── scripts/
│   ├── daily-intel.py (main automation)
│   ├── search-hashtag.py (hashtag search)
│   ├── company-monitor.py (company tracking)
│   ├── test-connection.sh (verify setup)
│   └── lib/
│       ├── linkedin_client.py (API wrapper)
│       ├── opportunity_detector.py (pattern matching)
│       └── rate_limiter.py (safety)
├── output/
│   ├── .gitkeep
│   └── YYYY-MM-DD-intel.md (daily reports)
└── venv/ (Python virtual environment)
```

## Privacy & Security

- Credentials stored locally only (never in git)
- No data uploaded to third parties
- Output files gitignored (confidential intelligence)
- Account activity appears as normal LinkedIn usage
- No API keys or external services required

## Notes

- **No Premium** = Profile views are visible (acceptable for this use case)
- **Read-only mode** = No engagement, just monitoring
- **Saudi focus** = All searches geo-targeted when possible
- **Daily cadence** = Consistent but not excessive
- **Human review** = I analyze patterns, flag opportunities for team

---

**Status:** Ready to build
**Next:** Create LinkedIn account → Install library → Build scripts → Test → Deploy
