#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

// Load industry mapping
const industryMap = JSON.parse(fs.readFileSync('industry-mapper.json', 'utf8'));

// Property name mapping
const propertyMap = {
  'Name': 'name',
  'Industry': 'industry',
  'City': 'state',  // Using 'state' for region
  'Phone Number': 'phone',
  'Company Domain Name': 'domain',
  'Company owner': 'hubspot_owner_id',
  'Lead Source': 'factory_database_source',
  'Lead Source Detail': 'lead_source_detail',
  'CR Number': 'cr_number'
};

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

const csv = fs.readFileSync('hubspot-import-companies-clean.csv', 'utf8');
const parsed = parseCSV(csv);
const headers = parsed[0];
const rows = parsed.slice(1);

console.log(`Total companies to import: ${rows.length}`);

function getCompaniesCreatedToday() {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split('T')[0];
    const searchBody = JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'createdate',
          operator: 'GTE',
          value: `${today}T00:00:00.000Z`
        }]
      }],
      limit: 1
    });

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: '/crm/v3/objects/companies/search',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(searchBody, 'utf8')
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.total || 0);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(searchBody, 'utf8');
    req.end();
  });
}

function createCompany(properties) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ properties });
    const bodyLength = Buffer.byteLength(body, 'utf8');

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: '/crm/v3/objects/companies',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': bodyLength
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve({ success: true, created: true });
        } else if (res.statusCode === 409) {
          resolve({ success: true, created: false, duplicate: true });
        } else {
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(body, 'utf8');
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const alreadyCreated = await getCompaniesCreatedToday();
  console.log(`Already created today: ${alreadyCreated}`);
  console.log(`Remaining to process: ${rows.length - Math.min(alreadyCreated, rows.length)}\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const errorLog = [];

  const startIndex = Math.min(alreadyCreated, rows.length);

  for (let i = startIndex; i < rows.length; i++) {
    const values = rows[i];
    const properties = {};
    
    headers.forEach((header, idx) => {
      const csvHeader = header.trim();
      const hubspotProperty = propertyMap[csvHeader];
      let value = (values[idx] || '').trim();
      
      if (!value || csvHeader === 'id' || csvHeader === 'hs_object_id') {
        return;
      }
      
      // Map Arabic industry to English enum
      if (csvHeader === 'Industry') {
        value = industryMap[value] || null;
        if (!value) return; // Skip if no mapping found
      }
      
      if (hubspotProperty) {
        properties[hubspotProperty] = value;
      }
    });

    if (!properties.name) {
      skipped++;
      continue;
    }

    try {
      const result = await createCompany(properties);
      if (result.created) {
        created++;
        if (created % 10 === 0) {
          process.stdout.write('.');
        }
      } else if (result.duplicate) {
        skipped++;
      } else {
        errors++;
        if (errors <= 10) {
          errorLog.push({ row: i + 1, name: properties.name, error: result });
        }
      }

      if ((created + skipped + errors) % 100 === 0) {
        console.log(`\nProgress: ${i + 1}/${rows.length} (Created: ${created}, Skipped: ${skipped}, Errors: ${errors})`);
      }

      await sleep(125);

    } catch (e) {
      errors++;
      if (errors <= 10) {
        errorLog.push({ row: i + 1, name: properties.name, error: e.message });
      }
      await sleep(1000);
    }
  }

  console.log('\n\n=== Import Complete ===');
  console.log(`Total processed: ${created + skipped + errors}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);

  if (errorLog.length > 0) {
    console.log('\n=== First 10 Errors ===');
    errorLog.forEach(e => {
      console.log(`Row ${e.row}: ${e.name}`);
      console.log(`  Error: ${JSON.stringify(e.error).substring(0, 200)}`);
    });
  }

  const finalCount = await getCompaniesCreatedToday();
  console.log(`\nCompanies created today (2026-02-02): ${finalCount}`);
}

main().catch(console.error);
