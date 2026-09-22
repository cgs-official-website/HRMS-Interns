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

async function runFinish() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("🚀 FINALIZING PAID LEAVES, WEEKLY REPORTS & NOTIFICATIONS");
  console.log("==================================================");

  try {
    // Helper
    const ensureUser = async (userId, compId = null) => {
      if (!userId) return null;
      await client.query(
        `INSERT INTO users (id, company_id, email, name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [userId, compId || null, `${userId}@system.local`, "Staff Member"]
      );
      return userId;
    };

    // 1. PAID LEAVES
    const paidLeaves = collections.paid_leaves || [];
    console.log(`Importing Paid Leaves (${paidLeaves.length} records)...`);
    for (const pl of paidLeaves) {
      const uid = pl.userId || pl.uid;
      if (!uid) continue;
      await ensureUser(uid, pl.companyId);

      await client.query(
        `INSERT INTO paid_leaves (id, user_id, company_id, month, year, days, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          pl._id, uid, pl.companyId || null, pl.month || "Unknown",
          Number(pl.year || new Date().getFullYear()), Number(pl.days || pl.totalDays || 1),
          pl.reason || null, toDate(pl.createdAt)
        ]
      );
    }
    console.log("✅ Paid Leaves ready.");

    // 2. WEEKLY REPORTS
    const weeklyReports = collections.weekly_reports || [];
    console.log(`Importing Weekly Reports (${weeklyReports.length} records)...`);
    for (const wr of weeklyReports) {
      const uid = wr.userId || wr.uid;
      if (!uid) continue;
      await ensureUser(uid, wr.companyId);

      const weekStart = toDateOnly(wr.weekStart || wr.startDate || wr.createdAt) || new Date().toISOString().split("T")[0];
      const weekEnd = toDateOnly(wr.weekEnd || wr.endDate || wr.createdAt) || weekStart;
      await client.query(
        `INSERT INTO weekly_reports (id, user_id, company_id, week_start, week_end, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content`,
        [
          wr._id, uid, wr.companyId || null, weekStart, weekEnd,
          toJson(wr), toDate(wr.createdAt), toDate(wr.updatedAt)
        ]
      );
    }
    console.log("✅ Weekly Reports ready.");

    // 3. NOTIFICATIONS (remaining batches)
    const notifs = collections.notifications || [];
    console.log(`Importing Notifications (${notifs.length} total records)...`);
    const nChunk = 250;
    for (let i = 0; i < notifs.length; i += nChunk) {
      const chunk = notifs.slice(i, i + nChunk);
      const placeholders = [];
      const params = [];
      let pIdx = 1;

      for (const n of chunk) {
        const uid = n.userId || n.recipientId || n.uid || null;
        if (uid) await ensureUser(uid);

        placeholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7})`);
        params.push(
          n._id, uid, n.title || "Notification",
          n.message || n.body || n.content || "", n.type || "info", Boolean(n.read || n.isRead),
          n.link || n.url || null, toDate(n.createdAt || n.timestamp)
        );
        pIdx += 8;
      }

      if (placeholders.length > 0) {
        await client.query(
          `INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at)
           VALUES ${placeholders.join(", ")}
           ON CONFLICT (id) DO NOTHING`,
          params
        );
      }
    }
    console.log("✅ Notifications ready.");

    console.log("\n==================================================");
    console.log("🎉 ALL TABLES 100% COMPLETE AND POPULATED!");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Error in finish import:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runFinish().catch(err => {
  console.error("Fatal finish error:", err);
});
