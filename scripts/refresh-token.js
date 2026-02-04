const fs = require('fs');
const https = require('https');

const token = JSON.parse(fs.readFileSync('config/google-token.json', 'utf8'));

const postData = new URLSearchParams({
  client_id: token.client_id,
  client_secret: token.client_secret,
  refresh_token: token.refresh_token,
  grant_type: 'refresh_token'
}).toString();

const req = https.request({
  hostname: 'oauth2.googleapis.com',
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Refresh status:', res.statusCode);
    if (res.statusCode === 200) {
      const newToken = JSON.parse(data);
      token.token = newToken.access_token;
      if (newToken.refresh_token) token.refresh_token = newToken.refresh_token;
      fs.writeFileSync('config/google-token.json', JSON.stringify(token, null, 2));
      console.log('✅ Token refreshed and saved!');
    } else {
      console.log('Error:', data);
    }
  });
});
req.write(postData);
req.end();
