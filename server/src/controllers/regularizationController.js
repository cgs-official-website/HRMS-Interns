import { query } from "../config/db.js";

const formatTimeHHMM = (val, defaultVal = "10:00") => {
  if (!val) return defaultVal;
  if (typeof val === "string") {
    if (val.includes("T")) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
      }
    }
    const m = val.match(/(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
    return val;
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return defaultVal;
};

const formatDateYYYYMMDD = (val) => {
  if (!val) return "";
  if (typeof val === "string") {
    return val.split("T")[0];
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }
  return String(val);
};

const formatRegRow = (row) => {
  const dateStr = formatDateYYYYMMDD(row.attendance_date || row.date);
  const checkInTime = formatTimeHHMM(row.requested_check_in || row.check_in, "10:00");
  const checkOutTime = formatTimeHHMM(row.requested_check_out || row.check_out, "19:00");
  const comment = row.manager_comment || row.rejection_reason || "";

  return {
    ...row,
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    companyId: row.company_id,
    company_id: row.company_id,
    userName: row.user_name || "Employee",
    user_name: row.user_name || "Employee",
    userEmail: row.user_email || "",
    user_email: row.user_email || "",
    userDept: row.department || "Engineering",
    department: row.department || "Engineering",
    date: dateStr,
    attendanceDate: dateStr,
    attendance_date: dateStr,
    checkInTime,
    checkOutTime,
    checkIn: checkInTime,
    checkOut: checkOutTime,
    requested_check_in: row.requested_check_in,
    requested_check_out: row.requested_check_out,
    reason: row.reason || "",
    status: row.status || "pending",
    managerComment: comment,
    manager_comment: comment,
    rejectionReason: comment,
    rejection_reason: comment,
    reviewedBy: row.reviewed_by,
    reviewed_by: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewed_at: row.reviewed_at,
    createdAt: row.created_at,
    created_at: row.created_at,
    appliedAt: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
};

export const getRegularizationRequests = async (req, res) => {
  try {
    const { companyId, userId, status } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    let sql = `
      SELECT r.*, u.name as user_name, u.email as user_email, u.department
      FROM regularization_requests r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND r.company_id = $${params.length}`;
    }

    if (req.user?.role && !["admin", "superadmin", "manager"].includes(req.user.role)) {
      params.push(req.user.id);
      sql += ` AND r.user_id = $${params.length}`;
    } else if (userId) {
      params.push(userId);
      sql += ` AND r.user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    sql += " ORDER BY r.created_at DESC LIMIT 500";
    const result = await query(sql, params);
    res.json(result.rows.map(formatRegRow));
  } catch (err) {
    console.error("getRegularizationRequests error:", err);
    res.status(500).json({ error: "Failed to fetch regularization requests." });
  }
};

export const createRegularizationRequest = async (req, res) => {
  try {
    const { date, attendanceDate, checkIn, checkOut, reason } = req.body;
    const userId = req.user?.id || req.body.userId;
    const companyId = req.user?.companyId || req.body.companyId;

    const rawDate = attendanceDate || date || new Date();
    const cleanDate = formatDateYYYYMMDD(rawDate);

    if (!cleanDate || !reason) {
      return res.status(400).json({ error: "Attendance date and reason are required." });
    }

    const id = "reg_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    // Parse timestamps for requested_check_in and requested_check_out
    let checkInTimestamp = null;
    let checkOutTimestamp = null;

    if (checkIn) {
      const mIn = String(checkIn).match(/(\d{1,2}):(\d{2})/);
      if (mIn) {
        checkInTimestamp = new Date(`${cleanDate}T${mIn[1].padStart(2, "0")}:${mIn[2]}:00Z`);
      }
    }
    if (checkOut) {
      const mOut = String(checkOut).match(/(\d{1,2}):(\d{2})/);
      if (mOut) {
        checkOutTimestamp = new Date(`${cleanDate}T${mOut[1].padStart(2, "0")}:${mOut[2]}:00Z`);
      }
    }

    const result = await query(
      `INSERT INTO regularization_requests (id, user_id, company_id, attendance_date, requested_check_in, requested_check_out, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [id, userId, companyId, cleanDate, checkInTimestamp, checkOutTimestamp, reason]
    );

    const inserted = result.rows[0];
    const userRes = await query("SELECT name, email, department FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0] || {};

    const fullRow = {
      ...inserted,
      user_name: user.name,
      user_email: user.email,
      department: user.department
    };

    res.status(201).json(formatRegRow(fullRow));
  } catch (err) {
    console.error("createRegularizationRequest error:", err);
    res.status(500).json({ error: "Failed to create regularization request." });
  }
};

export const updateRegularizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment, rejectionReason } = req.body;
    const reviewerId = req.user?.id || null;
    const callerRole = (req.user?.role || "").toLowerCase().trim();
    const isAllowed = callerRole === "admin" || callerRole === "superadmin" || callerRole === "manager" || callerRole === "system admin" || callerRole === "systemadmin" || callerRole === "project manager" || Boolean(req.user?.isProjectManager || req.user?.is_project_manager) || req.user?.isAdmin === true;

    if (!isAllowed) {
      return res.status(403).json({ error: "Access forbidden. Manager or Admin role required to review regularization requests." });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const comment = managerComment || rejectionReason || null;

    const result = await query(
      `UPDATE regularization_requests
       SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP,
           manager_comment = $3, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, reviewerId, comment, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Regularization request not found." });
    }

    const updated = result.rows[0];

    // If approved, dynamically upsert attendance for this user on that date
    if (status === "approved") {
      try {
        const attDate = formatDateYYYYMMDD(updated.attendance_date);
        if (attDate && updated.user_id) {
          const attId = `att_${updated.user_id}_${attDate}`;
          const checkInVal = updated.requested_check_in || new Date(`${attDate}T10:00:00Z`);
          const checkOutVal = updated.requested_check_out || new Date(`${attDate}T19:00:00Z`);

          await query(`
            INSERT INTO attendance (id, user_id, company_id, date, check_in, check_out, status, duration_minutes, is_regularized)
            VALUES ($1, $2, $3, $4, $5, $6, 'present', 480, true)
            ON CONFLICT (user_id, date)
            DO UPDATE SET
              check_in = COALESCE(EXCLUDED.check_in, attendance.check_in),
              check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
              status = 'present',
              duration_minutes = GREATEST(COALESCE(attendance.duration_minutes, 0), 480),
              is_regularized = true,
              updated_at = CURRENT_TIMESTAMP
          `, [attId, updated.user_id, updated.company_id, attDate, checkInVal, checkOutVal]);
        }
      } catch (attErr) {
        console.error("Error updating attendance on regularization approval:", attErr);
      }
    }

    const userRes = await query("SELECT name, email, department FROM users WHERE id = $1", [updated.user_id]);
    const user = userRes.rows[0] || {};

    const fullRow = {
      ...updated,
      user_name: user.name,
      user_email: user.email,
      department: user.department
    };

    res.json(formatRegRow(fullRow));
  } catch (err) {
    console.error("updateRegularizationStatus error:", err);
    res.status(500).json({ error: "Failed to update regularization request." });
  }
};
