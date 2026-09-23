// Migration script — run once
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:wbmoHIZoKMKVvFhmAHgDYLUdVhZCcTzq@kodama.proxy.rlwy.net:52896/railway",
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running migrations...");

    // Migration 1 — Add columns to tasks table
    await client.query(`
      ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS task_date DATE,
        ADD COLUMN IF NOT EXISTS start_time TEXT,
        ADD COLUMN IF NOT EXISTS end_time TEXT,
        ADD COLUMN IF NOT EXISTS report_status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS report_submitted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;
    `);
    console.log("✅ tasks table columns added");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_notification_check
        ON tasks(task_date, notification_sent, report_status);
    `);
    console.log("✅ tasks index created");

    // Migration 2 — Create push_subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
      );
    `);
    console.log("✅ push_subscriptions table created");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_push_subs_company ON push_subscriptions(company_id);
    `);
    console.log("✅ push_subscriptions indexes created");

    console.log("🎉 All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
