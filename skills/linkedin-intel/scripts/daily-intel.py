#!/usr/bin/env python3
"""
Daily LinkedIn intelligence gathering using browser automation
Focuses on SME prospects, competitors, and partners in Saudi industrial sector
"""

import json
import sys
import time
import random
from pathlib import Path
from datetime import datetime, timezone
import re

# Add parent to path for shared modules
sys.path.insert(0, str(Path(__file__).parent))

try:
    from lib.browser_client import LinkedInBrowser
    from lib.opportunity_detector import OpportunityDetector
    from lib.rate_limiter import RateLimiter
except ImportError:
    print("⚠️  Library modules not yet created. Creating them now...")
    # We'll create these next

def load_config():
    """Load targets and configuration"""
    config_path = Path(__file__).parent.parent / "config" / "targets.json"
    with open(config_path) as f:
        return json.load(f)

def load_credentials():
    """Load LinkedIn credentials"""
    creds_path = Path(__file__).parent.parent / "config" / "credentials.json"
    with open(creds_path) as f:
        return json.load(f)

def main():
    """Run daily intelligence gathering"""
    print("🚀 LinkedIn Daily Intelligence")
    print("=" * 60)
    print(f"📅 Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print()
    
    # Load configuration
    print("📋 Loading configuration...")
    config = load_config()
    creds = load_credentials()
    
    # Initialize components
    print("🌐 Initializing browser...")
    browser = LinkedInBrowser(creds)
    rate_limiter = RateLimiter(max_requests_per_hour=50)
    detector = OpportunityDetector(config)
    
    # Login
    print("🔐 Logging into LinkedIn...")
    if not browser.login():
        print("❌ Login failed. Check credentials or manual verification needed.")
        return 1
    
    print("✅ Login successful\n")
    
    # Collect intelligence
    opportunities = []
    market_data = {
        'hashtag_volumes': {},
        'company_activity': {},
        'people_moves': [],
        'competitor_intel': []
    }
    
    # 1. Search primary hashtags
    print("🔍 Phase 1: Hashtag Monitoring")
    print("-" * 60)
    
    for hashtag in config['hashtags']['primary_saudi'][:3]:  # Start with top 3
        rate_limiter.wait()
        print(f"  Searching: {hashtag}")
        
        posts = browser.search_hashtag(hashtag, limit=10)
        market_data['hashtag_volumes'][hashtag] = len(posts)
        
        # Analyze posts for opportunities
        for post in posts:
            opp = detector.analyze_post(post, source=f"hashtag:{hashtag}")
            if opp:
                opportunities.append(opp)
        
        print(f"    Found {len(posts)} posts")
        time.sleep(random.uniform(2, 5))  # Human-like delay
    
    print()
    
    # 2. Monitor target companies (SME prospects)
    print("🏭 Phase 2: Company Monitoring (SME Prospects)")
    print("-" * 60)
    
    companies = config['target_categories']['potential_clients']['companies'][:5]
    for company_name in companies:
        rate_limiter.wait()
        print(f"  Checking: {company_name}")
        
        posts = browser.get_company_posts(company_name, limit=5)
        market_data['company_activity'][company_name] = {
            'post_count': len(posts),
            'topics': []
        }
        
        for post in posts:
            opp = detector.analyze_post(post, source=f"company:{company_name}")
            if opp:
                opportunities.append(opp)
        
        print(f"    {len(posts)} recent posts")
        time.sleep(random.uniform(3, 6))
    
    print()
    
    # 3. Monitor competitors
    print("⚔️  Phase 3: Competitor Monitoring")
    print("-" * 60)
    
    competitors = config['target_categories']['competitors']['companies'][:3]
    for competitor in competitors:
        rate_limiter.wait()
        print(f"  Tracking: {competitor}")
        
        posts = browser.get_company_posts(competitor, limit=3)
        
        for post in posts:
            intel = detector.analyze_competitor_post(post, competitor)
            if intel:
                market_data['competitor_intel'].append(intel)
        
        print(f"    {len(posts)} posts analyzed")
        time.sleep(random.uniform(3, 6))
    
    print()
    
    # Generate report
    print("📝 Generating intelligence report...")
    report = generate_report(opportunities, market_data, config)
    
    # Save report
    output_dir = Path(__file__).parent.parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    report_path = output_dir / f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}-intel.md"
    with open(report_path, 'w') as f:
        f.write(report)
    
    print(f"✅ Report saved: {report_path}")
    print()
    
    # Summary
    print("📊 Summary:")
    print(f"   🎯 High-priority opportunities: {len([o for o in opportunities if o['priority'] == 'high'])}")
    print(f"   📈 Medium-priority leads: {len([o for o in opportunities if o['priority'] == 'medium'])}")
    print(f"   ⚔️  Competitor activities tracked: {len(market_data['competitor_intel'])}")
    print()
    print("✅ Daily intelligence gathering complete!")
    
    return 0

def generate_report(opportunities, market_data, config):
    """Generate markdown intelligence report"""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    report = f"""# LinkedIn Intelligence Report — {today}

**Focus:** SME manufacturers in Saudi industrial sector  
**Targets:** Digital transformation prospects, competitors, partners

---

## 🎯 High Priority Opportunities

"""
    
    # High priority opportunities
    high_pri = [o for o in opportunities if o['priority'] == 'high']
    if high_pri:
        for opp in high_pri[:5]:  # Top 5
            report += f"""### {opp['company']} - {opp['signal_type']}

**Source:** [{opp['source']}]({opp['url']})  
**Author:** {opp.get('author', 'Unknown')}  
**Signal:** {opp['signal']}  
**Why it matters:** {opp['reason']}

**Recommended Action:** {opp['action']}

---

"""
    else:
        report += "_No high-priority opportunities detected today._\n\n"
    
    report += """---

## 📊 Market Intelligence

"""
    
    # Hashtag volumes
    if market_data['hashtag_volumes']:
        report += "### Hashtag Activity\n\n"
        for tag, count in market_data['hashtag_volumes'].items():
            report += f"- **{tag}**: {count} posts\n"
        report += "\n"
    
    # Company activity
    if market_data['company_activity']:
        report += "### Company Activity (Target Prospects)\n\n"
        for company, data in market_data['company_activity'].items():
            report += f"**{company}**\n"
            report += f"  - Posts this period: {data['post_count']}\n"
            if data['topics']:
                report += f"  - Topics: {', '.join(data['topics'][:3])}\n"
            report += "\n"
    
    report += """---

## ⚔️ Competitor Intelligence

"""
    
    if market_data['competitor_intel']:
        for intel in market_data['competitor_intel']:
            report += f"""### {intel['competitor']}

- **Activity:** {intel['activity_type']}
- **Details:** {intel['details']}
- **Impact:** {intel['impact']}

"""
    else:
        report += "_No significant competitor activity detected._\n\n"
    
    report += """---

## 📈 Medium Priority Leads

"""
    
    med_pri = [o for o in opportunities if o['priority'] == 'medium']
    if med_pri:
        for opp in med_pri[:5]:
            report += f"- **{opp['company']}** - {opp['signal']} ([source]({opp['url']}))\n"
        report += "\n"
    else:
        report += "_None detected._\n\n"
    
    report += """---

## 💡 Action Items

"""
    
    # Generate action items from opportunities
    actions = set()
    for opp in high_pri[:3]:
        actions.add(f"Research {opp['company']} - {opp['signal_type']}")
    
    if actions:
        for i, action in enumerate(actions, 1):
            report += f"{i}. {action}\n"
    else:
        report += "_No immediate actions required._\n"
    
    report += f"""

---

_Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}_  
_Next run: Tomorrow, 9 AM Riyadh time_
"""
    
    return report

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
