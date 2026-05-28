import pg from 'pg';

const { Client } = pg;

const regions = [
  'ap-southeast-1', // Singapore
  'ap-south-1',     // Mumbai
  'us-east-1',      // N. Virginia
  'us-east-2',      // Ohio
  'us-west-1',      // N. California
  'us-west-2',      // Oregon
  'eu-central-1',   // Frankfurt
  'eu-west-1',      // Ireland
  'eu-west-2',      // London
  'eu-west-3',      // Paris
  'ap-northeast-1', // Tokyo
  'ap-northeast-2', // Seoul
  'sa-east-1',      // Sao Paulo
  'ca-central-1',   // Canada
  'ap-southeast-2'  // Sydney
];

async function testRegion(region) {
  for (const num of [0, 1]) {
    const host = `aws-${num}-${region}.pooler.supabase.com`;
    const client = new Client({
      host,
      port: 6543,
      user: 'postgres.htbutmhjydwfpyeeoowd',
      password: 'kLXmnB3sBA86wVSL',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Connected to ${host}`);
      const res = await client.query("SELECT NOW()");
      console.log("Time:", res.rows[0]);
      await client.end();
      return host;
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('ENOTFOUND')) {
        // Expected if region is incorrect or dns lookup fails
      } else {
        console.log(`Connection error on ${host}:`, err.message);
      }
    }
  }
  return null;
}

async function run() {
  for (const region of regions) {
    const result = await testRegion(region);
    if (result) {
      console.log(`\nFound correct pooler host: ${result}`);
      break;
    }
  }
}

run();
