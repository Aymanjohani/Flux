#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

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

function searchCompanies(filter) {
  return new Promise((resolve, reject) => {
    const searchBody = JSON.stringify({
      filterGroups: [{ filters: [filter] }],
      properties: ['name', 'phone', 'industry', 'city', 'hs_lead_source', 'lead_source_detail', 'cr_number'],
      limit: 100
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
          resolve(JSON.parse(data));
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

function updateCompany(companyId, properties) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ properties });
    const bodyLength = Buffer.byteLength(body, 'utf8');

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: `/crm/v3/objects/companies/${companyId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': bodyLength
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true });
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

function deleteCompany(companyId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.hubapi.com',
      path: `/crm/v3/objects/companies/${companyId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    }, (res) => {
      if (res.statusCode === 204) {
        resolve({ success: true });
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ success: false, status: res.statusCode, data }));
      }
    });

    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Step 1: Finding bad records in HubSpot ===\n');

  // Search for companies with numeric names (phone numbers)
  const badCompanies = [];
  
  // Common patterns for phone numbers as names
  const patterns = [
    { propertyName: 'name', operator: 'CONTAINS_TOKEN', value: '966' },
    { propertyName: 'name', operator: 'CONTAINS_TOKEN', value: '+966' },
    { propertyName: 'name', operator: 'CONTAINS_TOKEN', value: '05' }
  ];

  for (const filter of patterns) {
    try {
      const result = await searchCompanies(filter);
      if (result.results) {
        for (const company of result.results) {
          const name = company.properties.name;
          // Check if name is mostly numbers
          if (/^[+0-9\s\-()]{7,}$/.test(name)) {
            badCompanies.push(company);
            console.log(`Found bad record: ID=${company.id}, Name="${name}"`);
          }
        }
      }
      await sleep(200);
    } catch (e) {
      console.error('Search error:', e.message);
    }
  }

  console.log(`\nFound ${badCompanies.length} companies with phone numbers as names`);

  if (badCompanies.length === 0) {
    console.log('\nNo bad records to fix!');
    return;
  }

  console.log('\n=== Step 2: Deleting bad records ===\n');

  let deleted = 0;
  let errors = 0;

  for (const company of badCompanies) {
    try {
      const result = await deleteCompany(company.id);
      if (result.success) {
        deleted++;
        console.log(`Deleted: ${company.id} (was: "${company.properties.name}")`);
      } else {
        errors++;
        console.error(`Failed to delete ${company.id}:`, result);
      }
      await sleep(150);
    } catch (e) {
      errors++;
      console.error(`Exception deleting ${company.id}:`, e.message);
    }
  }

  console.log(`\n=== Deletion Complete ===`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);

  console.log('\n=== Step 3: Re-importing clean data ===\n');
  console.log('Bad records deleted. CSV needs to be cleaned first before re-import.');
  console.log('Run the CSV cleanup script next.');
}

main().catch(console.error);
