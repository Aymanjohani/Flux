#!/usr/bin/env node
const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN not set');
  process.exit(1);
}

function searchContacts(after = null) {
  return new Promise((resolve, reject) => {
    const searchBody = JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'createdate',
          operator: 'GTE',
          value: '2026-02-03T09:00:00.000Z'
        }]
      }],
      properties: ['email', 'createdate'],
      limit: 100,
      after: after
    });

    const req = https.request({
      hostname: 'api.hubapi.com',
      path: '/crm/v3/objects/contacts/search',
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

function deleteContact(contactId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.hubapi.com',
      path: `/crm/v3/objects/contacts/${contactId}`,
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
  console.log('Searching for contacts created since 9:00 AM today...');
  
  const allContacts = [];
  let after = null;
  
  do {
    const result = await searchContacts(after);
    allContacts.push(...result.results);
    after = result.paging?.next?.after || null;
    
    console.log(`Found ${allContacts.length} contacts so far...`);
    await sleep(100);
  } while (after);

  console.log(`\nFound ${allContacts.length} contacts to delete.\n`);
  console.log('Deleting contacts...\n');
  
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < allContacts.length; i++) {
    const contact = allContacts[i];
    
    try {
      const result = await deleteContact(contact.id);
      
      if (result.success) {
        deleted++;
        process.stdout.write('.');
      } else {
        errors++;
      }

      if ((deleted + errors) % 50 === 0) {
        console.log(`\nProgress: ${deleted + errors}/${allContacts.length} | Deleted: ${deleted}, Errors: ${errors}`);
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
