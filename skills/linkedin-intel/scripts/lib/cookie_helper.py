"""
Helper to inject cookies into browser via CDP
"""

import json
import subprocess

def inject_cookies_cdp(cookies_path: str, cdp_url: str = "http://127.0.0.1:18800"):
    """Inject cookies using Chrome DevTools Protocol"""
    
    with open(cookies_path) as f:
        cookies = json.load(f)
    
    # Format cookies for CDP
    for cookie in cookies:
        # Add required fields
        if 'url' not in cookie:
            cookie['url'] = f"https://{cookie['domain'].lstrip('.')}"
        if 'secure' not in cookie:
            cookie['secure'] = True
        if 'httpOnly' not in cookie:
            cookie['httpOnly'] = False
        if 'sameSite' not in cookie:
            cookie['sameSite'] = 'Lax'
    
    # Use curl to send CDP command
    for cookie in cookies:
        cmd = [
            'curl', '-X', 'POST',
            f'{cdp_url}/json/command',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'method': 'Network.setCookie',
                'params': cookie
            })
        ]
        subprocess.run(cmd, capture_output=True)
