#!/usr/bin/env python3
"""
Test LinkedIn access with Playwright and cookies
"""

import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

def load_cookies():
    """Load cookies from config"""
    cookies_path = Path(__file__).parent.parent / "config" / "cookies.json"
    with open(cookies_path) as f:
        cookies = json.load(f)
    
    # Convert to Playwright format
    playwright_cookies = []
    for cookie in cookies:
        playwright_cookies.append({
            'name': cookie['name'],
            'value': cookie['value'],
            'domain': cookie['domain'],
            'path': '/',
            'secure': True,
            'httpOnly': cookie['name'] == 'li_at',  # li_at is httpOnly
            'sameSite': 'Lax'
        })
    
    return playwright_cookies

def main():
    print("🧪 Testing LinkedIn with Playwright + Cookies")
    print("=" * 60)
    
    # Load cookies
    print("📋 Loading cookies...")
    cookies = load_cookies()
    print(f"   Loaded {len(cookies)} cookies")
    print(f"   Authentication cookie (li_at): {'✅ Found' if any(c['name'] == 'li_at' for c in cookies) else '❌ Missing'}")
    
    print("\n🌐 Starting browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        
        # Add cookies
        print("🍪 Injecting cookies...")
        context.add_cookies(cookies)
        
        # Create page and navigate
        page = context.new_page()
        
        print("🔗 Navigating to LinkedIn feed...")
        page.goto('https://www.linkedin.com/feed/', wait_until='networkidle')
        
        # Check if we're logged in
        url = page.url
        title = page.title()
        
        print(f"\n📍 Current URL: {url}")
        print(f"📄 Page title: {title}")
        
        if 'feed' in url and 'login' not in url:
            print("\n✅ SUCCESS! Logged in via cookies!")
            print("   Cookie-based authentication is working.")
            
            # Try to get some feed content
            print("\n🔍 Checking feed content...")
            try:
                # Wait for feed to load
                page.wait_for_selector('main', timeout=5000)
                print("   ✅ Feed loaded successfully")
                return 0
            except:
                print("   ⚠️  Feed structure unexpected (but logged in)")
                return 0
        else:
            print("\n❌ Login failed - redirected to login page")
            print("   Cookie may have expired or be invalid")
            return 1
        
        browser.close()

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
