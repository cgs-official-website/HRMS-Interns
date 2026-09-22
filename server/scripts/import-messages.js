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

async function importMessagesAndDomains() {
  const client = await pool.connect();
  console.log("Importing Company Domains & Messages...");

  // Domains
  const domains = collections.companyDomains || [];
  for (const d of domains) {
    await client.query(
      `INSERT INTO company_domains (domain, company_id, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (domain) DO UPDATE SET company_id = EXCLUDED.company_id`,
      [d._id || d.domain, d.companyId || null, d.status || "VERIFIED", d.createdBy || null, toDate(d.createdAt)]
    );
  }
  console.log(`✅ Company Domains (${domains.length}) imported.`);

  // Messages
  const msgs = collections.messages || [];
  let msgCount = 0;
  for (const m of msgs) {
    const channelId = m.channelId || m.channel_id;
    if (!channelId) continue;

    // Ensure channel exists
    await client.query(
      `INSERT INTO channels (id, company_id, name, description)
       VALUES ($1, $2, 'General', 'Imported Channel')
       ON CONFLICT (id) DO NOTHING`,
      [channelId, m.companyId || null]
    );

    await client.query(
      `INSERT INTO messages (id, company_id, channel_id, user_id, user_name, user_avatar, content, file_url, reactions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        m._id,
        m.companyId || null,
        channelId,
        m.userId || m.senderId || null,
        m.userName || m.senderName || "User",
        m.userAvatar || null,
        m.content || m.text || "",
        m.fileUrl || m.file || null,
        toJson(m.reactions || {}),
        toDate(m.createdAt || m.timestamp)
      ]
    );
    msgCount++;
  }
  console.log(`✅ Messages (${msgCount}) imported.`);

  client.release();
  await pool.end();
}

importMessagesAndDomains();
