import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCounts() {
  const client = await pool.connect();
  const tables = [
    "assets", "paid_leaves", "weekly_reports", "external_links", "settings",
    "dm_threads", "messages", "project_members", "task_reports", "notifications"
  ];
  console.log("==================================================");
  console.log("📊 CURRENT SECONDARY TABLE COUNTS IN RAILWAY DB");
  console.log("==================================================");
  const results = [];
  for (const t of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) AS count FROM ${t}`);
      results.push({ Table: t, Count: parseInt(res.rows[0].count, 10) });
    } catch (e) {
      results.push({ Table: t, Count: "Error: " + e.message });
    }
  }
  console.table(results);
  client.release();
  await pool.end();
}

checkCounts();
