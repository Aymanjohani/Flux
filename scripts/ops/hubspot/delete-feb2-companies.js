#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');

function searchCompanies(after = null) {
  return new Promise((resolve, reject) => {
    const searchBody = JSON.stringify({
      filterGroups: [{
        filters: [
          {
            propertyName: 'createdate',
            operator: 'GTE',
            value: '2026-02-02T00:00:00.000Z'
          },
          {
            propertyName: 'createdate',
            operator: 'LT',
            value: '2026-02-03T00:00:00.000Z'
          }
        ]
      }],
      properties: ['name', 'createdate'],
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
          const result = JSON.parse(data);
          resolve(result);
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
  console.log('Searching for companies created on Feb 2, 2026...');
  
  const allCompanies = [];
  let after = null;
  
  do {
    const result = await searchCompanies(after);
    allCompanies.push(...result.results);
    after = result.paging?.next?.after || null;
    
    console.log(`Found ${allCompanies.length} companies so far...`);
    await sleep(100);
  } while (after);

  console.log(`\nFound ${allCompanies.length} companies to delete.`);
  
  if (!confirmed) {
    console.log('\nTo delete these companies, run: node delete-feb2-companies.js --confirm');
    return;
  }

  console.log('\nDeleting companies...\n');
  
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < allCompanies.length; i++) {
    const company = allCompanies[i];
    
    try {
      const result = await deleteCompany(company.id);
      
      if (result.success) {
        deleted++;
        process.stdout.write('.');
      } else {
        errors++;
      }

      if ((deleted + errors) % 100 === 0) {
        console.log(`\nProgress: ${deleted + errors}/${allCompanies.length} | Deleted: ${deleted}, Errors: ${errors}`);
      }

      await sleep(100);

    } catch (e) {
      errors++;
      await sleep(500);
    }
  }

  console.log('\n\n=== Deletion Complete ===');
  console.log(`Total processed: ${deleted + errors}`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
