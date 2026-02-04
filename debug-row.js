#!/usr/bin/env node
const fs = require('fs');

// Proper CSV parser that handles quoted fields with commas
function parseCSV(text) {
  const lines = [];
  const rows = text.split('\n');
  
  for (const row of rows) {
    if (!row.trim()) continue;
    
    const fields = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          field += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    
    // Add last field
    fields.push(field.trim());
    lines.push(fields);
  }
  
  return lines;
}

const csv = fs.readFileSync('hubspot-import-companies.csv', 'utf8');
const parsed = parseCSV(csv);
const headers = parsed[0];

// Debug row 4539 (index 4538 since header is 0)
const rowIndex = 4538;
const row = parsed[rowIndex + 1];

console.log('Headers:', headers);
console.log('\nRow data:', row);
console.log('\nRow length:', row.length);
console.log('Headers length:', headers.length);

const properties = {};
headers.forEach((header, idx) => {
  const key = header.trim();
  const value = (row[idx] || '').trim();
  if (value && key !== 'id' && key !== 'hs_object_id') {
    properties[key] = value;
  }
});

console.log('\nProperties object:', properties);

const json = JSON.stringify({ properties });
console.log('\nJSON length:', json.length);
console.log('JSON:', json);
