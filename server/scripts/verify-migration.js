import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is missing.");
  console.log("Usage: node scripts/verify-migration.js <DATABASE_URL>");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const backupFile = path.resolve(__dirname, "../backup/firestore_export_latest.json");

if (!fs.existsSync(backupFile)) {
  console.error("❌ ERROR: Backup file not found.");
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(backupFile, "utf8"));
const { collections = {} } = rawData;

async function verify() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("🔍 POSTGRESQL MIGRATION INTEGRITY & AUDIT VERIFIER");
  console.log("==================================================");

  try {
    const tableChecks = [
      { name: "companies", jsonKey: "companies" },
      { name: "company_domains", jsonKey: "companyDomains" },
      { name: "users", jsonKey: "users" },
      { name: "attendance", jsonKey: "attendance" },
      { name: "leave_requests", jsonKey: "leave_requests" },
      { name: "projects", jsonKey: "projects" }
    ];

    const results = [];

    for (const check of tableChecks) {
      const res = await client.query(`SELECT COUNT(*) AS count FROM ${check.name}`);
      const pgCount = parseInt(res.rows[0].count, 10);
      const jsonCount = (collections[check.jsonKey] || []).length;
      
      results.push({
        Table: check.name,
        "Firestore Export Count": jsonCount,
        "PostgreSQL DB Count": pgCount,
        Status: pgCount >= jsonCount ? "✅ MATCH / OK" : "⚠️ MISMATCH"
      });
    }

    // Check attendance date span
    const dateSpanRes = await client.query(`
      SELECT 
        MIN(date) as earliest_date, 
        MAX(date) as latest_date, 
        COUNT(DISTINCT date) as total_unique_days,
        COUNT(*) as total_attendance_logs
      FROM attendance;
    `);

    console.table(results);

    console.log("\n📊 4-Month Attendance Timeline Verification:");
    console.table(dateSpanRes.rows);

  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
