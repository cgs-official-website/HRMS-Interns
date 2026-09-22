import { query } from "../config/db.js";

export const getTasks = async (req, res) => {
  try {
    const { companyId, projectId, assigneeId, status } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = `
      SELECT t.*, t.id as "_id", t.assigned_to as assignee_id, t.assigned_to as "assigneeId",
             u.name as assignee_name, u.name as "assigneeName", u.email as assignee_email,
             p.name as project_name, p.name as "projectName"
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND t.company_id = $${params.length}`;
    }

    if (projectId) {
      params.push(projectId);
      sql += ` AND t.project_id = $${params.length}`;
    }

    if (req.user?.role === "employee") {
      params.push(req.user.id);
      sql += ` AND t.assigned_to = $${params.length}`;
    } else if (assigneeId) {
      params.push(assigneeId);
      sql += ` AND t.assigned_to = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND t.status = $${params.length}`;
    }

    sql += " ORDER BY t.created_at DESC LIMIT 500";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("getTasks error:", err);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assigneeId,
      assignedTo,
      priority = "medium",
      dueDate,
      companyId
    } = req.body;

    const targetCompanyId = companyId || req.user?.companyId;
    const creatorId = req.user?.id || null;
    const targetAssignee = assigneeId || assignedTo || null;

    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const id = "task_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const result = await query(
      `INSERT INTO tasks (id, company_id, project_id, title, description, assigned_to, created_by, priority, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [id, targetCompanyId, projectId || null, title, description || "", targetAssignee, creatorId, priority, dueDate || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createTask error:", err);
    res.status(500).json({ error: "Failed to create task." });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      "title", "description", "project_id", "assigned_to", "status",
      "priority", "due_date", "metadata"
    ];

    for (const key of Object.keys(updates)) {
      let snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (key === "assigneeId") snakeKey = "assigned_to";
      if (key === "projectId") snakeKey = "project_id";
      if (key === "dueDate") snakeKey = "due_date";

      if (allowed.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No valid fields provided." });
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateTask error:", err);
    res.status(500).json({ error: "Failed to update task." });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json({ message: "Task deleted successfully.", id });
  } catch (err) {
    console.error("deleteTask error:", err);
    res.status(500).json({ error: "Failed to delete task." });
  }
};
