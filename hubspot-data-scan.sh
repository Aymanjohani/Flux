#!/bin/bash

echo "🔍 HubSpot Data Quality Scan"
echo "============================="
echo ""

# Check for access token
if [ -z "$HUBSPOT_ACCESS_TOKEN" ]; then
  echo "❌ HUBSPOT_ACCESS_TOKEN not set"
  exit 1
fi

API="https://api.hubapi.com"
AUTH="Authorization: Bearer $HUBSPOT_ACCESS_TOKEN"

echo "📇 Scanning Contacts..."
contacts=$(curl -s -H "$AUTH" "$API/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,lifecyclestage,hs_lead_status,createdate,lastmodifieddate,hubspot_owner_id")
contact_count=$(echo "$contacts" | jq -r '.total // 0')
echo "   Total contacts: $contact_count"

# Analyze lifecycle stages
echo ""
echo "📊 Lifecycle Stage Distribution:"
echo "$contacts" | jq -r '.results[]?.properties.lifecyclestage // "none"' | sort | uniq -c | sort -rn | head -10

echo ""
echo "🏢 Scanning Companies..."
companies=$(curl -s -H "$AUTH" "$API/crm/v3/objects/companies?limit=100&properties=name,domain,industry,city")
company_count=$(echo "$companies" | jq -r '.total // 0')
echo "   Total companies: $company_count"

echo ""
echo "💼 Scanning Deals..."
deals=$(curl -s -H "$AUTH" "$API/crm/v3/objects/deals?limit=50&properties=dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id,createdate")
deal_count=$(echo "$deals" | jq -r '.total // 0')
echo "   Total deals: $deal_count"

# Analyze deal stages
echo ""
echo "📈 Deal Stage Distribution:"
echo "$deals" | jq -r '.results[]?.properties.dealstage // "none"' | sort | uniq -c | sort -rn

echo ""
echo "👥 Scanning Owners..."
owners=$(curl -s -H "$AUTH" "$API/crm/v3/owners")
owner_count=$(echo "$owners" | jq -r '.results | length')
echo "   Total owners: $owner_count"

# Save raw data
mkdir -p /root/.openclaw/workspace/hubspot-backup
echo "$contacts" > /root/.openclaw/workspace/hubspot-backup/contacts-raw.json
echo "$companies" > /root/.openclaw/workspace/hubspot-backup/companies-raw.json
echo "$deals" > /root/.openclaw/workspace/hubspot-backup/deals-raw.json
echo "$owners" > /root/.openclaw/workspace/hubspot-backup/owners-raw.json

echo ""
echo "✅ Scan complete. Raw data saved to hubspot-backup/"
