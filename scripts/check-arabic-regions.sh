#!/bin/bash
# Check for Arabic region names in HubSpot

echo "Checking for Arabic region names..."
echo ""

# Saudi regions in Arabic
regions=(
  "منطقة مكة المكرمة"
  "منطقة الشرقية"
  "منطقة المدينة المنورة"
  "منطقة عسير"
  "منطقة جازان"
  "منطقة القصيم"
  "منطقة حائل"
  "منطقة تبوك"
  "منطقة الجوف"
  "منطقة الباحة"
  "منطقة نجران"
  "منطقة الحدود الشمالية"
)

for region in "${regions[@]}"; do
  count=$(curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"filterGroups":[{"filters":[{"propertyName":"state","operator":"EQ","value":"'"$region"'"}]}],"limit":1}' \
    "https://api.hubapi.com/crm/v3/objects/companies/search" | jq -r '.total')
  
  if [ "$count" != "0" ]; then
    echo "✓ $region: $count companies"
  fi
done

echo ""
echo "Done!"
