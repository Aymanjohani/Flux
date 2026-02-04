#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

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

async function searchCompanyByName(name) {
  const response = await apiRequest('POST', '/crm/v3/objects/companies/search', {
    filterGroups: [{
      filters: [{
        propertyName: 'name',
        operator: 'EQ',
        value: name
      }]
    }],
    limit: 1,
    properties: ['name', 'domain']
  });
  
  if (response.statusCode === 200 && response.data.results && response.data.results.length > 0) {
    return response.data.results[0];
  }
  return null;
}

async function updateCompany(companyId, properties) {
  const response = await apiRequest('PATCH', `/crm/v3/objects/companies/${companyId}`, { properties });
  return response.statusCode === 200;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔄 Updating existing companies with domains...\n');
  
  const csv = fs.readFileSync('hubspot-import-companies-with-domains.csv', 'utf8');
  const parsed = parseCSV(csv);
  const headers = parsed[0];
  const rows = parsed.slice(1);
  
  const nameIdx = headers.indexOf('Name');
  const domainIdx = headers.indexOf('Company Domain Name');
  
  // Filter to only companies WITH domains
  const companiesWithDomains = rows.filter(row => {
    const domain = (row[domainIdx] || '').trim();
    return domain.length > 0;
  });
  
  console.log(`Total companies with domains: ${companiesWithDomains.length}`);
  console.log(`Starting update...\n`);
  
  let updated = 0;
  let alreadyHasDomain = 0;
  let notFound = 0;
  let errors = 0;
  
  for (let i = 0; i < companiesWithDomains.length; i++) {
    const row = companiesWithDomains[i];
    const name = (row[nameIdx] || '').trim();
    const domain = (row[domainIdx] || '').trim();
    
    if (!name || !domain) continue;
    
    try {
      // Find company in HubSpot
      const company = await searchCompanyByName(name);
      
      if (company) {
        // Check if it already has a domain
        if (company.properties.domain && company.properties.domain.trim().length > 0) {
          alreadyHasDomain++;
        } else {
          // Update with domain
          const success = await updateCompany(company.id, { domain: domain });
          if (success) {
            updated++;
          } else {
            errors++;
          }
        }
      } else {
        notFound++;
      }
      
      if ((updated + alreadyHasDomain + notFound) % 10 === 0) {
        process.stdout.write('.');
      }
      
      if ((updated + alreadyHasDomain + notFound) % 100 === 0) {
        console.log(`\nProgress: ${i + 1}/${companiesWithDomains.length} | Updated: ${updated}, Already had: ${alreadyHasDomain}, Not found: ${notFound}, Errors: ${errors}`);
      }
      
      // Rate limit: 100 req/10s
      await sleep(120);
      
    } catch (e) {
      errors++;
      console.error(`\nError processing ${name}:`, e.message);
      await sleep(1000);
    }
  }
  
  console.log('\n\n=== Update Complete ===');
  console.log(`Total processed: ${updated + alreadyHasDomain + notFound + errors}`);
  console.log(`Updated with domains: ${updated}`);
  console.log(`Already had domains: ${alreadyHasDomain}`);
  console.log(`Not found in HubSpot: ${notFound}`);
  console.log(`Errors: ${errors}`);
  console.log('\n✨ HubSpot will now enrich these companies with logos and additional data!');
}

main().catch(console.error);
