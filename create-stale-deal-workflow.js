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

async function createWorkflow() {
  console.log('🔧 Creating Stale Deal Alert Workflow\n');
  
  // Get Ayman's owner ID for notifications
  const owners = await apiCall('GET', '/crm/v3/owners');
  const aymanId = owners.results.find(o => o.email === 'ayman@iiotsolutions.sa')?.id;
  
  console.log(`Found Ayman's owner ID: ${aymanId}\n`);
  
  const workflow = {
    name: '🚨 Stale Deal Alert (14+ Days No Activity)',
    type: 'DEAL_WORKFLOW',
    enabled: true,
    actions: [
      {
        type: 'DELAY',
        delayMillis: 0
      },
      {
        type: 'SEND_NOTIFICATION',
        notification: {
          toOwner: true,
          subject: '🚨 Stale Deal Alert: {{deal.dealname}}',
          body: 'This deal has not been updated in 14+ days.\n\nDeal: {{deal.dealname}}\nStage: {{deal.dealstage}}\nAmount: {{deal.amount}}\nOwner: {{deal.hubspot_owner_id}}\n\nAction needed: Review and update or close this deal.'
        }
      }
    ],
    enrollmentCriteria: {
      filterBranches: [
        {
          filterBranchType: 'AND',
          filters: [
            {
              filterType: 'PROPERTY',
              property: 'dealstage',
              operator: 'NOT_IN',
              values: ['closedwon', 'closedlost']
            },
            {
              filterType: 'PROPERTY',
              property: 'hs_lastmodifieddate',
              operator: 'IS_BEFORE_DATE',
              value: 'NOW_MINUS_14_DAYS'
            }
          ]
        }
      ]
    },
    reenrollment: {
      enabled: true,
      type: 'PROPERTY_UPDATE',
      property: 'hs_lastmodifieddate'
    }
  };
  
  try {
    const result = await apiCall('POST', '/automation/v4/workflows', workflow);
    console.log('✅ Workflow created successfully!');
    console.log(`   Workflow ID: ${result.id}`);
    console.log(`   Name: ${result.name}`);
  } catch (err) {
    console.log('❌ Workflow creation failed via API');
    console.log(`   Error: ${err.message}\n`);
    console.log('📋 Creating manual setup guide instead...\n');
  }
}

createWorkflow().catch(console.error);
