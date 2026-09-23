// Migration: Create hourly_report_reminders table
// Run once: node server/scripts/migrate-hourly-reminders.js
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running hourly_report_reminders migration...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS hourly_report_reminders (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
        reminder_date DATE NOT NULL,
        interval_start TEXT NOT NULL,
        interval_end TEXT NOT NULL,
        notification_sent BOOLEAN DEFAULT FALSE,
        notification_sent_at TIMESTAMPTZ,
        report_found BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, reminder_date, interval_start)
      );
    `);
    console.log("✅ hourly_report_reminders table created");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hrr_user_date
        ON hourly_report_reminders(user_id, reminder_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hrr_company_date
        ON hourly_report_reminders(company_id, reminder_date);
    `);
    console.log("✅ hourly_report_reminders indexes created");

    console.log("🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
