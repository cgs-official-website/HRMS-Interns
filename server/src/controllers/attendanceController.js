import { query } from "../config/db.js";

export const getAttendance = async (req, res) => {
  try {
    const { userId, companyId, startDate, endDate, date } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    let sql = `
      SELECT a.*, a.date::text as date_str, a.id as "_id", u.name as user_name, u.name as "userName",
             u.email as user_email, u.department as "userDept", u.department
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user && req.user.role === "employee") {
      params.push(req.user.id);
      sql += ` AND a.user_id = $${params.length}`;
    } else if (userId) {
      params.push(userId);
      sql += ` AND a.user_id = $${params.length}`;
    }

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND a.company_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND a.date = $${params.length}`;
    }

    if (startDate && endDate) {
      params.push(startDate);
      sql += ` AND a.date >= $${params.length}`;
      params.push(endDate);
      sql += ` AND a.date <= $${params.length}`;
    }

    sql += " ORDER BY a.date DESC, a.check_in DESC LIMIT 1000";
    const result = await query(sql, params);

    
    // Format check_in/check_out/status for client
    const logs = result.rows.map(row => {
      const checkInDate = row.check_in ? new Date(row.check_in) : null;
      const checkOutDate = row.check_out ? new Date(row.check_out) : null;
      const formatTime = (d) => d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : "";
      
      const durationHours = row.duration_minutes ? (row.duration_minutes / 60).toFixed(1) : (row.check_out ? "0.0" : "Live");
      const dateStr = row.date_str || (row.date instanceof Date ? row.date.toISOString().split("T")[0] : (row.date ? String(row.date).split("T")[0] : ""));

      let frontendStatus = "not-checked-in";
      if (row.check_out) {
        frontendStatus = "checked-out";
      } else if (Array.isArray(row.breaks) && row.breaks.some(b => !b.end)) {
        frontendStatus = "on-break";
      } else if (row.check_in) {
        frontendStatus = "checked-in";
      }

      return {
        ...row,
        id: row.id,
        userId: row.user_id,
        companyId: row.company_id,
        date: dateStr,
        checkIn: formatTime(checkInDate),
        checkOut: formatTime(checkOutDate),
        checkInTime: row.check_in,
        checkOutTime: row.check_out,
        checkInLocation: row.check_in_location || row.location,
        checkOutLocation: row.check_out_location,
        totalHours: durationHours,
        status: frontendStatus
      };
    });

    res.json(logs);
  } catch (err) {
    console.error("getAttendance error:", err);
    res.status(500).json({ error: "Failed to fetch attendance logs." });
  }
};

export const checkIn = async (req, res) => {
  try {
    let userId = req.user?.id || req.body.userId;
    if (typeof userId === "object" && userId !== null) {
      userId = userId.uid || userId.id;
    }
    const companyId = req.user?.companyId || req.body.companyId || req.body.userId?.companyId;
    const today = req.body.date || new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    const { location, workMode = "office" } = req.body;

    const recordId = `${userId}_${today}`;
    const result = await query(
      `INSERT INTO attendance (id, user_id, company_id, date, check_in, status, work_mode, check_in_location, location)
       VALUES ($1, $2, $3, $4, $5, 'present', $6, $7, $7)
       ON CONFLICT (id) DO UPDATE SET
         check_in = COALESCE(attendance.check_in, EXCLUDED.check_in),
         check_in_location = EXCLUDED.check_in_location,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [recordId, userId, companyId, today, now, workMode, JSON.stringify(location || {})]
    );

    const row = result.rows[0];
    const checkInDate = row.check_in ? new Date(row.check_in) : new Date();
    const formatTime = (d) => d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : "";

    res.json({
      ...row,
      id: row.id,
      userId: row.user_id,
      companyId: row.company_id,
      date: today,
      checkIn: formatTime(checkInDate),
      checkInTime: row.check_in || now,
      checkInLocation: row.check_in_location || row.location,
      status: "checked-in"
    });
  } catch (err) {
    console.error("checkIn error:", err);
    res.status(500).json({ error: "Check-in failed." });
  }
};

export const checkOut = async (req, res) => {
  try {
    let userId = req.user?.id || req.body.userId;
    if (typeof userId === "object" && userId !== null) {
      userId = userId.uid || userId.id;
    }
    const today = req.body.date || new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    const { location } = req.body;

    const recordId = `${userId}_${today}`;
    
    // Fetch check_in to calculate duration
    const existing = await query("SELECT check_in FROM attendance WHERE id = $1", [recordId]);
    let durationMinutes = 0;
    if (existing.rows.length > 0 && existing.rows[0].check_in) {
      const checkInTime = new Date(existing.rows[0].check_in);
      durationMinutes = Math.max(0, Math.floor((new Date(now) - checkInTime) / 60000));
    }

    const result = await query(
      `UPDATE attendance
       SET check_out = $1, check_out_location = $2, duration_minutes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [now, JSON.stringify(location || {}), durationMinutes, recordId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No check-in found for today." });
    }

    const row = result.rows[0];
    const checkOutDate = row.check_out ? new Date(row.check_out) : new Date();
    const formatTime = (d) => d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : "";

    res.json({
      ...row,
      id: row.id,
      userId: row.user_id,
      companyId: row.company_id,
      date: today,
      checkOut: formatTime(checkOutDate),
      checkOutTime: row.check_out || now,
      totalWorkingMinutes: durationMinutes,
      status: "checked-out"
    });
  } catch (err) {
    console.error("checkOut error:", err);
    res.status(500).json({ error: "Check-out failed." });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const callerRole = req.user?.role?.toLowerCase();
    const isAllowed = callerRole === "admin" || callerRole === "superadmin" || callerRole === "manager" || callerRole === "system admin";

    if (!isAllowed) {
      return res.status(403).json({ error: "Access forbidden. Admin or Manager role required to edit attendance records." });
    }

    const { checkIn, checkOut, status, date } = req.body;

    const result = await query(
      `UPDATE attendance
       SET check_in = COALESCE($1, check_in),
           check_out = COALESCE($2, check_out),
           status = COALESCE($3, status),
           date = COALESCE($4, date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [checkIn || null, checkOut || null, status || null, date || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attendance record not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateAttendance error:", err);
    res.status(500).json({ error: "Failed to update attendance." });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const callerRole = req.user?.role?.toLowerCase();
    const isAllowed = callerRole === "admin" || callerRole === "superadmin" || callerRole === "system admin";

    if (!isAllowed) {
      return res.status(403).json({ error: "Access forbidden. Admin role required to delete attendance records." });
    }

    const result = await query("DELETE FROM attendance WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attendance record not found." });
    }
    res.json({ message: "Attendance record deleted.", id });
  } catch (err) {
    console.error("deleteAttendance error:", err);
    res.status(500).json({ error: "Failed to delete attendance record." });
  }

};

// Rules
export const getAttendanceRules = async (req, res) => {
  try {
    const { companyId } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    if (targetCompanyId) {
      const compResult = await query("SELECT value FROM settings WHERE key = $1", [`attendance_rules_${targetCompanyId}`]);
      if (compResult.rows.length > 0) {
        const val = compResult.rows[0].value;
        return res.json({ rules: typeof val === "object" && val !== null ? (val.rules || "") : (val || "") });
      }
    }

    const result = await query("SELECT value FROM settings WHERE key = 'attendance_rules'");
    if (result.rows.length > 0) {
      const val = result.rows[0].value;
      res.json({ rules: typeof val === "object" && val !== null ? (val.rules || "") : (val || "") });
    } else {
      res.json({ rules: "" });
    }
  } catch (err) {
    console.error("getAttendanceRules error:", err);
    res.status(500).json({ error: "Failed to fetch attendance rules." });
  }
};

export const updateAttendanceRules = async (req, res) => {
  try {
    const { rules, companyId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId;

    if (targetCompanyId) {
      await query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [`attendance_rules_${targetCompanyId}`, JSON.stringify({ rules })]
      );
    }

    await query(
      `INSERT INTO settings (key, value)
       VALUES ('attendance_rules', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify({ rules })]
    );

    res.json({ success: true, rules });
  } catch (err) {
    console.error("updateAttendanceRules error:", err);
    res.status(500).json({ error: "Failed to update attendance rules." });
  }
};
