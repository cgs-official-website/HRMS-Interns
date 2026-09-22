import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const backupFile = path.resolve(__dirname, "../backup/firestore_export_latest.json");
const rawData = JSON.parse(fs.readFileSync(backupFile, "utf8"));
const { collections = {} } = rawData;

const toJson = (val) => JSON.stringify(val ?? {});
const toDate = (val) => val ? new Date(val).toISOString() : new Date().toISOString();
const toDateOnly = (val) => val ? new Date(val).toISOString().split("T")[0] : null;

async function fixAndImport() {
  const client = await pool.connect();
  console.log("Fixing and populating paid_leaves and weekly_reports...");

  // Adjust paid_leaves table to match Firestore structure
  await client.query(`
    DROP TABLE IF EXISTS paid_leaves CASCADE;
    CREATE TABLE paid_leaves (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      title TEXT,
      start_date DATE,
      end_date DATE,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert Paid Leaves
  const paidLeaves = collections.paid_leaves || [];
  for (const pl of paidLeaves) {
    await client.query(
      `INSERT INTO paid_leaves (id, company_id, title, start_date, end_date, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
      [
        pl._id, pl.companyId || null, pl.title || "Holiday",
        toDateOnly(pl.startDate), toDateOnly(pl.endDate || pl.startDate),
        pl.description || null, pl.status || "active", toDate(pl.createdAt)
      ]
    );
  }
  console.log(`✅ Paid Leaves (${paidLeaves.length}) inserted.`);

  // Insert Weekly Reports
  const weeklyReports = collections.weekly_reports || [];
  for (const wr of weeklyReports) {
    const uid = wr.employeeId || wr.userId || wr.managerId || "unknown";
    const weekStart = toDateOnly(wr.weekStartDate || wr.weekStart || wr.startDate || wr.createdAt) || new Date().toISOString().split("T")[0];
    const weekEnd = toDateOnly(wr.weekEndDate || wr.weekEnd || wr.endDate || wr.createdAt) || weekStart;

    await client.query(
      `INSERT INTO weekly_reports (id, user_id, company_id, week_start, week_end, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content`,
      [
        wr._id, uid, wr.companyId || null, weekStart, weekEnd,
        toJson(wr), toDate(wr.createdAt), toDate(wr.updatedAt || wr.createdAt)
      ]
    );
  }
  console.log(`✅ Weekly Reports (${weeklyReports.length}) inserted.`);

  client.release();
  await pool.end();
}

fixAndImport().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
