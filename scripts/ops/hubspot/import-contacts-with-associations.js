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

const csv = fs.readFileSync('hubspot-import-contacts.csv', 'utf8');
const parsed = parseCSV(csv);
const headers = parsed[0];
const rows = parsed.slice(1);

console.log(`Total contacts to import: ${rows.length}\n`);

// Company name cache to avoid repeated searches
const companyCache = new Map();

function searchCompanyByName(companyName) {
  return new Promise((resolve, reject) => {
    const searchBody = JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'name',
          operator: 'EQ',
          value: companyName
        }]
      }],
      properties: ['name'],
      limit: 1
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
          if (result.results && result.results.length > 0) {
            resolve(result.results[0].id);
          } else {
            resolve(null);
          }
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

function createContact(properties) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ properties });
    const bodyLength = Buffer.byteLength(body, 'utf8');

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: '/crm/v3/objects/contacts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': bodyLength
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          resolve({ success: true, created: true, contactId: result.id });
        } else if (res.statusCode === 409) {
          // Contact already exists - try to get the ID from the error
          try {
            const error = JSON.parse(data);
            const existingId = error.message?.match(/Existing ID: (\d+)/)?.[1];
            resolve({ success: true, created: false, duplicate: true, contactId: existingId });
          } catch (e) {
            resolve({ success: true, created: false, duplicate: true });
          }
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

function associateContactWithCompany(contactId, companyId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify([{
      from: { id: contactId },
      to: { id: companyId },
      type: 'contact_to_company'
    }]);

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: `/crm/v3/associations/contacts/companies/batch/create`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body, 'utf8')
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let created = 0;
  let skipped = 0;
  let errors = 0;
  let associated = 0;
  let notAssociated = 0;
  const errorLog = [];

  for (let i = 0; i < rows.length; i++) {
    const values = rows[i];
    const contactData = {
      email: values[0]?.trim(),
      firstname: values[1]?.trim(),
      lastname: values[2]?.trim(),
      company: values[3]?.trim(),
      phone: values[4]?.trim(),
      jobtitle: values[5]?.trim(),
      city: values[6]?.trim(),
      factory_database_source: values[7]?.trim(),
      lifecyclestage: values[8]?.trim()
    };

    // Skip if no email
    if (!contactData.email) {
      skipped++;
      continue;
    }

    // Prepare contact properties
    const contactProperties = {};
    if (contactData.email) contactProperties.email = contactData.email;
    if (contactData.firstname) contactProperties.firstname = contactData.firstname;
    if (contactData.lastname) contactProperties.lastname = contactData.lastname;
    if (contactData.phone) contactProperties.phone = contactData.phone;
    if (contactData.jobtitle) contactProperties.jobtitle = contactData.jobtitle;
    if (contactData.city) contactProperties.city = contactData.city;
    if (contactData.factory_database_source) contactProperties.factory_database_source = contactData.factory_database_source;
    if (contactData.lifecyclestage) contactProperties.lifecyclestage = contactData.lifecyclestage;

    try {
      // Create contact
      const result = await createContact(contactProperties);
      
      if (result.created) {
        created++;
      } else if (result.duplicate) {
        skipped++;
      } else {
        errors++;
        if (errors <= 10) {
          errorLog.push({ row: i + 1, email: contactData.email, error: result });
        }
      }

      // Try to associate with company if we have a contact ID and company name
      if (result.contactId && contactData.company) {
        let companyId = companyCache.get(contactData.company);
        
        if (!companyId) {
          companyId = await searchCompanyByName(contactData.company);
          if (companyId) {
            companyCache.set(contactData.company, companyId);
          }
          await sleep(50); // Small delay after search
        }

        if (companyId) {
          const assocResult = await associateContactWithCompany(result.contactId, companyId);
          if (assocResult.success) {
            associated++;
          } else {
            notAssociated++;
          }
        } else {
          notAssociated++;
        }
      }

      if ((created + skipped + errors) % 10 === 0) {
        process.stdout.write('.');
      }

      if ((created + skipped + errors) % 100 === 0) {
        console.log(`\nProgress: ${i + 1}/${rows.length} | Created: ${created}, Skipped: ${skipped}, Errors: ${errors} | Associated: ${associated}, Not associated: ${notAssociated}`);
      }

      await sleep(150); // Rate limiting

    } catch (e) {
      errors++;
      if (errors <= 10) {
        errorLog.push({ row: i + 1, email: contactData.email, error: e.message });
      }
      await sleep(1000);
    }
  }

  console.log('\n\n=== Import Complete ===');
  console.log(`Total processed: ${created + skipped + errors}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nAssociations:`);
  console.log(`  Associated with companies: ${associated}`);
  console.log(`  Not associated: ${notAssociated}`);
  console.log(`  Companies in cache: ${companyCache.size}`);

  if (errorLog.length > 0) {
    console.log('\n=== First 10 Errors ===');
    errorLog.forEach(e => {
      console.log(`Row ${e.row}: ${e.email}`);
      console.log(`  Error: ${JSON.stringify(e.error).substring(0, 200)}`);
    });
  }
}

main().catch(console.error);
