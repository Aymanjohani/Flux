#!/usr/bin/env python3
"""Get upcoming calendar events."""

import json
from datetime import datetime, timedelta
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

def get_upcoming_events(max_results=5):
    creds = get_creds()
    service = build('calendar', 'v3', credentials=creds)
    
    now = datetime.utcnow().isoformat() + 'Z'
    
    events_result = service.events().list(
        calendarId='primary',
        timeMin=now,
        maxResults=max_results,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    
    result = []
    for event in events:
        start = event['start'].get('dateTime', event['start'].get('date'))
        result.append({
            'summary': event.get('summary', '(No title)'),
            'start': start,
            'location': event.get('location', '')
        })
    
    return result

if __name__ == '__main__':
    events = get_upcoming_events(5)
    if not events:
        print("No upcoming events")
    else:
        for e in events:
            print(f"📅 {e['summary']}")
            print(f"   {e['start']}")
            if e['location']:
                print(f"   📍 {e['location']}")
            print()
