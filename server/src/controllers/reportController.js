import { query } from "../config/db.js";

const formatDateYYYYMMDD = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.split("T")[0];
  if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString().split("T")[0];
  return String(val);
};

// ----------------------------------------------------
// DAILY REPORTS
// ----------------------------------------------------

export const getDailyReports = async (req, res) => {
  try {
    const { companyId, userId, date, month, projectId } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = `
      SELECT dr.*,
             u.name as user_name,
             u.email as user_email,
             u.department as user_dept,
             u.avatar_url as user_avatar
      FROM daily_reports dr
      LEFT JOIN users u ON dr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND dr.company_id = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      sql += ` AND dr.user_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND (dr.report_date = $${params.length} OR dr.content->>'date' = $${params.length})`;
    }

    if (month) {
      params.push(`${month}%`);
      sql += ` AND (dr.report_date::text LIKE $${params.length} OR dr.content->>'date' LIKE $${params.length})`;
    }

    sql += " ORDER BY dr.report_date DESC, dr.created_at DESC LIMIT 1000";
    const result = await query(sql, params);

    const reports = result.rows.map(row => {
      const content = row.content && typeof row.content === "object" ? row.content : {};
      const dateStr = content.date || formatDateYYYYMMDD(row.report_date);

      return {
        ...content,
        id: row.id,
        _id: row.id,
        userId: row.user_id,
        user_id: row.user_id,
        companyId: row.company_id,
        company_id: row.company_id,
        userName: content.userName || row.user_name || "Employee",
        user_name: content.userName || row.user_name || "Employee",
        userEmail: row.user_email || "",
        userDept: row.user_dept || "Engineering",
        userAvatar: row.user_avatar || "",
        date: dateStr,
        day: content.day || "",
        hours: Number(content.hours || 8),
        status: content.status || "Completed",
        tasksCompleted: content.tasksCompleted || row.tasks_done || "",
        tasks_done: content.tasksCompleted || row.tasks_done || "",
        tasksPlanned: content.tasksPlanned || row.tasks_planned || "",
        tasks_planned: content.tasksPlanned || row.tasks_planned || "",
        issuesFaced: content.issuesFaced || row.blockers || "",
        blockers: content.issuesFaced || row.blockers || "",
        supervisorRemarks: content.supervisorRemarks || "",
        projectName: content.projectName || "General Project",
        createdAt: content.createdAt || row.created_at,
        updatedAt: row.updated_at
      };
    });

    res.json(reports);
  } catch (err) {
    console.error("getDailyReports error:", err);
    res.status(500).json({ error: "Failed to fetch daily reports." });
  }
};

export const createDailyReport = async (req, res) => {
  try {
    const reportData = req.body;
    const userId = req.user?.id || reportData.userId;
    const companyId = req.user?.companyId || reportData.companyId;
    const dateStr = formatDateYYYYMMDD(reportData.date || new Date());
    const id = reportData.id || "dr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    const tasksDone = reportData.tasksCompleted || reportData.tasks_done || "";
    const tasksPlanned = reportData.tasksPlanned || reportData.tasks_planned || "";
    const blockers = reportData.issuesFaced || reportData.blockers || "";

    const userRes = await query("SELECT name, email, department FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0] || {};

    const contentObj = {
      ...reportData,
      id,
      _id: id,
      userId,
      userName: user.name || reportData.userName || "Employee",
      companyId,
      date: dateStr,
      createdAt: new Date().toISOString()
    };

    const result = await query(
      `INSERT INTO daily_reports (id, user_id, company_id, report_date, tasks_done, tasks_planned, blockers, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, userId, companyId, dateStr, tasksDone, tasksPlanned, blockers, JSON.stringify(contentObj)]
    );

    const row = result.rows[0];
    res.status(201).json({
      ...contentObj,
      id: row.id,
      userId: row.user_id,
      companyId: row.company_id,
      date: dateStr
    });
  } catch (err) {
    console.error("createDailyReport error:", err);
    res.status(500).json({ error: "Failed to create daily report." });
  }
};

export const updateDailyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingRes = await query("SELECT * FROM daily_reports WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Daily report not found." });
    }

    const existing = existingRes.rows[0];
    const prevContent = existing.content && typeof existing.content === "object" ? existing.content : {};
    const mergedContent = {
      ...prevContent,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    const tasksDone = updates.tasksCompleted !== undefined ? updates.tasksCompleted : existing.tasks_done;
    const tasksPlanned = updates.tasksPlanned !== undefined ? updates.tasksPlanned : existing.tasks_planned;
    const blockers = updates.issuesFaced !== undefined ? updates.issuesFaced : existing.blockers;

    const result = await query(
      `UPDATE daily_reports
       SET tasks_done = $1, tasks_planned = $2, blockers = $3, content = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [tasksDone, tasksPlanned, blockers, JSON.stringify(mergedContent), id]
    );

    res.json({
      ...mergedContent,
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      companyId: result.rows[0].company_id,
      date: mergedContent.date || formatDateYYYYMMDD(result.rows[0].report_date)
    });
  } catch (err) {
    console.error("updateDailyReport error:", err);
    res.status(500).json({ error: "Failed to update daily report." });
  }
};

export const deleteDailyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM daily_reports WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Daily report not found." });
    }
    res.json({ message: "Daily report deleted.", id });
  } catch (err) {
    console.error("deleteDailyReport error:", err);
    res.status(500).json({ error: "Failed to delete daily report." });
  }
};

// ----------------------------------------------------
// WEEKLY REPORTS
// ----------------------------------------------------

export const getWeeklyReports = async (req, res) => {
  try {
    const { companyId, userId } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = `
      SELECT wr.*,
             u.name as user_name,
             u.email as user_email
      FROM weekly_reports wr
      LEFT JOIN users u ON wr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND wr.company_id = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      sql += ` AND wr.user_id = $${params.length}`;
    }

    sql += " ORDER BY wr.created_at DESC LIMIT 500";
    const result = await query(sql, params);

    const reports = result.rows.map(row => {
      const content = row.content && typeof row.content === "object" ? row.content : {};
      const weekStartStr = content.weekStartDate || formatDateYYYYMMDD(row.week_start);
      const weekEndStr = content.weekEndDate || formatDateYYYYMMDD(row.week_end);

      return {
        ...content,
        id: row.id,
        _id: row.id,
        userId: row.user_id,
        employeeId: content.employeeId || row.user_id,
        companyId: row.company_id,
        employeeName: content.employeeName || row.user_name || "Employee",
        managerId: content.managerId || req.user?.id || null,
        weekStartDate: weekStartStr,
        weekEndDate: weekEndStr,
        tasksCompleted: content.tasksCompleted || "",
        supervisorRemarks: content.supervisorRemarks || "",
        rating: content.rating || "Good",
        createdAt: content.createdAt || row.created_at,
        updatedAt: row.updated_at
      };
    });

    res.json(reports);
  } catch (err) {
    console.error("getWeeklyReports error:", err);
    res.status(500).json({ error: "Failed to fetch weekly reports." });
  }
};

export const createWeeklyReport = async (req, res) => {
  try {
    const reportData = req.body;
    const userId = req.user?.id || reportData.userId || reportData.employeeId;
    const companyId = req.user?.companyId || reportData.companyId;
    const weekStart = formatDateYYYYMMDD(reportData.weekStartDate || reportData.weekStart || new Date());
    const weekEnd = formatDateYYYYMMDD(reportData.weekEndDate || reportData.weekEnd || new Date());
    const id = reportData.id || "wr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    const userRes = await query("SELECT name, email FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0] || {};

    const contentObj = {
      ...reportData,
      id,
      _id: id,
      userId,
      employeeId: userId,
      employeeName: user.name || reportData.employeeName || "Employee",
      companyId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      createdAt: new Date().toISOString()
    };

    const result = await query(
      `INSERT INTO weekly_reports (id, user_id, company_id, week_start, week_end, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId, companyId, weekStart, weekEnd, JSON.stringify(contentObj)]
    );

    res.status(201).json({
      ...contentObj,
      id: result.rows[0].id
    });
  } catch (err) {
    console.error("createWeeklyReport error:", err);
    res.status(500).json({ error: "Failed to create weekly report." });
  }
};

export const updateWeeklyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingRes = await query("SELECT * FROM weekly_reports WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Weekly report not found." });
    }

    const prevContent = existingRes.rows[0].content || {};
    const mergedContent = {
      ...prevContent,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    const result = await query(
      `UPDATE weekly_reports
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(mergedContent), id]
    );

    res.json({
      ...mergedContent,
      id: result.rows[0].id
    });
  } catch (err) {
    console.error("updateWeeklyReport error:", err);
    res.status(500).json({ error: "Failed to update weekly report." });
  }
};

export const deleteWeeklyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM weekly_reports WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Weekly report not found." });
    }
    res.json({ message: "Weekly report deleted.", id });
  } catch (err) {
    console.error("deleteWeeklyReport error:", err);
    res.status(500).json({ error: "Failed to delete weekly report." });
  }
};

// ----------------------------------------------------
// TASK REPORTS
// ----------------------------------------------------

export const getTaskReports = async (req, res) => {
  try {
    const { companyId, taskId, userId } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = `
      SELECT tr.*, u.name as user_name
      FROM task_reports tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND tr.company_id = $${params.length}`;
    }

    if (taskId) {
      params.push(taskId);
      sql += ` AND tr.task_id = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      sql += ` AND tr.user_id = $${params.length}`;
    }

    sql += " ORDER BY tr.submitted_at DESC LIMIT 1000";
    const result = await query(sql, params);

    const reports = result.rows.map(row => {
      const submittedStr = row.submitted_at instanceof Date ? row.submitted_at.toISOString() : (row.submitted_at ? String(row.submitted_at) : new Date().toISOString());

      return {
        id: row.id,
        _id: row.id,
        taskId: row.task_id,
        task_id: row.task_id,
        userId: row.user_id,
        user_id: row.user_id,
        employeeId: row.user_id,
        userName: row.user_name || "Employee",
        companyId: row.company_id,
        reportText: row.content || "",
        content: row.content || "",
        timeSpentMinutes: row.time_spent_minutes || 0,
        createdAt: submittedStr,
        submittedAt: submittedStr,
        timestamp: submittedStr
      };
    });

    res.json(reports);
  } catch (err) {
    console.error("getTaskReports error:", err);
    res.status(500).json({ error: "Failed to fetch task reports." });
  }
};

export const createTaskReport = async (req, res) => {
  try {
    const { taskId, content, reportText, timeSpentMinutes, companyId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId;
    const userId = req.user?.id || req.body.userId;
    const text = content || reportText || "";

    const id = "tr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    const result = await query(
      `INSERT INTO task_reports (id, task_id, user_id, company_id, content, time_spent_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, taskId || null, userId, targetCompanyId, text, Number(timeSpentMinutes || 0)]
    );

    const row = result.rows[0];
    const submittedStr = row.submitted_at instanceof Date ? row.submitted_at.toISOString() : (row.submitted_at ? String(row.submitted_at) : new Date().toISOString());
    res.status(201).json({
      id: row.id,
      _id: row.id,
      taskId: row.task_id,
      task_id: row.task_id,
      userId: row.user_id,
      user_id: row.user_id,
      companyId: row.company_id,
      reportText: row.content,
      content: row.content,
      timeSpentMinutes: row.time_spent_minutes,
      createdAt: submittedStr,
      submittedAt: submittedStr,
      timestamp: submittedStr
    });
  } catch (err) {
    console.error("createTaskReport error:", err);
    res.status(500).json({ error: "Failed to create task report." });
  }
};
