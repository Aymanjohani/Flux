#!/usr/bin/env node
const fs = require('fs');

// Generic email providers to skip
const GENERIC_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
  'live.com', 'icloud.com', 'mail.com', 'aol.com',
  'ymail.com', 'protonmail.com', 'zoho.com'
]);

// Proper CSV parser
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
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    
    fields.push(field.trim());
    lines.push(fields);
  }
  
  return lines;
}

console.log('📧 Extracting domains from contact emails...\n');

// Read contacts CSV
const contactsCsv = fs.readFileSync('hubspot-import-contacts.csv', 'utf8');
const contactsData = parseCSV(contactsCsv);
const contactsHeaders = contactsData[0];
const contactsRows = contactsData.slice(1);

// Find column indices
const emailIdx = contactsHeaders.indexOf('Email');
const companyIdx = contactsHeaders.indexOf('Company Name');

if (emailIdx === -1 || companyIdx === -1) {
  console.error('❌ Could not find Email or Company Name columns');
  process.exit(1);
}

// Build company -> domains mapping
const companyDomains = new Map();
let totalContacts = 0;
let validDomains = 0;
let genericDomains = 0;
let noDomain = 0;

contactsRows.forEach(row => {
  totalContacts++;
  const email = (row[emailIdx] || '').trim().toLowerCase();
  const company = (row[companyIdx] || '').trim();
  
  if (!email || !company) {
    noDomain++;
    return;
  }
  
  // Extract domain from email
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    noDomain++;
    return;
  }
  
  const domain = email.substring(atIndex + 1);
  
  // Skip generic email providers
  if (GENERIC_DOMAINS.has(domain)) {
    genericDomains++;
    return;
  }
  
  // Add to mapping
  if (!companyDomains.has(company)) {
    companyDomains.set(company, new Set());
  }
  companyDomains.get(company).add(domain);
  validDomains++;
});

console.log(`📊 Contact Analysis:`);
console.log(`   Total contacts: ${totalContacts}`);
console.log(`   Valid corporate domains: ${validDomains}`);
console.log(`   Generic email providers: ${genericDomains}`);
console.log(`   No email/company: ${noDomain}`);
console.log(`   Unique companies with domains: ${companyDomains.size}`);
console.log('');

// Read companies CSV
const companiesCsv = fs.readFileSync('hubspot-import-companies-clean.csv', 'utf8');
const companiesData = parseCSV(companiesCsv);
const companiesHeaders = companiesData[0];
const companiesRows = companiesData.slice(1);

// Find column index for domain
const domainIdx = companiesHeaders.indexOf('Company Domain Name');
if (domainIdx === -1) {
  console.error('❌ Could not find Company Domain Name column');
  process.exit(1);
}

const nameIdx = companiesHeaders.indexOf('Name');

// Update companies with domains
let companiesUpdated = 0;
let multipleDomainsFound = 0;

companiesRows.forEach(row => {
  const companyName = (row[nameIdx] || '').trim();
  
  if (companyDomains.has(companyName)) {
    const domains = Array.from(companyDomains.get(companyName));
    
    if (domains.length === 1) {
      row[domainIdx] = domains[0];
      companiesUpdated++;
    } else {
      // Multiple domains - pick the most common one or the shortest
      const domainCounts = {};
      domains.forEach(d => domainCounts[d] = (domainCounts[d] || 0) + 1);
      const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
      row[domainIdx] = sortedDomains[0][0];
      companiesUpdated++;
      multipleDomainsFound++;
    }
  }
});

console.log(`✅ Updated ${companiesUpdated} companies with domains`);
if (multipleDomainsFound > 0) {
  console.log(`   (${multipleDomainsFound} companies had multiple domains - picked most common)`);
}
console.log('');

// Write updated CSV
const outputLines = [companiesHeaders, ...companiesRows].map(row => {
  return row.map(field => {
    // Quote fields that contain commas or quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }).join(',');
});

fs.writeFileSync('hubspot-import-companies-with-domains.csv', outputLines.join('\n'), 'utf8');

console.log('💾 Saved to: hubspot-import-companies-with-domains.csv');
console.log('');

// Show sample of domains added
console.log('📝 Sample domains added:');
let sampleCount = 0;
for (const [company, domains] of companyDomains) {
  if (sampleCount >= 20) break;
  console.log(`   ${company} → ${Array.from(domains).join(', ')}`);
  sampleCount++;
}

console.log('');
console.log('🎯 Next step: Import hubspot-import-companies-with-domains.csv to HubSpot');
console.log('   HubSpot will automatically enrich with logos and additional data!');
