#!/usr/bin/env node
const fs = require('fs');

console.log('=== Cleaning CSV Data ===\n');

const csv = fs.readFileSync('hubspot-import-companies.csv', 'utf8');
const lines = csv.split('\n');
const header = lines[0];

console.log('Header:', header);
console.log(`Total lines: ${lines.length}\n`);

const cleanedLines = [header];
let fixed = 0;
let removed = 0;
let kept = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const fields = line.split(',');
  let name = fields[0]?.trim() || '';
  
  // Remove quotes
  name = name.replace(/^"|"$/g, '');

  // Check for bad data
  const isBad = 
    !name || // Empty
    name.length < 3 || // Too short
    /^[+0-9\s\-()]{7,}$/.test(name) || // Phone number as name
    /^[0-9.]+$/.test(name) || // Pure numbers
    name === '"'; // Just a quote

  if (isBad) {
    console.log(`Row ${i}: REMOVED - Bad name: "${name}"`);
    removed++;
    continue;
  }

  // Check if name has trailing quote or phone number artifacts
  if (name.includes('+966') || name.includes('966') && name.length < 20) {
    // Likely phone contamination
    console.log(`Row ${i}: REMOVED - Phone contamination: "${name}"`);
    removed++;
    continue;
  }

  cleanedLines.push(line);
  kept++;
}

console.log(`\n=== Results ===`);
console.log(`Original records: ${lines.length - 1}`);
console.log(`Kept: ${kept}`);
console.log(`Removed: ${removed}`);

// Write cleaned file
const cleanedCSV = cleanedLines.join('\n');
fs.writeFileSync('hubspot-import-companies-clean.csv', cleanedCSV, 'utf8');

console.log(`\n✅ Clean CSV saved to: hubspot-import-companies-clean.csv`);
console.log(`Records in clean file: ${kept}`);
