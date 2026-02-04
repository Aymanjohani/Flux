const { execSync } = require('child_process');
const fs = require('fs');

async function scanData() {
  console.log('🔍 Scanning HubSpot data...\n');
  
  // Scan contacts
  console.log('📇 Contacts:');
  const contacts = execSync('cd skills/hubspot && node cli.js contacts list --limit 200 --properties firstname,lastname,email,lifecyclestage,hs_lead_status', { encoding: 'utf8' });
  
  // Scan companies
  console.log('\n🏢 Companies:');
  const companies = execSync('cd skills/hubspot && node cli.js companies list --limit 100', { encoding: 'utf8' });
  
  // Scan deals
  console.log('\n💼 Deals:');
  const deals = execSync('cd skills/hubspot && node cli.js deals list --limit 50', { encoding: 'utf8' });
  
  console.log('\n✅ Scan complete');
}

scanData().catch(console.error);
