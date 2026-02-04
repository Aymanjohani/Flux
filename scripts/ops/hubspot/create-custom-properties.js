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
          // Property might already exist, that's okay
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

async function createProperties() {
  console.log('🔧 Creating Custom Properties for IIoT Solutions\n');
  
  const properties = [
    {
      name: 'manufacturing_subsector',
      label: 'Manufacturing Subsector',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'Food & Beverage', value: 'food_beverage' },
        { label: 'Chemicals & Petrochemicals', value: 'chemicals' },
        { label: 'Automotive', value: 'automotive' },
        { label: 'Pharmaceutical', value: 'pharmaceutical' },
        { label: 'Plastics & Packaging', value: 'plastics' },
        { label: 'Steel & Metals', value: 'steel_metals' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Textiles', value: 'textiles' },
        { label: 'Building Materials', value: 'building_materials' },
        { label: 'Oil & Gas Equipment', value: 'oil_gas' },
        { label: 'Water Treatment', value: 'water_treatment' },
        { label: 'Other Manufacturing', value: 'other' }
      ]
    },
    {
      name: 'geographic_region',
      label: 'Geographic Region',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'Jeddah', value: 'jeddah' },
        { label: 'Riyadh', value: 'riyadh' },
        { label: 'Dammam / Eastern Province', value: 'eastern' },
        { label: 'Jubail Industrial City', value: 'jubail' },
        { label: 'Yanbu Industrial City', value: 'yanbu' },
        { label: 'Other Western Region', value: 'western_other' },
        { label: 'Other', value: 'other' }
      ]
    },
    {
      name: 'lead_temperature',
      label: 'Lead Temperature',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'Hot - Ready to Buy', value: 'hot' },
        { label: 'Warm - Interested', value: 'warm' },
        { label: 'Cold - Future Opportunity', value: 'cold' }
      ]
    },
    {
      name: 'lead_score_iiot',
      label: 'IIoT Lead Score',
      type: 'number',
      fieldType: 'number',
      groupName: 'contactinformation',
      description: 'Automated lead score (0-100) based on engagement and fit'
    },
    {
      name: 'competitive_status',
      label: 'Competitive Status',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'No Incumbent System', value: 'greenfield' },
        { label: 'Siemens Installed', value: 'siemens' },
        { label: 'ABB Installed', value: 'abb' },
        { label: 'Schneider Installed', value: 'schneider' },
        { label: 'Rockwell Installed', value: 'rockwell' },
        { label: 'Other Vendor', value: 'other' },
        { label: 'Unknown', value: 'unknown' }
      ]
    },
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
    },
    {
      name: 'lead_source_detail',
      label: 'Lead Source Detail',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'LinkedIn Outreach', value: 'linkedin_outreach' },
        { label: 'LinkedIn Inbound', value: 'linkedin_inbound' },
        { label: 'Website Form', value: 'website_form' },
        { label: 'Referral - Client', value: 'referral_client' },
        { label: 'Referral - Partner', value: 'referral_partner' },
        { label: 'Trade Show / Event', value: 'trade_show' },
        { label: 'Database Import', value: 'database_import' },
        { label: 'Cold Outreach', value: 'cold_outreach' },
        { label: 'Other', value: 'other' }
      ]
    },
    {
      name: 'last_contact_attempt',
      label: 'Last Contact Attempt Date',
      type: 'date',
      fieldType: 'date',
      groupName: 'contactinformation',
      description: 'When we last tried to reach this contact'
    },
    {
      name: 'next_followup_date',
      label: 'Next Follow-up Date',
      type: 'date',
      fieldType: 'date',
      groupName: 'contactinformation',
      description: 'Scheduled date for next contact'
    }
  ];
  
  console.log(`Creating ${properties.length} custom properties...\n`);
  
  for (const prop of properties) {
    console.log(`📝 Creating: ${prop.label}`);
    try {
      await apiCall('POST', '/crm/v3/properties/contacts', prop);
      console.log(`   ✅ Created successfully\n`);
    } catch (err) {
      console.log(`   ⚠️  ${err.message}\n`);
    }
  }
  
  console.log('✅ CUSTOM PROPERTIES SETUP COMPLETE\n');
  console.log('These fields are now available in HubSpot for:');
  console.log('- Manual data entry');
  console.log('- Excel imports');
  console.log('- Workflow automation');
  console.log('- Reporting & segmentation');
}

createProperties().catch(console.error);
