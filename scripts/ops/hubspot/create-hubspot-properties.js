#!/usr/bin/env node
const https = require('https');
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

const properties = [
  {
    name: 'factory_database_source',
    label: 'Factory Database Source',
    type: 'string',
    fieldType: 'text',
    groupName: 'companyinformation'
  },
  {
    name: 'lead_source_detail',
    label: 'Lead Source Detail',
    type: 'string',
    fieldType: 'textarea',
    groupName: 'companyinformation'
  },
  {
    name: 'cr_number',
    label: 'CR Number',
    type: 'string',
    fieldType: 'text',
    groupName: 'companyinformation'
  },
  {
    name: 'manufacturing_type',
    label: 'Manufacturing Type',
    type: 'string',
    fieldType: 'text',
    groupName: 'companyinformation'
  }
];

async function createProperty(prop) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(prop);
    
    const req = https.request({
      hostname: 'api.hubapi.com',
      path: '/crm/v3/properties/companies',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve({ success: true, property: prop.name });
        } else {
          const parsed = JSON.parse(data);
          if (parsed.message && parsed.message.includes('already exists')) {
            resolve({ success: true, property: prop.name, existed: true });
          } else {
            resolve({ success: false, property: prop.name, error: parsed });
          }
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Creating custom properties...\n');
  
  for (const prop of properties) {
    const result = await createProperty(prop);
    if (result.success) {
      console.log(`✅ ${prop.name} ${result.existed ? '(already exists)' : ''}`);
    } else {
      console.log(`❌ ${prop.name}:`, result.error.message);
    }
  }
  
  console.log('\n✅ Properties setup complete');
})();
