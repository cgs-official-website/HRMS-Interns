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
const users = rawData.collections.users || [];

const toJson = (val) => JSON.stringify(val ?? {});
const toDate = (val) => val ? new Date(val).toISOString() : new Date().toISOString();
const toDateOnly = (val) => val ? new Date(val).toISOString().split("T")[0] : null;

async function extractAndImportTasks() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("📋 EXTRACTING EMPLOYEE TASKS FROM USER DOCUMENTS");
  console.log("==================================================");

  let taskCount = 0;

  const ensureCompany = async (compId) => {
    if (!compId) return null;
    const cleanId = String(compId).trim();
    await client.query(
      `INSERT INTO companies (id, name, created_at) VALUES ($1, $1, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
      [cleanId]
    );
    return cleanId;
  };

  const ensureUser = async (userId, name) => {
    if (!userId) return null;
    await client.query(
      `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [userId, `${userId}@system.local`, name || "Staff Member"]
    );
    return userId;
  };

  const ensureProject = async (projIdOrName, compId) => {
    if (!projIdOrName) return null;
    const cleanId = String(projIdOrName).trim();
    const validCompId = await ensureCompany(compId);
    await client.query(
      `INSERT INTO projects (id, company_id, name, status)
       VALUES ($1, $2, $3, 'in-progress')
       ON CONFLICT (id) DO NOTHING`,
      [cleanId, validCompId || null, cleanId]
    );
    return cleanId;
  };

  for (const u of users) {
    const userTasks = u.tasks || [];
    if (!Array.isArray(userTasks) || userTasks.length === 0) continue;

    console.log(`Found ${userTasks.length} tasks for user: ${u.name || u.email} (${u._id})`);
    const validCompId = await ensureCompany(u.companyId);
    await ensureUser(u._id, u.name || u.email);

    for (const t of userTasks) {
      const taskId = t.id || t._id || `task_${u._id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const title = t.title || t.name || t.taskName || "Untitled Task";
      const description = t.description || t.desc || "";
      const status = t.completed ? "completed" : (t.status || "pending");
      const priority = t.priority || "medium";
      const dueDate = toDateOnly(t.dueDate || t.deadline || t.endDate);
      const createdAt = toDate(t.createdAt || t.date || t.assignedAt) || new Date().toISOString();
      const createdBy = t.assignedBy || t.createdBy ? await ensureUser(t.assignedBy || t.createdBy, "Admin") : null;
      
      let projId = null;
      if (t.projectId || t.project) {
        projId = await ensureProject(t.projectId || t.project, validCompId);
      }

      await client.query(
        `INSERT INTO tasks (id, company_id, project_id, title, description, assigned_to, created_by, priority, status, due_date, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           metadata = EXCLUDED.metadata`,
        [
          taskId,
          validCompId || null,
          projId,
          title,
          description,
          u._id,
          createdBy,
          priority,
          status,
          dueDate,
          toJson(t),
          createdAt
        ]
      );
      taskCount++;
    }
  }

  console.log(`\n🎉 Successfully imported ${taskCount} employee tasks into the 'tasks' table!`);

  const res = await client.query("SELECT COUNT(*) FROM tasks;");
  console.log(`Total rows in 'tasks' table now: ${res.rows[0].count}`);

  client.release();
  await pool.end();
}

extractAndImportTasks().catch(err => {
  console.error("Task extraction error:", err);
  process.exit(1);
});
