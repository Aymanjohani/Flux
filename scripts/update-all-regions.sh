#!/bin/bash
# Update all Arabic region names to English

# Mapping: Arabic → English
declare -A REGIONS=(
  ["منطقة مكة المكرمة"]="Makkah"
  ["منطقة المدينة المنورة"]="Madinah"
  ["منطقة عسير"]="Asir"
  ["منطقة القصيم"]="Qassim"
  ["منطقة حائل"]="Hail"
  ["منطقة تبوك"]="Tabuk"
  ["منطقة الجوف"]="Al-Jouf"
  ["منطقة نجران"]="Najran"
  ["منطقة الحدود الشمالية"]="Northern Borders"
  ["الشرقية"]="Eastern Province"
)

TOTAL_UPDATED=0

echo "🔄 Starting region cleanup: Arabic → English"
echo "=============================================="
echo ""

for arabic in "${!REGIONS[@]}"; do
  english="${REGIONS[$arabic]}"
  updated=0
  
  echo "📍 Processing: $arabic → $english"
  
  while true; do
    # Search for companies with this Arabic region
    SEARCH_RESULT=$(curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"filterGroups":[{"filters":[{"propertyName":"state","operator":"EQ","value":"'"$arabic"'"}]}],"limit":100,"properties":["state"]}' \
      "https://api.hubapi.com/crm/v3/objects/companies/search")
    
    COUNT=$(echo "$SEARCH_RESULT" | jq -r '.results | length')
    
    if [ "$COUNT" -eq "0" ]; then
      break
    fi
    
    # Build batch update
    BATCH_INPUT=$(echo "$SEARCH_RESULT" | jq -c '{inputs: [.results[] | {id: .id, properties: {state: "'"$english"'"}}]}')
    
    # Update companies
    curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$BATCH_INPUT" \
      "https://api.hubapi.com/crm/v3/objects/companies/batch/update" > /dev/null
    
    updated=$((updated + COUNT))
    echo "  ✅ Updated $COUNT companies (Total for this region: $updated)"
    
    sleep 0.3  # Rate limit protection
  done
  
  if [ "$updated" -gt "0" ]; then
    echo "  ✓ Complete: $updated companies updated"
    TOTAL_UPDATED=$((TOTAL_UPDATED + updated))
  else
    echo "  ℹ No companies found"
  fi
  
  echo ""
done

echo "=============================================="
echo "✅ All regions updated!"
echo "📊 Total companies updated: $TOTAL_UPDATED"
