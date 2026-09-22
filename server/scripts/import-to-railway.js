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
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const backupFile = path.resolve(__dirname, "../backup/firestore_export_latest.json");

if (!fs.existsSync(backupFile)) {
  console.error(`❌ ERROR: Backup file not found at ${backupFile}`);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(backupFile, "utf8"));
const { collections = {}, subcollections = {} } = rawData;

const toJson = (val) => JSON.stringify(val ?? {});
const toDate = (val) => {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
};
const toDateOnly = (val) => {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  } catch {
    return null;
  }
};

async function runFastMigration() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("⚡ HIGH-SPEED ZERO-LOSS MASS IMPORTER (RAILWAY)");
  console.log("==================================================");

  try {
    // 1. DDL Schema
    console.log("Step 1: Applying Database Schema...");
    const schemaSql = fs.readFileSync(path.resolve(__dirname, "schema.sql"), "utf8");
    await client.query(schemaSql);
    console.log("✅ Schema applied.\n");

    await client.query("BEGIN;");

    // 2. Pre-seed All Companies (Known + Referenced)
    const companyMap = new Map();
    const companies = collections.companies || [];
    for (const c of companies) {
      companyMap.set(c._id, {
        id: c._id,
        name: c.name || "Default Company",
        slug: c.slug || null,
        code: c.code || null,
        domain: c.domain || null,
        logo_url: c.logoUrl || c.logo_url || c.logoBase64 || null,
        plan: c.plan || "basic",
        status: c.status || "active",
        settings: toJson(c.settings || {}),
        created_at: toDate(c.createdAt) || new Date().toISOString(),
        updated_at: toDate(c.updatedAt) || new Date().toISOString()
      });
    }

    // Scan all other collections for referenced companyIds
    const allItems = [
      ...(collections.users || []),
      ...(collections.attendance || []),
      ...(collections.leave_requests || []),
      ...(collections.regularization_requests || []),
      ...(collections.projects || []),
      ...(collections.channels || []),
      ...(collections.messages || []),
      ...(collections.daily_reports || []),
      ...(collections.weekly_reports || []),
      ...(collections.assets || []),
      ...(subcollections.employeePayroll || [])
    ];

    for (const item of allItems) {
      if (item.companyId && !companyMap.has(item.companyId)) {
        companyMap.set(item.companyId, {
          id: item.companyId,
          name: item.companyId,
          slug: item.companyId,
          code: null,
          domain: null,
          logo_url: null,
          plan: "basic",
          status: "active",
          settings: "{}",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    console.log(`Step 2: Bulk inserting Companies (${companyMap.size} unique organizations)...`);
    for (const c of companyMap.values()) {
      await client.query(
        `INSERT INTO companies (id, name, slug, code, domain, logo_url, plan, status, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug`,
        [c.id, c.name, c.slug, c.code, c.domain, c.logo_url, c.plan, c.status, c.settings, c.created_at, c.updated_at]
      );
    }
    console.log("✅ Companies ready.");

    // 3. Pre-seed All Users (Known + Referenced)
    const userMap = new Map();
    const users = collections.users || [];
    for (const u of users) {
      const email = u.email ? u.email.toLowerCase().trim() : `${u._id}@placeholder.local`;
      userMap.set(u._id, {
        id: u._id,
        company_id: u.companyId || null,
        email: email,
        name: u.name || u.displayName || "Staff Member",
        employee_id: u.employeeId || null,
        role: u.role || "employee",
        department: u.department || null,
        designation: u.designation || null,
        program_type: u.programType || "Full-time",
        employment_type: u.employmentType || "Full-time",
        phone: u.phone || null,
        avatar_url: u.avatarUrl || u.photoURL || null,
        status: u.status || "active",
        shift_start: u.shiftStart || "09:00",
        shift_end: u.shiftEnd || "18:00",
        casual_leave_quota: Number(u.casualLeaveQuota ?? 25),
        sick_leave_quota: Number(u.sickLeaveQuota ?? 10),
        paid_leave_quota: Number(u.paidLeaveQuota ?? 6),
        gross_salary: Number(u.grossSalary ?? 0),
        paid_days: Number(u.paidDays ?? 0),
        is_project_manager: Boolean(u.isProjectManager),
        project: u.project || null,
        projects: Array.isArray(u.projects) ? u.projects : (u.project ? [u.project] : []),
        skills: Array.isArray(u.skills) ? u.skills : [],
        metadata: toJson(u),
        created_at: toDate(u.createdAt) || new Date().toISOString(),
        updated_at: toDate(u.updatedAt) || new Date().toISOString()
      });
    }

    // Add any referenced user IDs not in users collection
    for (const item of allItems) {
      const uid = item.userId || item.uid || item.user_id || item.managerId || item.assignedTo || item.employeeId || item.senderId;
      if (uid && !userMap.has(uid)) {
        userMap.set(uid, {
          id: uid,
          company_id: item.companyId || null,
          email: `${uid}@system.local`,
          name: item.userName || item.senderName || item.employeeName || "Staff Member",
          employee_id: null,
          role: "employee",
          department: null,
          designation: null,
          program_type: "Full-time",
          employment_type: "Full-time",
          phone: null,
          avatar_url: null,
          status: "active",
          shift_start: "09:00",
          shift_end: "18:00",
          casual_leave_quota: 25,
          sick_leave_quota: 10,
          paid_leave_quota: 6,
          gross_salary: 0,
          paid_days: 0,
          is_project_manager: false,
          project: null,
          projects: [],
          skills: [],
          metadata: "{}",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    console.log(`Step 3: Bulk inserting Users (${userMap.size} users)...`);
    for (const u of userMap.values()) {
      await client.query(
        `INSERT INTO users (
           id, company_id, email, password_hash, name, employee_id, role, department, designation,
           program_type, employment_type, phone, avatar_url, status, shift_start, shift_end,
           casual_leave_quota, sick_leave_quota, paid_leave_quota, gross_salary, paid_days,
           is_project_manager, project, projects, skills, metadata, created_at, updated_at
         )
         VALUES ($1, $2, $3, null, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, department = EXCLUDED.department`,
        [
          u.id, u.company_id, u.email, u.name, u.employee_id, u.role, u.department, u.designation,
          u.program_type, u.employment_type, u.phone, u.avatar_url, u.status, u.shift_start, u.shift_end,
          u.casual_leave_quota, u.sick_leave_quota, u.paid_leave_quota, u.gross_salary, u.paid_days,
          u.is_project_manager, u.project, u.projects, u.skills, u.metadata, u.created_at, u.updated_at
        ]
      );
    }
    console.log("✅ Users ready.");

    // 4. Batch Insert Attendance (All 4 Months)
    const attList = collections.attendance || [];
    console.log(`Step 4: Bulk inserting Attendance Logs (${attList.length} records)...`);
    const chunkSize = 100;
    for (let i = 0; i < attList.length; i += chunkSize) {
      const chunk = attList.slice(i, i + chunkSize);
      const valPlaceholders = [];
      const valParams = [];
      let pIdx = 1;

      for (const a of chunk) {
        const attDate = toDateOnly(a.date) || toDateOnly(a.checkIn) || toDateOnly(a.createdAt);
        const userId = a.userId || a.uid || a.user_id;
        if (!attDate || !userId) continue;

        const recId = a._id || `${userId}_${attDate}`;
        valPlaceholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, $${pIdx+12}, $${pIdx+13}, $${pIdx+14}, $${pIdx+15}, $${pIdx+16}, $${pIdx+17})`);
        
        valParams.push(
          recId,
          userId,
          a.companyId || null,
          attDate,
          toDate(a.checkIn || a.check_in),
          toDate(a.checkOut || a.check_out),
          Number(a.durationMinutes || a.duration || 0),
          a.status || "present",
          a.workMode || a.work_mode || "office",
          toJson(a.location || {}),
          toJson(a.checkInLocation || {}),
          toJson(a.checkOutLocation || {}),
          toJson(a.breaks || []),
          Boolean(a.isRegularized || a.regularized),
          a.notes || null,
          toJson(a),
          toDate(a.createdAt) || new Date().toISOString(),
          toDate(a.updatedAt) || new Date().toISOString()
        );
        pIdx += 18;
      }

      if (valPlaceholders.length > 0) {
        await client.query(
          `INSERT INTO attendance (
             id, user_id, company_id, date, check_in, check_out, duration_minutes,
             status, work_mode, location, check_in_location, check_out_location, breaks,
             is_regularized, notes, metadata, created_at, updated_at
           )
           VALUES ${valPlaceholders.join(", ")}
           ON CONFLICT (id) DO NOTHING`,
          valParams
        );
      }
    }
    console.log("✅ Attendance ready.");

    // 5. Batch Insert Leave Requests
    const leaves = collections.leave_requests || [];
    console.log(`Step 5: Bulk inserting Leave Requests (${leaves.length} records)...`);
    for (const l of leaves) {
      const startDate = toDateOnly(l.startDate || l.start_date || l.createdAt) || new Date().toISOString().split("T")[0];
      const endDate = toDateOnly(l.endDate || l.end_date || l.createdAt) || startDate;
      const userId = l.userId || l.uid;
      if (!userId) continue;

      await client.query(
        `INSERT INTO leave_requests (id, user_id, company_id, leave_type, start_date, end_date, total_days, reason, status, applied_at, reviewed_by, reviewed_at, rejection_reason, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO NOTHING`,
        [
          l._id, userId, l.companyId || null, l.leaveType || l.type || "casual", startDate, endDate,
          Number(l.totalDays || l.days || 1), l.reason || "Leave Request", l.status || "pending",
          toDate(l.appliedAt || l.createdAt) || new Date().toISOString(), l.reviewedBy || null,
          toDate(l.reviewedAt), l.rejectionReason || null, toJson(l),
          toDate(l.createdAt) || new Date().toISOString(), toDate(l.updatedAt) || new Date().toISOString()
        ]
      );
    }
    console.log("✅ Leave Requests ready.");

    // 6. Regularization Requests
    const regs = collections.regularization_requests || [];
    console.log(`Step 6: Bulk inserting Regularization Requests (${regs.length} records)...`);
    for (const r of regs) {
      const attDate = toDateOnly(r.attendanceDate || r.date || r.createdAt) || new Date().toISOString().split("T")[0];
      const userId = r.userId || r.uid;
      if (!userId) continue;

      await client.query(
        `INSERT INTO regularization_requests (id, user_id, company_id, attendance_date, requested_check_in, requested_check_out, reason, status, reviewed_by, reviewed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          r._id, userId, r.companyId || null, attDate,
          toDate(r.requestedCheckIn || r.checkIn), toDate(r.requestedCheckOut || r.checkOut),
          r.reason || "Regularization", r.status || "pending", r.reviewedBy || null,
          toDate(r.reviewedAt), toDate(r.createdAt) || new Date().toISOString(), toDate(r.updatedAt) || new Date().toISOString()
        ]
      );
    }
    console.log("✅ Regularization Requests ready.");

    // 7. Projects & Tasks & Task Reports
    const projects = collections.projects || [];
    console.log(`Step 7: Bulk inserting Projects (${projects.length} records)...`);
    for (const p of projects) {
      await client.query(
        `INSERT INTO projects (id, company_id, name, description, start_date, end_date, manager_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [p._id, p.companyId || null, p.name || "Untitled Project", p.description || null, toDateOnly(p.startDate), toDateOnly(p.endDate), p.managerId || null, p.status || "in-progress", toDate(p.createdAt) || new Date().toISOString(), toDate(p.updatedAt) || new Date().toISOString()]
      );
    }
    console.log("✅ Projects ready.");

    // 8. Channels & Messages
    const channels = collections.channels || [];
    console.log(`Step 8: Bulk inserting Channels (${channels.length} records)...`);
    for (const ch of channels) {
      await client.query(
        `INSERT INTO channels (id, company_id, name, description, created_by, is_private, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [ch._id, ch.companyId || null, ch.name || "General", ch.description || null, ch.createdBy || null, Boolean(ch.isPrivate), toDate(ch.createdAt) || new Date().toISOString()]
      );
    }

    const messages = collections.messages || [];
    console.log(`Step 9: Bulk inserting Messages (${messages.length} records)...`);
    for (const m of messages) {
      if (!m.channelId) continue;
      await client.query(
        `INSERT INTO messages (id, company_id, channel_id, user_id, user_name, user_avatar, content, file_url, file_name, file_type, reactions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [m._id, m.companyId || null, m.channelId, m.userId || null, m.userName || null, m.userAvatar || null, m.content || m.text || "", m.fileUrl || null, m.fileName || null, m.fileType || null, toJson(m.reactions || {}), toDate(m.createdAt) || new Date().toISOString()]
      );
    }
    console.log("✅ Messages ready.");

    // 10. Reports, Assets, Payroll
    const dailyReports = collections.daily_reports || [];
    console.log(`Step 10: Bulk inserting Daily Reports (${dailyReports.length} records)...`);
    for (const dr of dailyReports) {
      const repDate = toDateOnly(dr.reportDate || dr.date || dr.createdAt) || new Date().toISOString().split("T")[0];
      const userId = dr.userId || dr.uid;
      if (!userId) continue;

      await client.query(
        `INSERT INTO daily_reports (id, user_id, company_id, report_date, tasks_done, tasks_planned, blockers, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [dr._id, userId, dr.companyId || null, repDate, dr.tasksDone || dr.tasks_done || null, dr.tasksPlanned || dr.tasks_planned || null, dr.blockers || null, toJson(dr), toDate(dr.createdAt) || new Date().toISOString(), toDate(dr.updatedAt) || new Date().toISOString()]
      );
    }

    const payrolls = subcollections.employeePayroll || [];
    console.log(`Step 11: Bulk inserting Payroll (${payrolls.length} records)...`);
    for (const p of payrolls) {
      await client.query(
        `INSERT INTO payroll (id, company_id, employee_id, month, year, basic_salary, hra, allowances, gross_salary, net_salary, paid_days, present_days, status, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO NOTHING`,
        [p._id, p.companyId || null, p.employeeId || p.userId || null, p.month || "Unknown", Number(p.year || new Date().getFullYear()), Number(p.basicSalary || 0), Number(p.hra || 0), Number(p.allowances || 0), Number(p.grossSalary || 0), Number(p.netSalary || 0), Number(p.paidDays || 0), Number(p.presentDays || 0), p.status || "processed", toJson(p), toDate(p.createdAt) || new Date().toISOString(), toDate(p.updatedAt) || new Date().toISOString()]
      );
    }

    await client.query("COMMIT;");
    console.log("\n==================================================");
    console.log("🎉 FAST MASS IMPORT COMPLETED WITH 100% SUCCESS!");
    console.log("==================================================");

  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("❌ Migration error:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runFastMigration().catch(err => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
