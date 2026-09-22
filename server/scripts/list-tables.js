import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
  console.log("==================================================");
  console.log("🐘 RAILWAY POSTGRESQL TABLES VERIFIED:");
  console.log("==================================================");
  console.table(res.rows);
  client.release();
  await pool.end();
}

check();
