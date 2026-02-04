#!/usr/bin/env python3
"""Test Google API access."""

import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

TOKEN_FILE = '/root/.openclaw/workspace/config/google-token.json'

def get_creds():
    with open(TOKEN_FILE, 'r') as f:
        token_data = json.load(f)
    return Credentials(
        token=token_data['token'],
        refresh_token=token_data['refresh_token'],
        token_uri=token_data['token_uri'],
        client_id=token_data['client_id'],
        client_secret=token_data['client_secret'],
        scopes=token_data['scopes']
    )

def test_gmail():
    creds = get_creds()
    service = build('gmail', 'v1', credentials=creds)
    profile = service.users().getProfile(userId='me').execute()
    print(f"Gmail: {profile['emailAddress']} ({profile['messagesTotal']} messages)")
    return True

def test_calendar():
    creds = get_creds()
    service = build('calendar', 'v3', credentials=creds)
    calendars = service.calendarList().list().execute()
    print(f"Calendar: {len(calendars.get('items', []))} calendars found")
    for cal in calendars.get('items', [])[:3]:
        print(f"  - {cal['summary']}")
    return True

if __name__ == '__main__':
    print("Testing Google API access...\n")
    try:
        test_gmail()
        print()
        test_calendar()
        print("\n✓ All tests passed!")
    except Exception as e:
        print(f"Error: {e}")
