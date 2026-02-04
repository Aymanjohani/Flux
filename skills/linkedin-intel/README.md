# LinkedIn Intelligence

Automated LinkedIn monitoring for Saudi industrial sector opportunities.

## Quick Start

### 1. Setup

```bash
# Install dependencies
./scripts/setup.sh

# Create LinkedIn account
# Email: coding@iiotsolutions.sa
# Profile: Generic (no company link, no posting)
```

### 2. Save Credentials

```bash
# Interactive prompt (recommended)
./scripts/save-credentials.sh

# Or manually create config/credentials.json:
{
  "email": "coding@iiotsolutions.sa",
  "password": "YOUR_PASSWORD"
}
```

### 3. Test Connection

```bash
./scripts/test-connection.sh
```

### 4. Run Daily Analysis

```bash
./scripts/daily-intel.py
```

Output: `output/YYYY-MM-DD-intel.md`

## Daily Use

Integrated into HEARTBEAT.md:
- Runs automatically during morning checks (9 AM Riyadh time)
- Generates daily intelligence report
- Flags high/medium priority opportunities
- Tracks competitor activity

## Configuration

### Targets

Edit `config/targets.json`:
- Hashtags to monitor
- Companies to track
- Keywords to detect

### Rate Limits

Edit `config/rate-limits.json`:
- Requests per hour/day
- Delay between requests
- Session duration

**Critical:** Stay within limits to avoid account ban.

## Output

Daily reports include:
- 🎯 High priority opportunities (strong buying signals)
- 📋 Medium priority signals (awareness, hiring)
- 📊 Market trends (hashtag volume, topics)
- 🏭 Company activity (posts, topics)
- ⚠️ Competitor intelligence
- 💡 Action items

## Safety

**No Premium = Profile views are visible**
- People see when you view their profiles
- Acceptable for research use case
- Appears as normal LinkedIn activity

**Rate Limiting:**
- 50 requests/hour max
- 200 requests/day max
- 3-8 second delays between requests
- Human-like session behavior

**Read-Only Mode:**
- No liking, commenting, or connecting
- No posting or profile updates
- Pure monitoring only

## Commands

```bash
# Daily run (main command)
./scripts/daily-intel.py

# Setup
./scripts/setup.sh

# Save credentials
./scripts/save-credentials.sh

# Test connection
./scripts/test-connection.sh

# Search specific hashtag
./scripts/search-hashtag.py "#IndustryKSA"

# Monitor company
./scripts/company-monitor.py "maaden"
```

## Troubleshooting

**Authentication fails:**
- Check credentials in config/credentials.json
- Verify LinkedIn account is active
- Check for CAPTCHA or security challenge

**Rate limit exceeded:**
- Wait 1 hour before retry
- Adjust limits in config/rate-limits.json
- Reduce targets in config/targets.json

**Account warning/ban:**
- Stop immediately (24-48 hour pause)
- Reduce request volume by 50%
- Increase delays between requests
- If banned, create new account with different email/IP

## Files

```
skills/linkedin-intel/
├── README.md (this file)
├── SKILL.md (full documentation)
├── config/
│   ├── credentials.json (gitignored)
│   ├── targets.json (monitoring targets)
│   ├── rate-limits.json (safety limits)
│   └── rate-state.json (tracking, gitignored)
├── scripts/
│   ├── daily-intel.py (main automation)
│   ├── setup.sh (installation)
│   ├── save-credentials.sh (credential helper)
│   ├── test-connection.sh (verify setup)
│   └── lib/
│       ├── linkedin_client.py (API wrapper)
│       ├── opportunity_detector.py (pattern matching)
│       └── rate_limiter.py (safety)
├── output/
│   └── YYYY-MM-DD-intel.md (daily reports)
└── venv/ (Python environment)
```

---

**Status:** Ready for account creation and testing
**Estimated time:** 30 minutes setup + 5 minutes daily
**Risk:** Medium (account ban possible, rate limiting mitigates)
