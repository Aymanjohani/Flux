#!/usr/bin/env python3
"""
LinkedIn intelligence gathering using browser automation
More reliable than API library for avoiding bans
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import subprocess

def run_browser_command(action_data):
    """Run OpenClaw browser command via CLI"""
    cmd = [
        'openclaw', 'browser',
        '--action', action_data['action'],
        '--profile', 'openclaw'
    ]
    
    if 'targetUrl' in action_data:
        cmd.extend(['--target-url', action_data['targetUrl']])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

def search_hashtag(hashtag):
    """Search for a hashtag on LinkedIn"""
    # Clean hashtag
    tag = hashtag.strip('#')
    url = f"https://www.linkedin.com/search/results/content/?keywords=%23{tag}&origin=GLOBAL_SEARCH_HEADER"
    
    print(f"🔍 Searching: #{tag}")
    
    # Navigate to search
    run_browser_command({
        'action': 'open',
        'targetUrl': url
    })
    
    # Wait for results to load
    import time
    time.sleep(3)
    
    # Take snapshot
    result = run_browser_command({
        'action': 'snapshot'
    })
    
    return result

def main():
    print("🚀 LinkedIn Browser Intelligence")
    print("=" * 50)
    
    # Load targets
    config_path = Path(__file__).parent.parent / "config" / "targets.json"
    with open(config_path) as f:
        targets = json.load(f)
    
    # Test with one hashtag
    test_tag = targets['hashtags']['primary_saudi'][0]
    print(f"\n📊 Testing with: {test_tag}")
    
    result = search_hashtag(test_tag)
    print(result)

if __name__ == "__main__":
    main()
