"""
LinkedIn API client wrapper with rate limiting
"""
import json
from pathlib import Path
from linkedin_api import Linkedin

class LinkedInClient:
    def __init__(self, credentials_path, rate_limiter):
        self.credentials_path = Path(credentials_path)
        self.rate_limiter = rate_limiter
        self.api = None
        self._authenticated = False
    
    def authenticate(self):
        """Authenticate with LinkedIn"""
        if self._authenticated:
            return True
        
        if not self.credentials_path.exists():
            raise FileNotFoundError(f"Credentials not found: {self.credentials_path}")
        
        with open(self.credentials_path) as f:
            creds = json.load(f)
        
        try:
            self.api = Linkedin(creds["email"], creds["password"])
            self._authenticated = True
            return True
        except Exception as e:
            print(f"Authentication failed: {e}")
            return False
    
    def _rate_limited_call(self, func, *args, **kwargs):
        """Execute API call with rate limiting"""
        # Check limits before call
        ok, msg = self.rate_limiter.check_limits()
        if not ok:
            raise Exception(f"Rate limit exceeded: {msg}")
        
        # Wait with human-like delay
        self.rate_limiter.wait()
        
        # Make the call
        try:
            result = func(*args, **kwargs)
            self.rate_limiter.record_request()
            return result
        except Exception as e:
            # Still record the request (failed requests count too)
            self.rate_limiter.record_request()
            raise e
    
    def search_posts(self, query, limit=10):
        """Search LinkedIn posts by keyword or hashtag"""
        if not self._authenticated:
            raise Exception("Not authenticated. Call authenticate() first.")
        
        try:
            # linkedin-api search_posts method
            results = self._rate_limited_call(
                self.api.search_posts,
                keywords=query,
                limit=limit
            )
            
            # Parse and normalize results
            posts = []
            for item in results or []:
                posts.append({
                    "id": item.get("dashEntityUrn", ""),
                    "text": item.get("commentary", {}).get("text", ""),
                    "author": item.get("actor", {}).get("name", {}).get("text", "Unknown"),
                    "author_title": item.get("actor", {}).get("description", {}).get("text", ""),
                    "url": self._get_post_url(item),
                    "created_at": item.get("actor", {}).get("subDescription", {}).get("text", ""),
                    "likes": item.get("socialDetail", {}).get("totalSocialActivityCounts", {}).get("numLikes", 0),
                    "comments": item.get("socialDetail", {}).get("totalSocialActivityCounts", {}).get("numComments", 0),
                })
            
            return posts
        except Exception as e:
            print(f"Search failed for '{query}': {e}")
            return []
    
    def get_company_updates(self, company_id, limit=5):
        """Get recent posts from a company page"""
        if not self._authenticated:
            raise Exception("Not authenticated. Call authenticate() first.")
        
        try:
            # Get company posts
            updates = self._rate_limited_call(
                self.api.get_company_updates,
                public_id=company_id,
                max_results=limit
            )
            
            # Parse and normalize
            posts = []
            for update in updates or []:
                posts.append({
                    "id": update.get("updateMetadata", {}).get("urn", ""),
                    "text": update.get("commentary", ""),
                    "author": company_id,
                    "author_title": "Company",
                    "url": self._get_update_url(update),
                    "created_at": update.get("actor", {}).get("subDescription", {}).get("text", ""),
                    "likes": 0,  # Not always available in company updates
                    "comments": 0,
                })
            
            return posts
        except Exception as e:
            print(f"Company updates failed for '{company_id}': {e}")
            return []
    
    def get_profile(self, profile_id):
        """Get a LinkedIn profile"""
        if not self._authenticated:
            raise Exception("Not authenticated. Call authenticate() first.")
        
        try:
            profile = self._rate_limited_call(
                self.api.get_profile,
                public_id=profile_id
            )
            return profile
        except Exception as e:
            print(f"Profile fetch failed for '{profile_id}': {e}")
            return None
    
    def search_people(self, keywords, limit=10):
        """Search for people by keywords"""
        if not self._authenticated:
            raise Exception("Not authenticated. Call authenticate() first.")
        
        try:
            results = self._rate_limited_call(
                self.api.search_people,
                keywords=keywords,
                limit=limit
            )
            return results or []
        except Exception as e:
            print(f"People search failed for '{keywords}': {e}")
            return []
    
    def _get_post_url(self, post):
        """Extract post URL from post object"""
        urn = post.get("dashEntityUrn", "")
        if "urn:li:activity:" in urn:
            activity_id = urn.split("urn:li:activity:")[-1]
            return f"https://www.linkedin.com/feed/update/urn:li:activity:{activity_id}/"
        return ""
    
    def _get_update_url(self, update):
        """Extract URL from company update"""
        urn = update.get("updateMetadata", {}).get("urn", "")
        if urn:
            return f"https://www.linkedin.com/feed/update/{urn}/"
        return ""
