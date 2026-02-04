const https = require('https');

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const API = 'api.hubapi.com';

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function cleanup() {
  console.log('🧹 HUBSPOT CLEANUP STARTING...\n');
  
  const log = [];
  
  // Load current data
  console.log('📥 Loading current data...');
  const contactsResp = await apiCall('GET', '/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,lifecyclestage,hs_lead_status,hubspot_owner_id');
  const dealsResp = await apiCall('GET', '/crm/v3/objects/deals?limit=50&properties=dealname,dealstage,hubspot_owner_id,hs_lastmodifieddate');
  
  const contacts = contactsResp.results || [];
  const deals = dealsResp.results || [];
  
  console.log(`   ${contacts.length} contacts, ${deals.length} deals\n`);
  
  // Fix invalid lifecycle stages
  console.log('🔧 Fixing invalid lifecycle stages...');
  const invalidLifecycle = contacts.filter(c => {
    const stage = c.properties?.lifecyclestage;
    return stage && stage.match(/^\d+$/);
  });
  
  for (const contact of invalidLifecycle) {
    const newStage = 'lead';
    console.log(`   Fixing contact ${contact.id}: ${contact.properties.lifecyclestage} → ${newStage}`);
    await apiCall('PATCH', `/crm/v3/objects/contacts/${contact.id}`, {
      properties: { lifecyclestage: newStage }
    });
    log.push(`Fixed lifecycle stage for contact ${contact.id} (${contact.properties.email})`);
  }
  console.log(`   ✅ Fixed ${invalidLifecycle.length} contacts\n`);
  
  // Reclassify ATTEMPTED_TO_CONTACT → lead
  console.log('🔄 Reclassifying stuck contacts...');
  const stuckContacts = contacts.filter(c => 
    c.properties?.hs_lead_status === 'ATTEMPTED_TO_CONTACT'
  );
  
  for (const contact of stuckContacts) {
    console.log(`   Reclassifying ${contact.properties.email || contact.id}: ATTEMPTED_TO_CONTACT → NEW`);
    await apiCall('PATCH', `/crm/v3/objects/contacts/${contact.id}`, {
      properties: { 
        hs_lead_status: 'NEW',
        lifecyclestage: 'lead'
      }
    });
    log.push(`Reclassified contact ${contact.id} as fresh lead`);
  }
  console.log(`   ✅ Reclassified ${stuckContacts.length} contacts\n`);
  
  // Assign owners to unowned contacts
  console.log('👤 Assigning owners to unowned contacts...');
  const unowned = contacts.filter(c => !c.properties?.hubspot_owner_id);
  
  // Get owners
  const ownersResp = await apiCall('GET', '/crm/v3/owners');
  const firasId = ownersResp.results.find(o => o.email === 'firas@iiotsolutions.sa')?.id;
  const amrId = ownersResp.results.find(o => o.email === 'amr@iiotsolutions.sa')?.id;
  
  let assignedToFiras = 0, assignedToAmr = 0;
  
  for (const contact of unowned) {
    // Round-robin assignment
    const ownerId = (assignedToFiras <= assignedToAmr) ? firasId : amrId;
    const ownerName = (ownerId === firasId) ? 'Firas' : 'Amr';
    
    console.log(`   Assigning ${contact.properties.email || contact.id} → ${ownerName}`);
    await apiCall('PATCH', `/crm/v3/objects/contacts/${contact.id}`, {
      properties: { hubspot_owner_id: ownerId }
    });
    
    if (ownerId === firasId) assignedToFiras++;
    else assignedToAmr++;
    
    log.push(`Assigned contact ${contact.id} to ${ownerName}`);
  }
  console.log(`   ✅ Assigned ${unowned.length} contacts (Firas: ${assignedToFiras}, Amr: ${assignedToAmr})\n`);
  
  // Fix invalid deal stages
  console.log('💼 Fixing invalid deal stages...');
  const invalidDealStages = deals.filter(d => {
    const stage = d.properties?.dealstage;
    return stage && stage.match(/^\d+$/);
  });
  
  for (const deal of invalidDealStages) {
    // Map to actual stage name (default to qualification)
    const newStage = 'stage_1'; // Qualification stage
    console.log(`   Fixing deal ${deal.id}: ${deal.properties.dealstage} → ${newStage}`);
    await apiCall('PATCH', `/crm/v3/objects/deals/${deal.id}`, {
      properties: { dealstage: newStage }
    });
    log.push(`Fixed deal stage for ${deal.id} (${deal.properties.dealname})`);
  }
  console.log(`   ✅ Fixed ${invalidDealStages.length} deals\n`);
  
  // Save cleanup log
  const fs = require('fs');
  const logPath = '/root/.openclaw/workspace/hubspot-backup/cleanup-log.txt';
  const timestamp = new Date().toISOString();
  fs.writeFileSync(logPath, `Cleanup performed: ${timestamp}\n\n${log.join('\n')}\n`);
  
  console.log('✅ CLEANUP COMPLETE\n');
  console.log('📊 Summary:');
  console.log(`   - Fixed ${invalidLifecycle.length} invalid lifecycle stages`);
  console.log(`   - Reclassified ${stuckContacts.length} stuck contacts as fresh leads`);
  console.log(`   - Assigned ${unowned.length} unowned contacts (Firas: ${assignedToFiras}, Amr: ${assignedToAmr})`);
  console.log(`   - Fixed ${invalidDealStages.length} invalid deal stages`);
  console.log(`\n📝 Detailed log: ${logPath}`);
}

cleanup().catch(console.error);
