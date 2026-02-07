#!/bin/bash
# Fetch IDs first, then update to avoid index loops
# Variations to fix:
# المنطقة الشرقية -> Eastern Province
# منطقة الباحه -> Al-Baha
# منطقة جيزان -> Jazan

declare -A REGIONS=(
  ["المنطقة الشرقية"]="Eastern Province"
  ["منطقة الباحه"]="Al-Baha"
  ["منطقة جيزان"]="Jazan"
)

for ARABIC in "${!REGIONS[@]}"; do
  ENGLISH="${REGIONS[$ARABIC]}"
  echo "🔍 Finding all companies with '$ARABIC'..."
  
  # Fetch ALL IDs first to a file
  curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"filterGroups\":[{\"filters\":[{\"propertyName\":\"state\",\"operator\":\"EQ\",\"value\":\"$ARABIC\"}]}],\"limit\":100,\"properties\":[\"state\"]}" \
    "https://api.hubapi.com/crm/v3/objects/companies/search" > search_initial.json

  TOTAL=$(jq -r '.total' search_initial.json)
  echo "Found $TOTAL companies to update."

  if [ "$TOTAL" == "0" ]; then continue; fi

  # Loop through pages to get ALL IDs
  echo "📥 Downloading ID list..."
  > ids_to_update.txt
  
  AFTER=""
  while true; do
    PAYLOAD="{\"filterGroups\":[{\"filters\":[{\"propertyName\":\"state\",\"operator\":\"EQ\",\"value\":\"$ARABIC\"}]}],\"limit\":100,\"properties\":[\"state\"]}"
    if [ -n "$AFTER" ]; then
      PAYLOAD="${PAYLOAD::-1},\"after\":\"$AFTER\"}"
    fi

    RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" \
      "https://api.hubapi.com/crm/v3/objects/companies/search")
    
    echo "$RESPONSE" | jq -r '.results[].id' >> ids_to_update.txt
    
    AFTER=$(echo "$RESPONSE" | jq -r '.paging.next.after // empty')
    if [ -z "$AFTER" ]; then break; fi
    echo -n "."
  done
  echo ""
  
  # Now update in batches of 100
  echo "🔄 Updating records..."
  count=0
  batch_ids=""
  
  while read -r id; do
    if [ -z "$batch_ids" ]; then
      batch_ids="{\"id\":\"$id\",\"properties\":{\"state\":\"$ENGLISH\"}}"
    else
      batch_ids="$batch_ids,{\"id\":\"$id\",\"properties\":{\"state\":\"$ENGLISH\"}}"
    fi
    
    count=$((count + 1))
    
    if [ $((count % 100)) -eq 0 ]; then
      echo "  Processing batch... ($count / $TOTAL)"
      curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"inputs\":[$batch_ids]}" \
        "https://api.hubapi.com/crm/v3/objects/companies/batch/update" > /dev/null
      batch_ids=""
      sleep 0.2
    fi
  done < ids_to_update.txt
  
  # Process remaining
  if [ -n "$batch_ids" ]; then
    echo "  Processing final batch..."
    curl -s -X POST -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"inputs\":[$batch_ids]}" \
      "https://api.hubapi.com/crm/v3/objects/companies/batch/update" > /dev/null
  fi
  
  echo "✅ Done with $ARABIC -> $ENGLISH"
done
