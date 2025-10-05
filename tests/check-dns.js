// check-dns.js
const dns = require('dns');

const hosts = [
  'db.rwxgpbikdxlialoegghq.supabase.co',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'rwxgpbikdxlialoegghq.supabase.co'
];

hosts.forEach(host => {
  dns.lookup(host, (err, address) => {
    if (err) {
      console.log(`❌ ${host} - NOT FOUND`);
    } else {
      console.log(`✅ ${host} - EXISTS (${address})`);
    }
  });
});