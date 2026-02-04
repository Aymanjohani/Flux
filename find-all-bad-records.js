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

function isBadName(name) {
  if (!name || name.length < 3) return true;
  if (name === '"') return true;
  
  // Phone number patterns
  if (/^[+0-9\s\-()]{7,}$/.test(name)) return true;
  if (/^[0-9.]+$/.test(name)) return true;
  
  // Starts with +966 or 966 or 05
  if (/^(\+?966|05)\d{7,}/.test(name)) return true;
  
  // Name is mostly numbers
  const digitCount = (name.match(/\d/g) || []).length;
  if (digitCount > name.length * 0.6) return true;
  
  return false;
}

async function main() {
  console.log('=== Scanning all companies created today ===\n');

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
          const name = company.properties.name;
          
          if (isBadName(name)) {
            badCompanies.push(company);
            console.log(`❌ BAD: ID=${company.id}, Name="${name}"`);
          }
        }
      }

      if (result.paging && result.paging.next) {
        after = result.paging.next.after;
        console.log(`Checked ${totalChecked} companies, found ${badCompanies.length} bad ones so far...`);
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
  console.log(`Bad records found: ${badCompanies.length}`);

  if (badCompanies.length === 0) {
    console.log('\n✅ No bad records found!');
    return;
  }

  console.log('\n=== Deleting bad records ===\n');

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
        console.error(`❌ Failed to delete ${company.id}:`, result);
      }
      await sleep(150);
    } catch (e) {
      errors++;
      console.error(`❌ Exception deleting ${company.id}:`, e.message);
    }
  }

  console.log(`\n=== Cleanup Complete ===`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
