import { query } from "../config/db.js";

export const getRoles = async (req, res) => {
  try {
    const { companyId } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = "SELECT * FROM roles WHERE 1=1";
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND company_id = $${params.length}`;
    }

    sql += " ORDER BY name ASC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("getRoles error:", err);
    res.status(500).json({ error: "Failed to fetch roles." });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description = "", permissions = {}, companyId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId;

    if (!name) {
      return res.status(400).json({ error: "Role name is required." });
    }

    const id = "role_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const result = await query(
      `INSERT INTO roles (id, company_id, name, description, permissions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, targetCompanyId, name, description, JSON.stringify(permissions)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createRole error:", err);
    res.status(500).json({ error: "Failed to create role." });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const result = await query(
      `UPDATE roles
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           permissions = COALESCE($3, permissions),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, description, permissions ? JSON.stringify(permissions) : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Role not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateRole error:", err);
    res.status(500).json({ error: "Failed to update role." });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM roles WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Role not found." });
    }
    res.json({ message: "Role deleted successfully.", id });
  } catch (err) {
    console.error("deleteRole error:", err);
    res.status(500).json({ error: "Failed to delete role." });
  }
};
