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

async function searchContactsByLeadSource() {
  let allContacts = [];
  let after = null;
  
  do {
    const searchBody = {
      filterGroups: [{
        filters: [{
          propertyName: 'factory_database_source',
          operator: 'HAS_PROPERTY'
        }]
      }],
      limit: 100,
      properties: ['email', 'firstname', 'lastname', 'factory_database_source']
    };
    
    if (after) {
      searchBody.after = after;
    }
    
    const response = await apiRequest('POST', '/crm/v3/objects/contacts/search', searchBody);
    
    if (response.statusCode === 200 && response.data.results) {
      allContacts = allContacts.concat(response.data.results);
      after = response.data.paging?.next?.after || null;
      console.log(`Found ${allContacts.length} contacts so far...`);
    } else {
      console.error('Error searching contacts:', response);
      break;
    }
    
  } while (after);
  
  return allContacts;
}

async function deleteContact(contactId) {
  const response = await apiRequest('DELETE', `/crm/v3/objects/contacts/${contactId}`);
  return response.statusCode === 204 || response.statusCode === 200;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Searching for imported contacts...');
  const contacts = await searchContactsByLeadSource();
  
  console.log(`\nFound ${contacts.length} contacts to delete.`);
  
  if (contacts.length === 0) {
    console.log('No contacts found to delete.');
    return;
  }
  
  const confirm = process.argv[2];
  if (confirm !== '--confirm') {
    console.log('\nTo delete these contacts, run:');
    console.log('  node delete-imported-contacts.js --confirm');
    return;
  }
  
  console.log('\nDeleting contacts...\n');
  
  let deleted = 0;
  let errors = 0;
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    
    try {
      const success = await deleteContact(contact.id);
      
      if (success) {
        deleted++;
      } else {
        errors++;
      }
      
      if ((deleted + errors) % 10 === 0) {
        process.stdout.write('.');
      }
      
      if ((deleted + errors) % 100 === 0) {
        console.log(`\nProgress: ${deleted + errors}/${contacts.length} | Deleted: ${deleted}, Errors: ${errors}`);
      }
      
      // Rate limit: 100 req/10s = ~100ms delay
      await sleep(120);
      
    } catch (e) {
      errors++;
      console.error(`\nError deleting contact ${contact.id}:`, e.message);
      await sleep(1000);
    }
  }
  
  console.log('\n\n=== Deletion Complete ===');
  console.log(`Total processed: ${deleted + errors}`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
