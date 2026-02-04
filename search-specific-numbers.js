#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Phone numbers visible in Ayman's screenshots
const phoneNumbers = [
  '551705000',
  '593945060',
  '564322654',
  '502505444',
  '502377544',
  '505414674',
  '540641120',
  '506516068',
  '593945018'
];

function searchByName(name) {
  return new Promise((resolve, reject) => {
    const searchBody = JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'name',
          operator: 'EQ',
          value: name
        }]
      }],
      properties: ['name', 'phone', 'createdate', 'hs_object_id'],
      limit: 10
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
  console.log('=== Searching for specific phone numbers from screenshots ===\n');

  const found = [];

  for (const number of phoneNumbers) {
    try {
      const result = await searchByName(number);
      if (result.results && result.results.length > 0) {
        for (const company of result.results) {
          found.push(company);
          console.log(`✓ Found: ${number} (ID: ${company.id})`);
        }
      } else {
        console.log(`✗ Not found: ${number}`);
      }
      await sleep(200);
    } catch (e) {
      console.error(`Error searching ${number}:`, e.message);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Phone numbers found in HubSpot: ${found.length}`);

  if (found.length === 0) {
    console.log('\nNone of the phone numbers from screenshots were found in HubSpot.');
    console.log('They may have been part of a field (not the full company name).');
    return;
  }

  console.log('\n=== Deleting phone number records ===\n');

  let deleted = 0;
  let errors = 0;

  for (const company of found) {
    try {
      const result = await deleteCompany(company.id);
      if (result.success) {
        deleted++;
        console.log(`✅ Deleted: ${company.id} (was: "${company.properties.name}")`);
      } else {
        errors++;
        console.error(`❌ Failed: ${company.id}`, result.status);
      }
      await sleep(150);
    } catch (e) {
      errors++;
      console.error(`❌ Error: ${company.id}`, e.message);
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
