#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

function searchCompaniesToday(after = null) {
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
      properties: ['name', 'phone', 'createdate'],
      limit: 100,
      after: after
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

function isPhoneNumber(name) {
  // Saudi mobile: 9 digits starting with 5
  if (/^5\d{8}$/.test(name)) return true;
  
  // 10 digits starting with 05
  if (/^05\d{8}$/.test(name)) return true;
  
  // With +966 prefix
  if (/^\+?966\d{9}$/.test(name)) return true;
  
  // Pure numbers 7+ digits
  if (/^[0-9]{7,}$/.test(name)) return true;
  
  return false;
}

async function main() {
  console.log('=== Finding phone numbers as company names ===\n');

  let badCompanies = [];
  let totalChecked = 0;
  let after = null;
  let hasMore = true;

  while (hasMore) {
    try {
      const result = await searchCompaniesToday(after);
      
      if (result.results) {
        for (const company of result.results) {
          totalChecked++;
          const name = company.properties.name || '';
          
          if (isPhoneNumber(name)) {
            badCompanies.push(company);
            console.log(`Found: ID=${company.id}, Name="${name}"`);
          }
        }
      }

      if (result.paging && result.paging.next) {
        after = result.paging.next.after;
        await sleep(200);
      } else {
        hasMore = false;
      }

    } catch (e) {
      console.error('Search error:', e.message);
      break;
    }
  }

  console.log(`\n=== Scan Complete ===`);
  console.log(`Total companies checked: ${totalChecked}`);
  console.log(`Phone numbers found: ${badCompanies.length}`);

  if (badCompanies.length === 0) {
    console.log('\n✅ No phone numbers found as company names!');
    return;
  }

  console.log('\n=== Deleting phone number records ===\n');

  let deleted = 0;
  let errors = 0;

  for (const company of badCompanies) {
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
