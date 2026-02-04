#!/usr/bin/env python3
"""Google OAuth2 authentication helper for headless servers."""

import json
import sys
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar'
]

CREDENTIALS_FILE = '/root/.openclaw/workspace/config/google-oauth-credentials.json'
TOKEN_FILE = '/root/.openclaw/workspace/config/google-token.json'

def get_auth_url():
    """Generate authorization URL for user to visit."""
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    flow.redirect_uri = 'http://localhost:8080/'
    
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    return auth_url

def complete_auth(auth_code):
    """Complete auth flow with the authorization code."""
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    flow.redirect_uri = 'http://localhost:8080/'
    
    flow.fetch_token(code=auth_code)
    creds = flow.credentials
    
    # Save token
    token_data = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }
    
    with open(TOKEN_FILE, 'w') as f:
        json.dump(token_data, f, indent=2)
    
    print(f"Token saved to {TOKEN_FILE}")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python google_auth.py [url|complete <code>]")
        sys.exit(1)
    
    if sys.argv[1] == 'url':
        print(get_auth_url())
    elif sys.argv[1] == 'complete' and len(sys.argv) > 2:
        complete_auth(sys.argv[2])
    else:
        print("Invalid command")
