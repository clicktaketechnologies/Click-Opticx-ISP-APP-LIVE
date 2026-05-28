import pg from 'pg';

const { Client } = pg;

const passwords = [
  'kLXmnB3sBA86wVSL',
  'Click@Opticx2026',
  'Click@Opticx2025',
  'Click@Opticx',
  'co_prod_secure_77x99_kLXmnB3sBA86wVSL',
  'postgres',
  'admin'
];

async function testPassword(password) {
  const client = new Client({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.snmsvixlskwstvpuksbw',
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(`🎉 SUCCESS! Connected with password: ${password}`);
    const res = await client.query("SELECT NOW()");
    console.log("Time:", res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for password '${password}':`, err.message);
    return false;
  }
}

async function run() {
  for (const pw of passwords) {
    const ok = await testPassword(pw);
    if (ok) break;
  }
}

run();
