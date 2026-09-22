import { query } from "../config/db.js";

export const getEnvSettings = async (req, res) => {
  try {
    const { companyId, key, category } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = "SELECT * FROM environment_settings WHERE 1=1";
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND company_id = $${params.length}`;
    }

    if (key) {
      params.push(key);
      sql += ` AND key = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);

    if (key && result.rows.length > 0) {
      // Return setting value directly if queried by key (e.g. general)
      const row = result.rows[0];
      const val = row.value && typeof row.value === "object" ? row.value : {};
      return res.json({
        ...val,
        _id: row.id,
        id: row.id,
        category: row.category,
        key: row.key,
        companyId: row.company_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    }

    if (key && result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows);
  } catch (err) {
    console.error("getEnvSettings error:", err);
    res.status(500).json({ error: "Failed to fetch environment settings." });
  }
};

export const createEnvSetting = async (req, res) => {
  try {
    const targetCompanyId = req.body.companyId || req.user?.companyId;
    const category = req.body.category || "general";
    const key = req.body.key || "general";
    
    // Support either { key, value: { ... } } or raw payload { organization, workSettings, ... }
    let valData = req.body.value;
    if (!valData || typeof valData !== "object") {
      const { companyId, category: cat, key: k, ...rest } = req.body;
      valData = rest;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: "Company ID is required." });
    }

    // Check if setting already exists for this company and key
    const existing = await query(
      "SELECT id FROM environment_settings WHERE company_id = $1 AND key = $2",
      [targetCompanyId, key]
    );

    let row;
    if (existing.rows.length > 0) {
      const updateRes = await query(
        `UPDATE environment_settings
         SET value = $1::jsonb,
             category = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [JSON.stringify(valData), category, existing.rows[0].id]
      );
      row = updateRes.rows[0];
    } else {
      const id = "env_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const insertRes = await query(
        `INSERT INTO environment_settings (id, company_id, category, key, value)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING *`,
        [id, targetCompanyId, category, key, JSON.stringify(valData)]
      );
      row = insertRes.rows[0];
    }

    // Also sync to companies.settings if key is general or settings
    if (key === "general" && valData.organization) {
      await query(
        `UPDATE companies
         SET name = COALESCE($1, name),
             logo_url = COALESCE($2, logo_url),
             settings = COALESCE(settings, '{}'::jsonb) || $3::jsonb
         WHERE id = $4`,
        [valData.organization.name || null, valData.organization.logoUrl || null, JSON.stringify(valData), targetCompanyId]
      );
    }

    res.status(200).json({
      success: true,
      id: row.id,
      ...valData,
      updatedAt: row.updated_at
    });
  } catch (err) {
    console.error("createEnvSetting error:", err);
    res.status(500).json({ error: "Failed to save environment setting." });
  }
};

export const updateEnvSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, category } = req.body;

    const result = await query(
      `UPDATE environment_settings
       SET key = COALESCE($1, key),
           value = CASE WHEN $2::jsonb IS NOT NULL THEN $2::jsonb ELSE value END,
           category = COALESCE($3, category),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [key, value ? JSON.stringify(value) : null, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Setting not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateEnvSetting error:", err);
    res.status(500).json({ error: "Failed to update environment setting." });
  }
};

export const deleteEnvSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM environment_settings WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Setting not found." });
    }
    res.json({ message: "Setting deleted successfully.", id });
  } catch (err) {
    console.error("deleteEnvSetting error:", err);
    res.status(500).json({ error: "Failed to delete environment setting." });
  }
};
