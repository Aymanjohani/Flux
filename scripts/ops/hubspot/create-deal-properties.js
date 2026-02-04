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
          if (res.statusCode === 409) {
            console.log(`   ⚠️  Property already exists, skipping`);
            resolve({ exists: true });
          } else {
            reject(new Error(`API error ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createDealProperties() {
  console.log('🔧 Creating Deal Properties\n');
  
  const properties = [
    {
      name: 'project_size_estimate',
      label: 'Project Size Estimate',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'dealinformation',
      options: [
        { label: 'Small (< $50K)', value: 'small' },
        { label: 'Medium ($50K - $200K)', value: 'medium' },
        { label: 'Large ($200K - $500K)', value: 'large' },
        { label: 'Enterprise (> $500K)', value: 'enterprise' }
      ]
    },
    {
      name: 'decision_timeline',
      label: 'Decision Timeline',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'dealinformation',
      options: [
        { label: 'Q1 2026', value: 'q1_2026' },
        { label: 'Q2 2026', value: 'q2_2026' },
        { label: 'Q3 2026', value: 'q3_2026' },
        { label: 'Q4 2026', value: 'q4_2026' },
        { label: 'Beyond 2026', value: 'beyond_2026' },
        { label: 'Unknown', value: 'unknown' }
      ]
    }
  ];
  
  for (const prop of properties) {
    console.log(`📝 Creating: ${prop.label}`);
    try {
      await apiCall('POST', '/crm/v3/properties/deals', prop);
      console.log(`   ✅ Created successfully\n`);
    } catch (err) {
      console.log(`   ⚠️  ${err.message}\n`);
    }
  }
  
  console.log('✅ DEAL PROPERTIES COMPLETE');
}

createDealProperties().catch(console.error);
