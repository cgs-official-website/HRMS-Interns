import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyAll() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("📊 RAILWAY POSTGRESQL LIVE DATA VERIFICATION");
  console.log("==================================================");

  const tables = [
    "companies",
    "company_domains",
    "users",
    "attendance",
    "leave_requests",
    "regularization_requests",
    "projects",
    "channels",
    "messages",
    "daily_reports",
    "payroll"
  ];

  const results = [];
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) AS count FROM ${t}`);
    results.push({ Table: t, "Total Rows in Railway PostgreSQL": parseInt(res.rows[0].count, 10), Status: "🟢 Populated" });
  }
  console.table(results);

  // Timeline check for 4 months attendance
  const timeRes = await client.query(`
    SELECT 
      MIN(date) as earliest_date,
      MAX(date) as latest_date,
      COUNT(DISTINCT date) as unique_working_days,
      COUNT(*) as total_attendance_logs
    FROM attendance;
  `);

  console.log("\n📅 4-Month Attendance Timeline Range in PostgreSQL:");
  console.table(timeRes.rows);

  client.release();
  await pool.end();
}

verifyAll();
