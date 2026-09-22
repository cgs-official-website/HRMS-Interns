import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("rlwy.net") ? false : { rejectUnauthorized: false }
});

async function verifyEverything() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("📊 COMPLETE RAILWAY POSTGRESQL DATABASE AUDIT");
  console.log("==================================================");

  const tables = [
    "companies",
    "company_domains",
    "users",
    "roles",
    "environment_settings",
    "attendance",
    "leave_requests",
    "paid_leaves",
    "regularization_requests",
    "projects",
    "project_members",
    "tasks",
    "task_reports",
    "channels",
    "messages",
    "dm_threads",
    "direct_messages",
    "daily_reports",
    "weekly_reports",
    "assets",
    "notifications",
    "payroll",
    "external_links",
    "settings"
  ];

  const results = [];
  let totalRows = 0;
  for (const t of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) AS count FROM ${t}`);
      const count = parseInt(res.rows[0].count, 10);
      totalRows += count;
      results.push({ Table: t, "Total Rows in Railway": count, Status: count > 0 ? "🟢 Populated" : "⚪ Empty" });
    } catch (e) {
      results.push({ Table: t, "Total Rows in Railway": 0, Status: "⚠️ " + e.message });
    }
  }

  console.table(results);
  console.log(`\n🎉 Grand Total Records in Railway PostgreSQL: ${totalRows.toLocaleString()}`);

  client.release();
  await pool.end();
}

verifyEverything();
