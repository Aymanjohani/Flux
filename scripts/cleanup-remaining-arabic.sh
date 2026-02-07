#!/bin/bash
# Fix remaining Arabic region variations

declare -A REGIONS=(
  ["المنطقة الشرقية"]="Eastern Province"
  ["منطقة مكة"]="Makkah"
  ["مكة المكرمة"]="Makkah"
  ["منطقة الرياض"]="Riyadh"
  ["الرياض"]="Riyadh"
  ["المدينة المنورة"]="Madinah"
  ["منطقة المدينة"]="Madinah"
)

TOTAL=0

for arabic in "${!REGIONS[@]}"; do
  english="${REGIONS[$arabic]}"
  updated=0
  
  while true; do
    SEARCH_RESULT=$(curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"filterGroups":[{"filters":[{"propertyName":"state","operator":"EQ","value":"'"$arabic"'"}]}],"limit":100,"properties":["state"]}' \
      "https://api.hubapi.com/crm/v3/objects/companies/search")
    
    COUNT=$(echo "$SEARCH_RESULT" | jq -r '.results | length')
    
    if [ "$COUNT" -eq "0" ]; then
      break
    fi
    
    BATCH_INPUT=$(echo "$SEARCH_RESULT" | jq -c '{inputs: [.results[] | {id: .id, properties: {state: "'"$english"'"}}]}')
    
    curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$BATCH_INPUT" \
      "https://api.hubapi.com/crm/v3/objects/companies/batch/update" > /dev/null
    
    updated=$((updated + COUNT))
    echo "✅ $arabic → $english: $COUNT (Total: $updated)"
    
    sleep 0.3
  done
  
  if [ "$updated" -gt "0" ]; then
    TOTAL=$((TOTAL + updated))
  fi
done

echo ""
echo "✅ Complete! Total updated: $TOTAL"
