#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

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

function isCorrupted(name) {
  // Check for CSV corruption - multiple commas indicating unparsed CSV row
  if (/,.*,.*,/.test(name)) return true;
  
  // Check for "Factory Database" in name (should be in Lead Source field, not name)
  if (/Factory Database/.test(name)) return true;
  
  // Check for CR numbers in name (should be separate field)
  if (/\d{10}\.0/.test(name)) return true;
  
  return false;
}

async function main() {
  console.log('=== Finding CSV-corrupted company names ===\n');

  let corruptedCompanies = [];
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
          
          if (isCorrupted(name)) {
            corruptedCompanies.push(company);
            // Show first 100 chars of corrupted name
            const preview = name.length > 100 ? name.substring(0, 100) + '...' : name;
            console.log(`Found corrupted: ID=${company.id}`);
            console.log(`  Name: "${preview}"`);
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
  console.log(`Corrupted records found: ${corruptedCompanies.length}`);

  if (corruptedCompanies.length === 0) {
    console.log('\n✅ No corrupted records found!');
    return;
  }

  console.log('\n=== Deleting corrupted records ===\n');

  let deleted = 0;
  let errors = 0;

  for (const company of corruptedCompanies) {
    try {
      const result = await deleteCompany(company.id);
      if (result.success) {
        deleted++;
        const preview = company.properties.name.substring(0, 60);
        console.log(`✅ Deleted: ${company.id} ("${preview}...")`);
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
