import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

async function main() {
  try {
    console.log('Testing connection to PostgreSQL at', process.env.PG_HOST, 'db:', process.env.PG_DATABASE, 'user:', process.env.PG_USER);
    const client = await pool.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('✅ Connection Success!', res.rows[0]);
    client.release();
    await pool.end();
  } catch (err: any) {
    console.error('❌ Connection Failed:', err.message);
  }
}

main();
