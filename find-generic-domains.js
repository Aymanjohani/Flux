#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

// Generic domains that are likely wrong
const genericDomains = [
  'msn.com', 'outlook.com', 'hotmail.com', 'gmail.com', 'yahoo.com',
  'live.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
];

function searchByDomain(domain) {
  return new Promise((resolve, reject) => {
    const searchBody = JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: 'EQ',
          value: domain
        }]
      }],
      properties: ['name', 'domain', 'phone', 'cr_number', 'createdate'],
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Searching for companies with generic/free email domains...\n');
  
  let totalFound = 0;
  const allBadCompanies = [];

  for (const domain of genericDomains) {
    const result = await searchByDomain(domain);
    if (result.total > 0) {
      console.log(`\n=== Found ${result.total} companies with domain: ${domain} ===`);
      result.results.forEach(company => {
        console.log(`  ${company.properties.name} | CR: ${company.properties.cr_number || 'N/A'} | Phone: ${company.properties.phone || 'N/A'}`);
        allBadCompanies.push({
          id: company.id,
          name: company.properties.name,
          domain: domain,
          cr: company.properties.cr_number,
          phone: company.properties.phone
        });
      });
      totalFound += result.total;
    }
    await sleep(100);
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Total companies with generic domains: ${totalFound}`);
  
  if (totalFound > 0) {
    const fs = require('fs');
    fs.writeFileSync('companies-with-generic-domains.json', JSON.stringify(allBadCompanies, null, 2));
    console.log('\nCompany list saved to: companies-with-generic-domains.json');
  }
}

main().catch(console.error);
