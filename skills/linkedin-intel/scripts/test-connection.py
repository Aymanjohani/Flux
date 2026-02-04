#!/usr/bin/env python3
"""
Test LinkedIn connection with stored credentials
"""

import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from linkedin_api import Linkedin
except ImportError:
    print("❌ linkedin-api not installed. Run:")
    print("   cd /root/.openclaw/workspace/skills/linkedin-intel")
    print("   source venv/bin/activate")
    print("   pip install linkedin-api")
    sys.exit(1)

def load_credentials():
    """Load credentials from config file"""
    creds_path = Path(__file__).parent.parent / "config" / "credentials.json"
    
    if not creds_path.exists():
        print(f"❌ Credentials file not found: {creds_path}")
        sys.exit(1)
    
    with open(creds_path) as f:
        return json.load(f)

def test_connection():
    """Test LinkedIn login and basic profile access"""
    print("🔄 Loading credentials...")
    creds = load_credentials()
    
    print(f"📧 Email: {creds['email']}")
    print("🔐 Password: {'*' * len(creds['password'])}")
    
    print("\n🔄 Attempting login...")
    try:
        api = Linkedin(creds['email'], creds['password'])
        print("✅ Login successful!")
        
        # Test basic profile access
        print("\n🔄 Testing profile access...")
        profile = api.get_user_profile()
        
        if profile:
            print(f"✅ Profile loaded successfully")
            print(f"   Name: {profile.get('firstName', '')} {profile.get('lastName', '')}")
            print(f"   Profile ID: {profile.get('public_id', 'N/A')}")
        else:
            print("⚠️  Login succeeded but profile is empty")
        
        print("\n✅ All tests passed! LinkedIn integration is working.")
        return True
        
    except Exception as e:
        print(f"❌ Login failed: {e}")
        print("\nPossible issues:")
        print("- Wrong credentials")
        print("- LinkedIn detected automation (CAPTCHA required)")
        print("- Account temporarily restricted")
        print("- Network/proxy issues")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
