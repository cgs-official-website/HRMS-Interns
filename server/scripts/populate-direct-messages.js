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
  ssl: process.env.DATABASE_URL?.includes("rlwy.net") ? false : { rejectUnauthorized: false }
});

const backupFile = path.resolve(__dirname, "../backup/firestore_export_latest.json");
const rawData = JSON.parse(fs.readFileSync(backupFile, "utf8"));
const { collections = {} } = rawData;

const toDate = (val) => val ? new Date(val).toISOString() : new Date().toISOString();

async function batchInsert(client, table, columns, rows, chunkSize = 100) {
  if (!rows || rows.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valueTuples = [];
    const params = [];
    let pIdx = 1;
    for (const row of chunk) {
      const placeholders = [];
      for (let c = 0; c < columns.length; c++) {
        placeholders.push(`$${pIdx++}`);
        params.push(row[c]);
      }
      valueTuples.push(`(${placeholders.join(", ")})`);
    }
    const query = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES ${valueTuples.join(",\n")}
      ON CONFLICT DO NOTHING;
    `;
    await client.query(query, params);
    inserted += chunk.length;
  }
  return inserted;
}

async function populateDirectMessages() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("💬 POPULATING DIRECT_MESSAGES TABLE (FAST BATCH)");
  console.log("==================================================");

  const msgs = collections.messages || [];
  const dmThreads = collections.dm_threads || [];
  const dmThreadIds = new Set(dmThreads.map(d => d._id));

  for (const m of msgs) {
    const tid = m.threadId || m.thread_id || m.channelId;
    if (tid && (tid.includes("_dm_") || dmThreadIds.has(tid))) {
      dmThreadIds.add(tid);
    }
  }

  // 1. Batch insert DM threads
  const threadRows = [];
  for (const tid of dmThreadIds) {
    const parts = tid.split("_dm_");
    threadRows.push([tid, parts.length === 2 ? parts : [], new Date().toISOString()]);
  }
  await batchInsert(client, "dm_threads", ["id", "participants", "created_at"], threadRows);
  console.log(`✅ ${threadRows.length} DM threads verified/inserted.`);

  // 2. Ensure all senders exist in users table
  const senderMap = new Map();
  for (const m of msgs) {
    const senderId = m.senderId || m.userId || m.sender?.id || null;
    if (senderId && !senderMap.has(senderId)) {
      senderMap.set(senderId, [
        senderId,
        `${senderId}@system.local`,
        m.senderName || m.userName || "Staff Member"
      ]);
    }
  }
  await batchInsert(client, "users", ["id", "email", "name"], Array.from(senderMap.values()));
  console.log(`✅ ${senderMap.size} Message senders verified in users table.`);

  // 3. Prepare DM messages
  const dmRows = [];
  for (const m of msgs) {
    const threadId = m.threadId || m.thread_id || m.channelId;
    const isDm = m.threadType === "dm" || (threadId && (threadId.includes("_dm_") || dmThreadIds.has(threadId)));

    if (isDm && threadId) {
      const senderId = m.senderId || m.userId || m.sender?.id || null;
      dmRows.push([
        m._id,
        threadId,
        senderId,
        m.content || m.text || m.message || "",
        m.fileUrl || m.file || null,
        toDate(m.timestamp || m.createdAt)
      ]);
    }
  }

  const inserted = await batchInsert(client, "direct_messages", [
    "id", "thread_id", "sender_id", "content", "file_url", "created_at"
  ], dmRows);

  console.log(`🎉 Successfully imported ${inserted} direct messages into 'direct_messages'!`);

  const res = await client.query("SELECT COUNT(*) FROM direct_messages;");
  console.log(`Total rows in 'direct_messages' table: ${res.rows[0].count}`);

  client.release();
  await pool.end();
}

populateDirectMessages().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
