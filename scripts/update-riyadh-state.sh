#!/bin/bash
# Update all companies with "منطقة الرياض" to "Riyadh"

UPDATED=0
AFTER=""

echo "🔄 Starting batch update: منطقة الرياض → Riyadh"
echo ""

while true; do
  # Build search payload
  if [ -z "$AFTER" ]; then
    PAYLOAD='{"filterGroups":[{"filters":[{"propertyName":"state","operator":"EQ","value":"منطقة الرياض"}]}],"limit":100,"properties":["name","state"]}'
  else
    PAYLOAD='{"filterGroups":[{"filters":[{"propertyName":"state","operator":"EQ","value":"منطقة الرياض"}]}],"limit":100,"properties":["name","state"],"after":"'"$AFTER"'"}'
  fi
  
  # Search for companies
  SEARCH_RESULT=$(curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "https://api.hubapi.com/crm/v3/objects/companies/search")
  
  # Get count
  COUNT=$(echo "$SEARCH_RESULT" | jq -r '.results | length')
  
  if [ "$COUNT" -eq "0" ]; then
    echo "No more companies found"
    break
  fi
  
  # Build batch update input
  BATCH_INPUT=$(echo "$SEARCH_RESULT" | jq -c '{inputs: [.results[] | {id: .id, properties: {state: "Riyadh"}}]}')
  
  # Update companies
  UPDATE_RESULT=$(curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BATCH_INPUT" \
    "https://api.hubapi.com/crm/v3/objects/companies/batch/update")
  
  UPDATED=$((UPDATED + COUNT))
  echo "✅ Updated $COUNT companies (Total: $UPDATED)"
  
  # Check for next page
  AFTER=$(echo "$SEARCH_RESULT" | jq -r '.paging.next.after // empty')
  
  if [ -z "$AFTER" ]; then
    echo "No more pages"
    break
  fi
  
  sleep 0.3  # Respect rate limits
done

echo ""
echo "✅ Complete! Updated $UPDATED companies from 'منطقة الرياض' to 'Riyadh'"
