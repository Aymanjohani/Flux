const fs = require('fs');
const https = require('https');

const token = JSON.parse(fs.readFileSync('config/google-token.json', 'utf8'));

// Test Gmail API
const gmailReq = https.request({
  hostname: 'gmail.googleapis.com',
  path: '/gmail/v1/users/me/profile',
  headers: { 'Authorization': `Bearer ${token.token}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Gmail API:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ Gmail working:', JSON.parse(data).emailAddress);
    } else {
      console.log('Response:', data);
    }
  });
});
gmailReq.end();

// Test Calendar API
const calReq = https.request({
  hostname: 'www.googleapis.com',
  path: '/calendar/v3/calendars/primary',
  headers: { 'Authorization': `Bearer ${token.token}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Calendar API:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ Calendar working:', JSON.parse(data).summary);
    } else {
      console.log('Response:', data);
    }
  });
});
calReq.end();
