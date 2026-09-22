import pool, { query } from "../config/db.js";
import { sendTaskAssignmentEmail } from "../services/emailService.js";

const formatDateStr = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.split("T")[0];
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val);
};

const formatProjectRow = (row) => {
  const startDate = formatDateStr(row.start_date || row.startDate);
  const endDate = formatDateStr(row.end_date || row.endDate);
  const teamMembers = Array.isArray(row.team_members) ? row.team_members : (Array.isArray(row.teamMembers) ? row.teamMembers : []);
  const taskCount = parseInt(row.task_count ?? row.taskCount ?? 0, 10);
  const completedTaskCount = parseInt(row.completed_task_count ?? row.completedTaskCount ?? 0, 10);
  const progress = taskCount > 0 ? Math.min(100, Math.round((completedTaskCount / taskCount) * 100)) : 0;

  return {
    ...row,
    id: row.id,
    _id: row.id,
    name: row.name,
    description: row.description || "",
    companyId: row.company_id,
    company_id: row.company_id,
    startDate,
    endDate,
    start_date: startDate,
    end_date: endDate,
    managerId: row.manager_id,
    manager_id: row.manager_id,
    managerName: row.manager_name || "",
    managerEmail: row.manager_email || "",
    status: row.status || "Ongoing",
    teamMembers,
    team_members: teamMembers,
    taskCount,
    task_count: taskCount,
    completedTaskCount,
    completed_task_count: completedTaskCount,
    progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// --- PROJECTS ---
export const getProjects = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.role === "superadmin";
    const targetCompanyId = (isSuperAdmin && req.query.companyId) ? req.query.companyId : req.user?.companyId;

    let sql = `
      SELECT p.*,
             u.name as manager_name,
             u.email as manager_email,
             COALESCE(
               (
                 SELECT json_agg(DISTINCT uid) FROM (
                   SELECT pm.user_id as uid FROM project_members pm WHERE pm.project_id = p.id
                   UNION
                   SELECT u2.id as uid FROM users u2 WHERE u2.company_id = p.company_id AND (p.name = ANY(u2.projects) OR p.name = u2.project)
                 ) sub
               ),
               '[]'::json
             ) as team_members,
             (
               SELECT count(*) FROM (
                 SELECT t.id FROM tasks t WHERE t.project_id = p.id
                 UNION ALL
                 SELECT elem->>'id' FROM users u_t, jsonb_array_elements(COALESCE(u_t.metadata->'tasks', '[]'::jsonb)) elem
                 WHERE u_t.company_id = p.company_id AND elem->>'project' = p.name
               ) sub_tasks
             ) as task_count,
             (
               SELECT count(*) FROM (
                 SELECT t.id FROM tasks t WHERE t.project_id = p.id AND (t.status = 'completed' OR t.status = 'Completed')
                 UNION ALL
                 SELECT elem->>'id' FROM users u_t, jsonb_array_elements(COALESCE(u_t.metadata->'tasks', '[]'::jsonb)) elem
                 WHERE u_t.company_id = p.company_id AND elem->>'project' = p.name AND (elem->>'completed')::boolean = true
               ) sub_tasks_comp
             ) as completed_task_count
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND p.company_id = $${params.length}`;
    }

    sql += " ORDER BY p.created_at DESC";
    const result = await query(sql, params);
    res.json(result.rows.map(formatProjectRow));
  } catch (err) {
    console.error("getProjects error:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, managerId, companyId, teamMembers = [], status = "Ongoing" } = req.body;
    const isSuperAdmin = req.user?.role === "superadmin";
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    if (!name) {
      return res.status(400).json({ error: "Project name is required." });
    }

    const id = "proj_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const cleanStart = startDate ? formatDateStr(startDate) : null;
    const cleanEnd = endDate ? formatDateStr(endDate) : null;

    const result = await query(
      `INSERT INTO projects (id, company_id, name, description, start_date, end_date, manager_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, targetCompanyId, name, description || null, cleanStart, cleanEnd, managerId || req.user?.id || null, status]
    );

    const project = result.rows[0];

    // Ensure manager is in project_members
    if (managerId) {
      await query(
        `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, managerId]
      ).catch(() => {});
      await query(
        `UPDATE users SET is_project_manager = true WHERE id = $1`,
        [managerId]
      ).catch(() => {});
    }

    // Insert team members if provided
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      for (const memberId of teamMembers) {
        if (memberId) {
          await query(
            `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, memberId]
          ).catch(() => {});
        }
      }
    }

    res.status(201).json(formatProjectRow({ ...project, team_members: teamMembers }));
  } catch (err) {
    console.error("createProject error:", err);
    res.status(500).json({ error: "Failed to create project." });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, managerId, status, teamMembers } = req.body;
    const isSuperAdmin = req.user?.role === "superadmin";

    // Tenant check: project must belong to caller's company
    const checkRes = await query("SELECT id, company_id, name FROM projects WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const targetProj = checkRes.rows[0];
    if (!isSuperAdmin && req.user?.companyId && targetProj.company_id && targetProj.company_id !== req.user.companyId) {
      return res.status(403).json({ error: "Access denied. Cannot modify project from another organization." });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (startDate !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(startDate ? formatDateStr(startDate) : null);
    }
    if (endDate !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(endDate ? formatDateStr(endDate) : null);
    }
    if (managerId !== undefined) {
      fields.push(`manager_id = $${idx++}`);
      values.push(managerId);
      if (managerId) {
        await query(`UPDATE users SET is_project_manager = true WHERE id = $1`, [managerId]).catch(() => {});
      }
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      await query(`UPDATE projects SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    }

    // Update team members if passed
    if (Array.isArray(teamMembers)) {
      await query(`DELETE FROM project_members WHERE project_id = $1`, [id]);
      for (const memberId of teamMembers) {
        if (memberId) {
          await query(
            `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, memberId]
          ).catch(() => {});
        }
      }
    }

    // Fetch updated project with unified team and task stats
    const fetchRes = await query(
      `SELECT p.*,
              u.name as manager_name,
              u.email as manager_email,
              COALESCE(
                (
                  SELECT json_agg(DISTINCT uid) FROM (
                    SELECT pm.user_id as uid FROM project_members pm WHERE pm.project_id = p.id
                    UNION
                    SELECT u2.id as uid FROM users u2 WHERE u2.company_id = p.company_id AND (p.name = ANY(u2.projects) OR p.name = u2.project)
                  ) sub
                ),
                '[]'::json
              ) as team_members,
              (
                SELECT count(*) FROM (
                  SELECT t.id FROM tasks t WHERE t.project_id = p.id
                  UNION ALL
                  SELECT elem->>'id' FROM users u_t, jsonb_array_elements(COALESCE(u_t.metadata->'tasks', '[]'::jsonb)) elem
                  WHERE u_t.company_id = p.company_id AND elem->>'project' = p.name
                ) sub_tasks
              ) as task_count,
              (
                SELECT count(*) FROM (
                  SELECT t.id FROM tasks t WHERE t.project_id = p.id AND (t.status = 'completed' OR t.status = 'Completed')
                  UNION ALL
                  SELECT elem->>'id' FROM users u_t, jsonb_array_elements(COALESCE(u_t.metadata->'tasks', '[]'::jsonb)) elem
                  WHERE u_t.company_id = p.company_id AND elem->>'project' = p.name AND (elem->>'completed')::boolean = true
                ) sub_tasks_comp
              ) as completed_task_count
       FROM projects p
       LEFT JOIN users u ON p.manager_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (fetchRes.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json(formatProjectRow(fetchRes.rows[0]));
  } catch (err) {
    console.error("updateProject error:", err);
    res.status(500).json({ error: "Failed to update project." });
  }
};

export const deleteProject = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.role === "superadmin";

    // Verify project exists and belongs to company
    const checkRes = await client.query("SELECT id, company_id FROM projects WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Project not found." });
    }

    const project = checkRes.rows[0];
    if (!isSuperAdmin && req.user?.companyId && project.company_id && project.company_id !== req.user.companyId) {
      client.release();
      return res.status(403).json({ error: "Access denied. Cannot delete project from another organization." });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM project_members WHERE project_id = $1", [id]);
    await client.query("DELETE FROM tasks WHERE project_id = $1", [id]);
    const result = await client.query("DELETE FROM projects WHERE id = $1 RETURNING id", [id]);
    await client.query("COMMIT");

    res.json({ message: "Project deleted successfully.", id: result.rows[0]?.id || id });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("deleteProject error:", err);
    res.status(500).json({ error: "Failed to delete project." });
  } finally {
    client.release();
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required." });

    const isSuperAdmin = req.user?.role === "superadmin";
    const checkRes = await query("SELECT company_id FROM projects WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    if (!isSuperAdmin && req.user?.companyId && checkRes.rows[0].company_id && checkRes.rows[0].company_id !== req.user.companyId) {
      return res.status(403).json({ error: "Access denied. Cannot modify project from another organization." });
    }

    await query(
      `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, userId]
    );
    res.json({ success: true, projectId: id, userId });
  } catch (err) {
    console.error("addProjectMember error:", err);
    res.status(500).json({ error: "Failed to add project member." });
  }
};

// --- TASKS ---
export const getTasks = async (req, res) => {
  try {
    const { projectId, assignedTo } = req.query;
    const isSuperAdmin = req.user?.role === "superadmin";
    const targetCompanyId = (isSuperAdmin && req.query.companyId) ? req.query.companyId : req.user?.companyId;

    let sql = "SELECT * FROM tasks WHERE 1=1";
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND company_id = $${params.length}`;
    }

    if (projectId) {
      params.push(projectId);
      sql += ` AND project_id = $${params.length}`;
    }

    if (assignedTo) {
      params.push(assignedTo);
      sql += ` AND assigned_to = $${params.length}`;
    }

    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("getTasks error:", err);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority = "medium", dueDate } = req.body;
    const companyId = req.user?.companyId;
    const id = "task_" + Math.random().toString(36).substr(2, 9);

    const result = await query(
      `INSERT INTO tasks (id, company_id, project_id, title, description, assigned_to, created_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, companyId, projectId || null, title, description || null, assignedTo || null, req.user.id, priority, dueDate || null]
    );

    const task = result.rows[0];

    // Asynchronously notify assignee if assigned
    if (assignedTo) {
      (async () => {
        try {
          const userRes = await query("SELECT email, name FROM users WHERE id = $1", [assignedTo]);
          if (userRes.rows.length > 0) {
            let projectName = null;
            if (projectId) {
              const pRes = await query("SELECT name FROM projects WHERE id = $1", [projectId]);
              projectName = pRes.rows[0]?.name;
            }
            sendTaskAssignmentEmail({
              email: userRes.rows[0].email,
              name: userRes.rows[0].name,
              taskTitle: title,
              description,
              priority,
              dueDate,
              projectName
            }).catch(() => {});
          }
        } catch (e) {
          console.error("Error dispatching task email:", e);
        }
      })();
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("createTask error:", err);
    res.status(500).json({ error: "Failed to create task." });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, description } = req.body;

    const result = await query(
      `UPDATE tasks
       SET status = COALESCE($1, status),
           priority = COALESCE($2, priority),
           description = COALESCE($3, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status || null, priority || null, description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateTask error:", err);
    res.status(500).json({ error: "Failed to update task." });
  }
};
