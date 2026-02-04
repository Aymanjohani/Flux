#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const bodyLength = bodyStr ? Buffer.byteLength(bodyStr, 'utf8') : 0;
    
    const options = {
      hostname: 'api.hubapi.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    };
    
    if (bodyLength > 0) {
      options.headers['Content-Length'] = bodyLength;
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, parseError: true });
        }
      });
    });
    
    req.on('error', reject);
    if (bodyStr) {
      req.write(bodyStr, 'utf8');
    }
    req.end();
  });
}

async function searchCompaniesCreatedToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  
  let allCompanies = [];
  let after = null;
  
  do {
    const searchBody = {
      filterGroups: [{
        filters: [{
          propertyName: 'createdate',
          operator: 'GTE',
          value: todayMs.toString()
        }]
      }],
      limit: 100,
      properties: ['name', 'createdate']
    };
    
    if (after) {
      searchBody.after = after;
    }
    
    const response = await apiRequest('POST', '/crm/v3/objects/companies/search', searchBody);
    
    if (response.statusCode === 200 && response.data.results) {
      allCompanies = allCompanies.concat(response.data.results);
      after = response.data.paging?.next?.after || null;
      console.log(`Found ${allCompanies.length} companies so far...`);
    } else {
      console.error('Error searching companies:', response);
      break;
    }
    
  } while (after);
  
  return allCompanies;
}

async function deleteCompany(companyId) {
  const response = await apiRequest('DELETE', `/crm/v3/objects/companies/${companyId}`);
  return response.statusCode === 204 || response.statusCode === 200;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Searching for companies created today...');
  const companies = await searchCompaniesCreatedToday();
  
  console.log(`\nFound ${companies.length} companies to delete.`);
  
  if (companies.length === 0) {
    console.log('No companies found to delete.');
    return;
  }
  
  const confirm = process.argv[2];
  if (confirm !== '--confirm') {
    console.log('\nTo delete these companies, run:');
    console.log('  node delete-todays-companies.js --confirm');
    return;
  }
  
  console.log('\nDeleting companies...\n');
  
  let deleted = 0;
  let errors = 0;
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    
    try {
      const success = await deleteCompany(company.id);
      
      if (success) {
        deleted++;
      } else {
        errors++;
      }
      
      if ((deleted + errors) % 10 === 0) {
        process.stdout.write('.');
      }
      
      if ((deleted + errors) % 100 === 0) {
        console.log(`\nProgress: ${deleted + errors}/${companies.length} | Deleted: ${deleted}, Errors: ${errors}`);
      }
      
      // Rate limit: 100 req/10s
      await sleep(120);
      
    } catch (e) {
      errors++;
      console.error(`\nError deleting company ${company.id}:`, e.message);
      await sleep(1000);
    }
  }
  
  console.log('\n\n=== Deletion Complete ===');
  console.log(`Total processed: ${deleted + errors}`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
