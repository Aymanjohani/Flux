"""
Opportunity detection and classification for LinkedIn posts
Identifies potential clients, competitor activity, and partnership opportunities
"""

import re
from typing import Dict, Optional, List

class OpportunityDetector:
    """Detect and classify business opportunities from LinkedIn content"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.hot_signals = config['priority_signals']['hot_leads']
        self.medium_signals = config['priority_signals']['medium_priority']
        self.sme_indicators = config['target_categories']['potential_clients']['signals']
    
    def analyze_post(self, post: Dict, source: str) -> Optional[Dict]:
        """Analyze a post for opportunities"""
        content = post.get('content', '').lower()
        
        # Check for hot lead signals
        for signal in self.hot_signals:
            if signal.lower() in content:
                return self._create_opportunity(
                    post=post,
                    priority='high',
                    signal_type='Direct Need',
                    signal=signal,
                    reason=f"Explicitly mentioned: {signal}",
                    action="Immediate outreach - research company and prepare solution proposal",
                    source=source
                )
        
        # Check for SME indicators + technology interest
        sme_score = self._score_sme_fit(content)
        tech_score = self._score_tech_interest(content)
        
        if sme_score >= 2 and tech_score >= 1:
            return self._create_opportunity(
                post=post,
                priority='high',
                signal_type='SME Digital Transformation',
                signal=f"SME showing interest in digital transformation",
                reason=f"SME indicators ({sme_score}/5) + technology interest ({tech_score}/5)",
                action="Research company size and operations, assess fit for IIoT solutions",
                source=source
            )
        
        # Check for medium priority signals
        for signal in self.medium_signals:
            if signal.lower() in content:
                return self._create_opportunity(
                    post=post,
                    priority='medium',
                    signal_type='Growth Signal',
                    signal=signal,
                    reason=f"Company growth/change indicator: {signal}",
                    action="Monitor for 2-3 weeks, track additional signals",
                    source=source
                )
        
        return None
    
    def analyze_competitor_post(self, post: Dict, competitor: str) -> Optional[Dict]:
        """Analyze competitor activity"""
        content = post.get('content', '').lower()
        
        intel = {
            'competitor': competitor,
            'url': post.get('url', ''),
            'timestamp': post.get('timestamp'),
            'activity_type': 'Unknown',
            'details': '',
            'impact': 'Low'
        }
        
        # Project win
        project_keywords = ['proud to announce', 'successfully implemented', 'completed project', 'partnership with']
        for keyword in project_keywords:
            if keyword in content:
                intel['activity_type'] = 'Project Win'
                intel['details'] = f"Announced project/partnership (mentioned: '{keyword}')"
                intel['impact'] = 'Medium - Monitor client, assess competitive positioning'
                return intel
        
        # New product/service
        product_keywords = ['launching', 'new solution', 'introducing', 'now offering']
        for keyword in product_keywords:
            if keyword in content:
                intel['activity_type'] = 'Product Launch'
                intel['details'] = f"New offering announced ('{keyword}')"
                intel['impact'] = 'Medium - Evaluate feature comparison'
                return intel
        
        # Generic activity
        intel['activity_type'] = 'General Activity'
        intel['details'] = 'Regular marketing/thought leadership content'
        intel['impact'] = 'Low - No immediate action needed'
        
        return intel
    
    def _score_sme_fit(self, content: str) -> int:
        """Score how well content matches SME profile (0-5)"""
        score = 0
        
        sme_keywords = [
            'small business', 'medium enterprise', 'sme', 'growing company',
            'family business', 'local manufacturer', 'regional producer'
        ]
        
        for keyword in sme_keywords:
            if keyword in content:
                score += 1
        
        # Size indicators
        if re.search(r'\b(50|100|200|300|400|500)\s*(employees|staff|team)', content):
            score += 1
        
        # Pain points common to SMEs
        pain_keywords = ['manual process', 'spreadsheet', 'paper-based', 'efficiency', 'visibility']
        for keyword in pain_keywords:
            if keyword in content:
                score += 0.5
        
        return min(int(score), 5)
    
    def _score_tech_interest(self, content: str) -> int:
        """Score technology/digitalization interest (0-5)"""
        score = 0
        
        tech_keywords = [
            'digital transformation', 'industry 4.0', 'smart factory', 'automation',
            'mes', 'scada', 'iiot', 'iot', 'cloud', 'data analytics', 'real-time',
            'monitoring', 'erp integration', 'digitalization'
        ]
        
        for keyword in tech_keywords:
            if keyword in content:
                score += 1
        
        return min(score, 5)
    
    def _create_opportunity(self, post: Dict, priority: str, signal_type: str, 
                           signal: str, reason: str, action: str, source: str) -> Dict:
        """Create standardized opportunity object"""
        return {
            'priority': priority,
            'signal_type': signal_type,
            'signal': signal,
            'reason': reason,
            'action': action,
            'source': source,
            'url': post.get('url', ''),
            'author': post.get('author', 'Unknown'),
            'company': post.get('company', 'Unknown'),
            'timestamp': post.get('timestamp'),
            'content_preview': post.get('content', '')[:200]
        }
