#!/usr/bin/env python3
"""Get recent emails summary."""

import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64

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

def get_recent_emails(max_results=5):
    creds = get_creds()
    service = build('gmail', 'v1', credentials=creds)
    
    # Get recent messages
    results = service.users().messages().list(
        userId='me', 
        maxResults=max_results,
        labelIds=['INBOX']
    ).execute()
    
    messages = results.get('messages', [])
    
    emails = []
    for msg in messages:
        msg_data = service.users().messages().get(
            userId='me', 
            id=msg['id'],
            format='metadata',
            metadataHeaders=['From', 'Subject', 'Date']
        ).execute()
        
        headers = {h['name']: h['value'] for h in msg_data['payload']['headers']}
        emails.append({
            'from': headers.get('From', 'Unknown'),
            'subject': headers.get('Subject', '(no subject)'),
            'date': headers.get('Date', ''),
            'unread': 'UNREAD' in msg_data.get('labelIds', [])
        })
    
    return emails

if __name__ == '__main__':
    emails = get_recent_emails(5)
    for i, e in enumerate(emails, 1):
        status = '🔵' if e['unread'] else '⚪'
        print(f"{status} {i}. {e['subject'][:50]}")
        print(f"   From: {e['from'][:40]}")
        print()
