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

async function importRemaining() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("🚀 IMPORTING ALL REMAINING TABLES INTO RAILWAY DB");
  console.log("==================================================");

  try {
    // Helper ensure
    const ensureCompany = async (compId) => {
      if (!compId) return null;
      await client.query(
        `INSERT INTO companies (id, name, status) VALUES ($1, $2, 'active') ON CONFLICT (id) DO NOTHING`,
        [compId, compId]
      );
      return compId;
    };

    const ensureUser = async (userId, compId = null) => {
      if (!userId) return null;
      if (compId) await ensureCompany(compId);
      await client.query(
        `INSERT INTO users (id, company_id, email, name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [userId, compId || null, `${userId}@system.local`, "Staff Member"]
      );
      return userId;
    };

    // 1. ASSETS (8 records)
    const assets = collections.assets || [];
    console.log(`1. Importing Assets (${assets.length} records)...`);
    for (const a of assets) {
      if (a.companyId) await ensureCompany(a.companyId);
      if (a.assignedTo) await ensureUser(a.assignedTo, a.companyId);

      await client.query(
        `INSERT INTO assets (id, company_id, assigned_to, name, asset_tag, category, serial_number, status, purchase_date, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status`,
        [
          a._id, a.companyId || null, a.assignedTo || null, a.name || a.assetName || "Asset",
          a.assetTag || a.tag || null, a.category || null, a.serialNumber || null, a.status || "available",
          toDateOnly(a.purchaseDate), toJson(a), toDate(a.createdAt), toDate(a.updatedAt)
        ]
      );
    }
    console.log("✅ Assets ready.");

    // 2. PAID LEAVES (2 records)
    const paidLeaves = collections.paid_leaves || [];
    console.log(`2. Importing Paid Leaves (${paidLeaves.length} records)...`);
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

    // 3. WEEKLY REPORTS (20 records)
    const weeklyReports = collections.weekly_reports || [];
    console.log(`3. Importing Weekly Reports (${weeklyReports.length} records)...`);
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

    // 4. EXTERNAL LINKS (6 records)
    const extLinks = collections.external_links || [];
    console.log(`4. Importing External Links (${extLinks.length} records)...`);
    for (const el of extLinks) {
      if (el.companyId) await ensureCompany(el.companyId);
      if (el.userId) await ensureUser(el.userId, el.companyId);
      if (el.projectId) {
        await client.query(
          `INSERT INTO projects (id, company_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          [el.projectId, el.companyId || null, el.projectName || "Project"]
        );
      }

      await client.query(
        `INSERT INTO external_links (id, company_id, user_id, project_id, project_name, pm_id, pm_name, client_email, client_name, link_token, channel_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          el._id, el.companyId || null, el.userId || null, el.projectId || null, el.projectName || null,
          el.pmId || null, el.pmName || null, el.clientEmail || null, el.clientName || null,
          el.linkToken || el._id, el.channelId || null, el.status || "active", toDate(el.createdAt)
        ]
      );
    }
    console.log("✅ External Links ready.");

    // 5. SETTINGS (1 record)
    const settings = collections.settings || [];
    console.log(`5. Importing Settings (${settings.length} records)...`);
    for (const s of settings) {
      await client.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [s._id, toJson(s), toDate(s.updatedAt)]
      );
    }
    console.log("✅ Settings ready.");

    // 6. DM THREADS (74 records)
    const dmThreads = collections.dm_threads || [];
    console.log(`6. Importing DM Threads (${dmThreads.length} records)...`);
    for (const d of dmThreads) {
      if (d.companyId) await ensureCompany(d.companyId);
      const participants = Array.isArray(d.participants) ? d.participants : [];
      await client.query(
        `INSERT INTO dm_threads (id, company_id, participants, last_message, last_message_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          d._id, d.companyId || null, participants, d.lastMessage || null,
          toDate(d.lastMessageAt || d.updatedAt), toDate(d.createdAt)
        ]
      );
    }
    console.log("✅ DM Threads ready.");

    // 7. CHANNELS & MESSAGES (392 records)
    const msgs = collections.messages || [];
    console.log(`7. Importing Messages (${msgs.length} records)...`);
    for (const m of msgs) {
      const channelId = m.channelId || m.channel_id || "general";
      if (m.companyId) await ensureCompany(m.companyId);
      if (m.userId) await ensureUser(m.userId, m.companyId, m.userName);

      await client.query(
        `INSERT INTO channels (id, company_id, name, description)
         VALUES ($1, $2, 'General', 'Imported Channel')
         ON CONFLICT (id) DO NOTHING`,
        [channelId, m.companyId || null]
      );

      await client.query(
        `INSERT INTO messages (id, company_id, channel_id, user_id, user_name, user_avatar, content, file_url, file_name, file_type, reactions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          m._id, m.companyId || null, channelId, m.userId || null,
          m.userName || m.senderName || "User", m.userAvatar || null, m.content || m.text || "",
          m.fileUrl || m.file || null, m.fileName || null, m.fileType || null,
          toJson(m.reactions || {}), toDate(m.createdAt || m.timestamp)
        ]
      );
    }
    console.log("✅ Messages ready.");

    // 8. PROJECT MEMBERS
    console.log("8. Populating Project Members...");
    const projects = collections.projects || [];
    let memberCount = 0;
    for (const p of projects) {
      if (p.companyId) await ensureCompany(p.companyId);
      const members = Array.isArray(p.teamMembers) ? p.teamMembers : (p.managerId ? [p.managerId] : []);
      for (const uid of members) {
        if (!uid) continue;
        await ensureUser(uid, p.companyId);
        await client.query(
          `INSERT INTO project_members (project_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [p._id, uid]
        );
        memberCount++;
      }
    }
    console.log(`✅ Project Members (${memberCount}) ready.`);

    // 9. TASK REPORTS (1,060 records in chunks)
    const taskReports = collections.task_reports || [];
    console.log(`9. Bulk importing Task Reports (${taskReports.length} records)...`);
    const trChunk = 100;
    for (let i = 0; i < taskReports.length; i += trChunk) {
      const chunk = taskReports.slice(i, i + trChunk);
      const placeholders = [];
      const params = [];
      let pIdx = 1;

      for (const tr of chunk) {
        const uid = tr.userId || tr.uid || null;
        if (uid) await ensureUser(uid, tr.companyId);

        placeholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6})`);
        params.push(
          tr._id, tr.taskId || tr.task_id || null, uid,
          tr.companyId || null, tr.content || tr.report || tr.tasksCompleted || tr.description || "Task update",
          Number(tr.timeSpentMinutes || tr.timeSpent || 0), toDate(tr.submittedAt || tr.createdAt || tr.date)
        );
        pIdx += 7;
      }

      if (placeholders.length > 0) {
        await client.query(
          `INSERT INTO task_reports (id, task_id, user_id, company_id, content, time_spent_minutes, submitted_at)
           VALUES ${placeholders.join(", ")}
           ON CONFLICT (id) DO NOTHING`,
          params
        );
      }
    }
    console.log("✅ Task Reports ready.");

    // 10. NOTIFICATIONS (9,527 records in fast chunks)
    const notifs = collections.notifications || [];
    console.log(`10. Bulk importing Notifications (${notifs.length} records in chunks)...`);
    const nChunk = 200;
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
    console.log("🎉 ALL REMAINING TABLES ARE 100% POPULATED!");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Error importing remaining tables:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importRemaining().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
