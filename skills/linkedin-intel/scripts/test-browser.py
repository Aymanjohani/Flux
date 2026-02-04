#!/usr/bin/env python3
"""
Test browser-based LinkedIn access
Simpler than daily-intel.py for initial testing
"""

import json
import sys
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).parent))

from lib.browser_client import LinkedInBrowser

def load_credentials():
    """Load LinkedIn credentials"""
    creds_path = Path(__file__).parent.parent / "config" / "credentials.json"
    with open(creds_path) as f:
        return json.load(f)

def main():
    print("🧪 Testing LinkedIn Browser Automation")
    print("=" * 50)
    
    # Load credentials
    print("📋 Loading credentials...")
    creds = load_credentials()
    print(f"   Email: {creds['email']}")
    
    # Initialize browser
    print("\n🌐 Initializing browser...")
    browser = LinkedInBrowser(creds)
    
    # Attempt login
    print("🔐 Attempting login via browser automation...")
    print("   (This may take 10-15 seconds...)")
    
    if browser.login():
        print("✅ Login successful!")
        print("\n🎉 Browser automation is working!")
        print("   Ready to run daily intelligence gathering.")
        return 0
    else:
        print("❌ Login failed")
        print("\nPossible issues:")
        print("- Browser not starting (check: openclaw browser --action status)")
        print("- Credentials incorrect")
        print("- LinkedIn requiring manual verification")
        print("\nTry running manually:")
        print("  openclaw browser --action open --target-url https://www.linkedin.com")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
