#!/bin/bash

IDS=(
  "386418287828"  # Worked by Firas but the comment in company
  "386239042772"  # Done
  "386371498189"  # Not worked
)

echo "Deleting bad company records..."

for id in "${IDS[@]}"; do
  response=$(curl -s -X DELETE \
    -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    "https://api.hubapi.com/crm/v3/objects/companies/$id")
  
  if [ -z "$response" ]; then
    echo "✅ Deleted: $id"
  else
    echo "❌ Error deleting $id: $response"
  fi
  
  sleep 0.2
done

echo ""
echo "=== Complete ==="
