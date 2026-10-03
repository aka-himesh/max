import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    user: 'postgres.sldwxyxyirayfxvukcgo',
    password: 'EPk?smrD%a2ZFFu',
    host: 'aws-0-ap-southeast-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase Postgres via explicit config...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW() as now, current_database() as db;');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

testConnection();
