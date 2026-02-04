const fs = require('fs');

const contacts = JSON.parse(fs.readFileSync('hubspot-backup/contacts-raw.json', 'utf8'));
const companies = JSON.parse(fs.readFileSync('hubspot-backup/companies-raw.json', 'utf8'));
const deals = JSON.parse(fs.readFileSync('hubspot-backup/deals-raw.json', 'utf8'));
const owners = JSON.parse(fs.readFileSync('hubspot-backup/owners-raw.json', 'utf8'));

console.log('📊 HUBSPOT DATA QUALITY ANALYSIS');
console.log('=' .repeat(60));
console.log('');

// Contacts Analysis
console.log('📇 CONTACTS ANALYSIS');
console.log(`Total: ${contacts.results?.length || 0}`);

const lifecycleIssues = contacts.results?.filter(c => {
  const stage = c.properties?.lifecyclestage;
  return !stage || stage.match(/^\d+$/); // Numeric stages are invalid
});
console.log(`⚠️  Invalid lifecycle stages: ${lifecycleIssues?.length || 0}`);

const leadStatusIssues = contacts.results?.filter(c => {
  const status = c.properties?.hs_lead_status;
  return status === 'ATTEMPTED_TO_CONTACT' || !status;
});
console.log(`⚠️  Stuck in ATTEMPTED_TO_CONTACT or no status: ${leadStatusIssues?.length || 0}`);

const noOwner = contacts.results?.filter(c => !c.properties?.hubspot_owner_id);
console.log(`⚠️  No owner assigned: ${noOwner?.length || 0}`);

const noEmail = contacts.results?.filter(c => !c.properties?.email);
console.log(`⚠️  Missing email: ${noEmail?.length || 0}`);

console.log('');

// Companies Analysis
console.log('🏢 COMPANIES ANALYSIS');
console.log(`Total: ${companies.results?.length || 0}`);

const noIndustry = companies.results?.filter(c => !c.properties?.industry);
console.log(`⚠️  Missing industry: ${noIndustry?.length || 0}`);

const noDomain = companies.results?.filter(c => !c.properties?.domain);
console.log(`⚠️  Missing domain: ${noDomain?.length || 0}`);

console.log('');

// Deals Analysis
console.log('💼 DEALS ANALYSIS');
console.log(`Total: ${deals.results?.length || 0}`);

const invalidStages = deals.results?.filter(d => {
  const stage = d.properties?.dealstage;
  return stage?.match(/^\d+$/); // Numeric stages are invalid
});
console.log(`⚠️  Invalid deal stages (numeric IDs): ${invalidStages?.length || 0}`);

const staleDeals = deals.results?.filter(d => {
  const lastModified = new Date(d.properties?.hs_lastmodifieddate);
  const now = new Date();
  const daysDiff = (now - lastModified) / (1000 * 60 * 60 * 24);
  const stage = d.properties?.dealstage;
  return daysDiff > 14 && stage !== 'closedwon' && stage !== 'closedlost';
});
console.log(`⚠️  Stale deals (>14 days no update, not closed): ${staleDeals?.length || 0}`);

const noAmount = deals.results?.filter(d => !d.properties?.amount);
console.log(`⚠️  Missing deal amount: ${noAmount?.length || 0}`);

const dealNoOwner = deals.results?.filter(d => !d.properties?.hubspot_owner_id);
console.log(`⚠️  No owner assigned: ${dealNoOwner?.length || 0}`);

console.log('');

// Owners
console.log('👥 OWNERS');
owners.results?.forEach(o => {
  console.log(`   ${o.firstName} ${o.lastName} (${o.email}) - ID: ${o.id}`);
});

console.log('');
console.log('=' .repeat(60));
console.log('');

// Summary
const totalIssues = 
  (lifecycleIssues?.length || 0) + 
  (leadStatusIssues?.length || 0) + 
  (noOwner?.length || 0) +
  (noEmail?.length || 0) +
  (noIndustry?.length || 0) +
  (noDomain?.length || 0) +
  (invalidStages?.length || 0) +
  (staleDeals?.length || 0) +
  (noAmount?.length || 0) +
  (dealNoOwner?.length || 0);

console.log(`🎯 SUMMARY: ${totalIssues} data quality issues found`);
console.log('');

if (totalIssues > 0) {
  console.log('📋 RECOMMENDED ACTIONS:');
  console.log('1. Fix invalid lifecycle stages (numeric IDs → proper names)');
  console.log('2. Update contacts stuck in ATTEMPTED_TO_CONTACT');
  console.log('3. Assign owners to unowned records');
  console.log('4. Fill missing critical fields (email, industry, amount)');
  console.log('5. Review and close stale deals');
  console.log('6. Standardize naming conventions');
}
