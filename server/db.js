import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load parent .env configuration
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const connectionString = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL ERROR: DATABASE_URL or VITE_DATABASE_URL is not set in environment.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

export { pool };
