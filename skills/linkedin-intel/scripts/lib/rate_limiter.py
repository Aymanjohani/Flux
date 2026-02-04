"""
Rate limiting to avoid LinkedIn anti-automation detection
"""

import time
import random
from collections import deque
from datetime import datetime, timedelta

class RateLimiter:
    """Enforce rate limits with human-like delays"""
    
    def __init__(self, max_requests_per_hour: int = 50):
        self.max_requests_per_hour = max_requests_per_hour
        self.request_times = deque()
        self.min_delay = 3  # Minimum seconds between requests
        self.max_delay = 8  # Maximum seconds between requests
    
    def wait(self):
        """Wait appropriate time before next request"""
        now = datetime.now()
        
        # Remove requests older than 1 hour
        cutoff = now - timedelta(hours=1)
        while self.request_times and self.request_times[0] < cutoff:
            self.request_times.popleft()
        
        # Check if we're at the limit
        if len(self.request_times) >= self.max_requests_per_hour:
            # Calculate how long to wait
            oldest = self.request_times[0]
            wait_until = oldest + timedelta(hours=1)
            wait_seconds = (wait_until - now).total_seconds()
            
            if wait_seconds > 0:
                print(f"⏳ Rate limit reached. Waiting {int(wait_seconds)}s...")
                time.sleep(wait_seconds)
        
        # Human-like random delay
        delay = random.uniform(self.min_delay, self.max_delay)
        time.sleep(delay)
        
        # Record this request
        self.request_times.append(datetime.now())
    
    def get_stats(self) -> dict:
        """Get current rate limiting stats"""
        now = datetime.now()
        cutoff = now - timedelta(hours=1)
        
        recent_requests = [t for t in self.request_times if t > cutoff]
        
        return {
            'requests_last_hour': len(recent_requests),
            'limit': self.max_requests_per_hour,
            'remaining': self.max_requests_per_hour - len(recent_requests)
        }
