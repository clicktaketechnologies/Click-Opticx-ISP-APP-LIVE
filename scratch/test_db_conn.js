import pg from 'pg';

const { Client } = pg;

async function run() {
  const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.snmsvixlskwstvpuksbw',
    password: 'kLXmnB3sBA86wVSL',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    const res = await client.query("SELECT NOW()");
    console.log("Current Time:", res.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
