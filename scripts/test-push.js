const https = require('https');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET is not defined in .env or .env.local');
  process.exit(1);
}

console.log('🚀 Triggering daily push notification...');
console.log(`🔗 URL: ${APP_URL}/api/notifications/daily-quote?secret=${CRON_SECRET}`);

const url = new URL(`${APP_URL}/api/notifications/daily-quote?secret=${CRON_SECRET}`);

const req = (url.protocol === 'https:' ? require('https') : require('http')).request(
  url,
  {
    method: 'POST',
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`\n📡 Response Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log('📦 Response Body:', JSON.stringify(json, null, 2));
        
        if (json.success) {
          console.log('\n✅ Success! Notification broadcast triggered.');
          console.log(`📝 Quote: "${json.quote}"`);
          console.log(`🔔 Notifications Sent: ${json.notificationsSent}/${json.totalSubscriptions}`);
        } else {
          console.log('\n❌ Failed: ' + (json.error || 'Unknown error'));
        }
      } catch (e) {
        console.log('📄 Response Text:', data);
      }
    });
  }
);

req.on('error', (error) => {
  console.error('\n❌ Request Error:', error.message);
});

req.end();
