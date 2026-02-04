#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

// Property mapping
const propertyMap = {
  'Email': 'email',
  'First Name': 'firstname',
  'Last Name': 'lastname',
  'Phone Number': 'phone',
  'Job Title': 'jobtitle',
  'City': 'city',
  'Lead Source': 'factory_database_source',
  'Lifecycle Stage': 'lifecyclestage'
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

async function findCompanyByName(name) {
  const response = await apiRequest('POST', '/crm/v3/objects/companies/search', {
    filterGroups: [{
      filters: [{
        propertyName: 'name',
        operator: 'EQ',
        value: name
      }]
    }],
    limit: 1,
    properties: ['name']
  });
  
  if (response.statusCode === 200 && response.data.results && response.data.results.length > 0) {
    return response.data.results[0].id;
  }
  return null;
}

async function createContact(properties) {
  const response = await apiRequest('POST', '/crm/v3/objects/contacts', { properties });
  
  if (response.statusCode === 201) {
    return { success: true, id: response.data.id };
  } else if (response.statusCode === 409) {
    // Duplicate - try to get existing contact
    const email = properties.email;
    const existing = await apiRequest('GET', `/crm/v3/objects/contacts/${email}?idProperty=email`);
    if (existing.statusCode === 200) {
      return { success: true, id: existing.data.id, duplicate: true };
    }
  }
  
  return { success: false, status: response.statusCode, data: response.data };
}

async function associateContactToCompany(contactId, companyId) {
  const response = await apiRequest('PUT', 
    `/crm/v4/objects/contacts/${contactId}/associations/companies/${companyId}`, 
    [{
      associationCategory: "HUBSPOT_DEFINED",
      associationTypeId: 1  // Contact to Company
    }]
  );
  
  return response.statusCode === 200 || response.statusCode === 201;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const csvFile = process.argv[2] || 'hubspot-import-contacts.csv';
  const csv = fs.readFileSync(csvFile, 'utf8');
  const parsed = parseCSV(csv);
  const headers = parsed[0];
  const rows = parsed.slice(1);
  
  console.log(`Total contacts to import: ${rows.length}`);
  console.log(`Starting import...\n`);
  
  let created = 0;
  let duplicates = 0;
  let errors = 0;
  let associated = 0;
  let noCompany = 0;
  
  const errorLog = [];
  
  for (let i = 0; i < rows.length; i++) {
    const values = rows[i];
    const properties = {};
    let companyName = null;
    
    headers.forEach((header, idx) => {
      const csvHeader = header.trim();
      const value = (values[idx] || '').trim();
      
      if (csvHeader === 'Company Name') {
        companyName = value;
        return;
      }
      
      const hubspotProperty = propertyMap[csvHeader];
      if (hubspotProperty && value) {
        properties[hubspotProperty] = value;
      }
    });
    
    if (!properties.email) {
      errors++;
      continue;
    }
    
    try {
      // Create contact
      const result = await createContact(properties);
      
      if (result.success) {
        if (result.duplicate) {
          duplicates++;
        } else {
          created++;
        }
        
        // Try to associate with company
        if (companyName) {
          const companyId = await findCompanyByName(companyName);
          if (companyId) {
            const assocSuccess = await associateContactToCompany(result.id, companyId);
            if (assocSuccess) {
              associated++;
            }
          } else {
            noCompany++;
          }
        }
        
        if ((created + duplicates) % 10 === 0) {
          process.stdout.write('.');
        }
        
        if ((created + duplicates) % 100 === 0) {
          console.log(`\nProgress: ${i + 1}/${rows.length} | Created: ${created}, Duplicates: ${duplicates}, Associated: ${associated}, Errors: ${errors}`);
        }
      } else {
        errors++;
        if (errors <= 10) {
          errorLog.push({ 
            row: i + 1, 
            email: properties.email, 
            error: result.data 
          });
        }
      }
      
      // Rate limit: 100 req/10s = ~100ms delay
      await sleep(120);
      
    } catch (e) {
      errors++;
      if (errors <= 10) {
        errorLog.push({ row: i + 1, email: properties.email, error: e.message });
      }
      await sleep(1000);
    }
  }
  
  console.log('\n\n=== Import Complete ===');
  console.log(`Total processed: ${created + duplicates + errors}`);
  console.log(`Created: ${created}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Associated to companies: ${associated}`);
  console.log(`No matching company: ${noCompany}`);
  console.log(`Errors: ${errors}`);
  
  if (errorLog.length > 0) {
    console.log('\n=== First 10 Errors ===');
    errorLog.forEach(e => {
      console.log(`Row ${e.row}: ${e.email}`);
      console.log(`  Error: ${JSON.stringify(e.error).substring(0, 200)}`);
    });
  }
}

main().catch(console.error);
