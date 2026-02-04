"""
LinkedIn browser automation client using OpenClaw browser tool
"""

import subprocess
import json
import time
import random
from typing import List, Dict, Optional

class LinkedInBrowser:
    """Browser automation for LinkedIn intelligence gathering"""
    
    def __init__(self, credentials: Dict[str, str]):
        self.email = credentials['email']
        self.password = credentials['password']
        self.logged_in = False
        self.profile = 'openclaw'
    
    def _browser_command(self, action: str, **kwargs) -> Dict:
        """Execute OpenClaw browser command"""
        cmd = ['openclaw', 'browser', '--action', action, '--profile', self.profile]
        
        for key, value in kwargs.items():
            if value is not None:
                # Convert Python naming to CLI flags
                flag = '--' + key.replace('_', '-')
                cmd.extend([flag, str(value)])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {'error': result.stdout or result.stderr}
    
    def login(self) -> bool:
        """Login to LinkedIn using cookies"""
        try:
            # Check if cookies file exists
            from pathlib import Path
            cookies_path = Path(__file__).parent.parent.parent / "config" / "cookies.json"
            
            if cookies_path.exists():
                print("   Using cookie-based authentication...")
                return self._login_with_cookies(cookies_path)
            else:
                print("   No cookies found, trying username/password...")
                return self._login_with_credentials()
            
        except Exception as e:
            print(f"Login error: {e}")
            return False
    
    def _login_with_cookies(self, cookies_path) -> bool:
        """Login using saved cookies"""
        try:
            # First navigate to LinkedIn
            self._browser_command('open', target_url='https://www.linkedin.com')
            time.sleep(1)
            
            # Load cookies from file
            with open(cookies_path) as f:
                cookies = json.load(f)
            
            # Inject cookies using evaluate
            for cookie in cookies:
                cookie_str = f"{cookie['name']}={cookie['value']}"
                self._browser_command('act', request=json.dumps({
                    'kind': 'evaluate',
                    'fn': f'document.cookie = "{cookie_str}; domain={cookie["domain"]}; path=/"'
                }))
            
            time.sleep(1)
            
            # Navigate to feed to activate session
            self._browser_command('open', target_url='https://www.linkedin.com/feed/')
            time.sleep(2)
            
            # Check if logged in
            snapshot = self._browser_command('snapshot')
            current_url = snapshot.get('url', '')
            
            if 'feed' in current_url or 'checkpoint' not in current_url:
                self.logged_in = True
                print("   ✅ Cookie authentication successful!")
                return True
            
            print("   ❌ Cookie authentication failed (session may be expired)")
            return False
            
        except Exception as e:
            print(f"Cookie login error: {e}")
            return False
    
    def _login_with_credentials(self) -> bool:
        """Login using username/password"""
        try:
            # Navigate to LinkedIn login
            self._browser_command('open', target_url='https://www.linkedin.com/login')
            time.sleep(2)
            
            # Take snapshot to see login form
            snapshot = self._browser_command('snapshot')
            
            # Type email
            self._browser_command('act', request=json.dumps({
                'kind': 'fill',
                'selector': '#username',
                'text': self.email
            }))
            
            # Type password
            self._browser_command('act', request=json.dumps({
                'kind': 'fill',
                'selector': '#password',
                'text': self.password
            }))
            
            # Click login button
            self._browser_command('act', request=json.dumps({
                'kind': 'click',
                'selector': 'button[type="submit"]'
            }))
            
            time.sleep(3)
            
            # Check if logged in (look for feed or profile link)
            snapshot = self._browser_command('snapshot')
            
            # Simple check: if we're on feed, login succeeded
            current_url = snapshot.get('url', '')
            if 'feed' in current_url or 'mynetwork' in current_url:
                self.logged_in = True
                return True
            
            return False
            
        except Exception as e:
            print(f"Credential login error: {e}")
            return False
    
    def search_hashtag(self, hashtag: str, limit: int = 10) -> List[Dict]:
        """Search for posts with a specific hashtag"""
        if not self.logged_in:
            return []
        
        # Clean hashtag
        tag = hashtag.strip('#')
        url = f"https://www.linkedin.com/search/results/content/?keywords=%23{tag}&origin=GLOBAL_SEARCH_HEADER"
        
        self._browser_command('open', target_url=url)
        time.sleep(random.uniform(2, 4))
        
        # Scroll to load more results
        for _ in range(2):
            self._browser_command('act', request=json.dumps({
                'kind': 'evaluate',
                'fn': 'window.scrollBy(0, 800)'
            }))
            time.sleep(1)
        
        # Get page snapshot
        snapshot = self._browser_command('snapshot')
        
        # Extract posts from snapshot
        posts = self._extract_posts_from_snapshot(snapshot, hashtag)
        
        return posts[:limit]
    
    def get_company_posts(self, company_name: str, limit: int = 5) -> List[Dict]:
        """Get recent posts from a company page"""
        if not self.logged_in:
            return []
        
        # Search for company
        search_url = f"https://www.linkedin.com/search/results/companies/?keywords={company_name}"
        self._browser_command('open', target_url=search_url)
        time.sleep(random.uniform(2, 3))
        
        # Click first result (usually the exact match)
        snapshot = self._browser_command('snapshot')
        
        # Try to navigate to company page
        # This is simplified - in production we'd parse the search results
        # For now, construct likely URL
        company_slug = company_name.lower().replace(' ', '-').replace(',', '')
        company_url = f"https://www.linkedin.com/company/{company_slug}/posts/"
        
        self._browser_command('open', target_url=company_url)
        time.sleep(random.uniform(2, 4))
        
        # Scroll to load posts
        for _ in range(2):
            self._browser_command('act', request=json.dumps({
                'kind': 'evaluate',
                'fn': 'window.scrollBy(0, 600)'
            }))
            time.sleep(1)
        
        # Get posts
        snapshot = self._browser_command('snapshot')
        posts = self._extract_posts_from_snapshot(snapshot, f"company:{company_name}")
        
        return posts[:limit]
    
    def _extract_posts_from_snapshot(self, snapshot: Dict, source: str) -> List[Dict]:
        """Extract post data from browser snapshot"""
        posts = []
        
        # This is a simplified extraction
        # In production, we'd parse the HTML more carefully
        content = snapshot.get('content', '')
        url = snapshot.get('url', '')
        
        # For now, create a single post entry with the snapshot
        # This will be improved once we see actual LinkedIn page structure
        post = {
            'source': source,
            'url': url,
            'content': content[:500],  # First 500 chars
            'timestamp': time.time(),
            'author': 'Unknown',  # Will extract from actual HTML
            'company': 'Unknown'
        }
        
        posts.append(post)
        
        return posts
    
    def close(self):
        """Close browser session"""
        try:
            self._browser_command('close')
        except:
            pass
