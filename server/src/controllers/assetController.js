import { query } from "../config/db.js";

export const getAssets = async (req, res) => {
  try {
    const { companyId, status, category } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = `
      SELECT a.*, 
             COALESCE(a.assigned_to, a.metadata->>'assignedUserId') as effective_assigned_to,
             u.name as assigned_user_name, 
             u.email as assigned_user_email
      FROM assets a
      LEFT JOIN users u ON COALESCE(a.assigned_to, a.metadata->>'assignedUserId') = u.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND a.company_id = $${params.length}`;
    }
    if (status && status !== "all") {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    sql += " ORDER BY a.created_at DESC";
    const result = await query(sql, params);
    
    // Camelcase mapping for frontend
    const assets = result.rows.map(r => {
      const meta = (r.metadata && typeof r.metadata === "object") ? r.metadata : {};
      
      let cat = meta.category || r.category;
      if (typeof cat === "string") {
        if (cat.startsWith("{") && cat.endsWith("}")) {
          cat = cat.slice(1, -1).split(",").map(s => s.replace(/"/g, "").trim()).filter(Boolean);
        } else if (cat.includes(",")) {
          cat = cat.split(",").map(s => s.trim()).filter(Boolean);
        } else {
          cat = [cat];
        }
      } else if (!Array.isArray(cat)) {
        cat = ["Laptop"];
      }

      let assignedDate = "";
      if (r.purchase_date) {
        assignedDate = typeof r.purchase_date === "string" 
          ? r.purchase_date.split("T")[0] 
          : new Date(r.purchase_date).toISOString().split("T")[0];
      } else if (meta.assignedDate) {
        assignedDate = meta.assignedDate;
      }

      const assignedUserId = r.effective_assigned_to || r.assigned_to || meta.assignedUserId || meta.assignedUser || null;
      const assignedUserName = r.assigned_user_name || meta.assignedUserName || (assignedUserId ? "Assigned" : "");

      return {
        ...r,
        ...meta,
        id: r.id,
        _id: r.id,
        name: r.name || meta.name || "",
        serialNumber: r.serial_number || meta.serialNumber || meta.serial_number || "",
        status: r.status || meta.status || (assignedUserId ? "Assigned" : "Available"),
        assignedUser: assignedUserId,
        assignedUserId: assignedUserId,
        assigned_to: assignedUserId,
        assigned_user_id: assignedUserId,
        assignedUserName: assignedUserName,
        assigned_user_name: assignedUserName,
        assignedDate: assignedDate,
        purchase_date: assignedDate,
        assigningAuthorityId: meta.assigningAuthorityId || null,
        assigningAuthorityName: meta.assigningAuthorityName || null,
        category: cat,
        companyId: r.company_id || meta.companyId,
        createdAt: r.created_at || meta.createdAt,
        updatedAt: r.updated_at || meta.updatedAt
      };
    });

    res.json(assets);
  } catch (err) {
    console.error("getAssets error:", err);
    res.status(500).json({ error: "Failed to fetch assets." });
  }
};

export const createAsset = async (req, res) => {
  try {
    const {
      name,
      category = ["Laptop"],
      serialNumber,
      status = "Available",
      assignedUserId,
      assignedUser,
      assignedDate,
      assigningAuthorityId,
      assigningAuthorityName,
      companyId
    } = req.body;

    const targetCompanyId = companyId || req.user?.companyId;
    const targetAssignee = assignedUserId || assignedUser || null;

    if (!name) {
      return res.status(400).json({ error: "Asset name is required." });
    }

    let assignedUserName = "";
    if (targetAssignee) {
      const uRes = await query("SELECT name FROM users WHERE id = $1", [targetAssignee]);
      if (uRes.rows.length > 0) assignedUserName = uRes.rows[0].name;
    }

    const id = "asset_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const catArray = Array.isArray(category) ? category : [category || "Laptop"];
    const catVal = catArray.join(",");

    const meta = {
      id,
      _id: id,
      name,
      category: catArray,
      serialNumber: serialNumber || "",
      status: status || "Available",
      assignedUserId: targetAssignee,
      assignedUserName,
      assignedDate: assignedDate || null,
      assigningAuthorityId: assigningAuthorityId || null,
      assigningAuthorityName: assigningAuthorityName || null,
      companyId: targetCompanyId,
      createdAt: new Date().toISOString()
    };

    const result = await query(
      `INSERT INTO assets (id, company_id, name, category, serial_number, status, assigned_to, purchase_date, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, targetCompanyId, name, catVal, serialNumber || "", status, targetAssignee, assignedDate ? assignedDate : null, JSON.stringify(meta)]
    );

    const r = result.rows[0];
    res.status(201).json({
      ...r,
      ...meta,
      id: r.id,
      _id: r.id,
      serialNumber: r.serial_number,
      assignedUser: targetAssignee,
      assignedUserId: targetAssignee,
      assigned_to: targetAssignee,
      assigned_user_id: targetAssignee,
      assignedUserName,
      assignedDate: assignedDate || null,
      category: catArray
    });
  } catch (err) {
    console.error("createAsset error:", err);
    res.status(500).json({ error: "Failed to create asset." });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    let targetAssignee = undefined;
    if (updates.assignedUserId !== undefined || updates.assignedUser !== undefined || updates.assigned_to !== undefined) {
      targetAssignee = updates.assignedUserId || updates.assignedUser || updates.assigned_to || null;
    }

    let assignedUserName = updates.assignedUserName;
    if (targetAssignee && !assignedUserName) {
      const uRes = await query("SELECT name FROM users WHERE id = $1", [targetAssignee]);
      if (uRes.rows.length > 0) assignedUserName = uRes.rows[0].name;
    }

    const allowed = [
      "name", "category", "serial_number", "status", "assigned_to", "purchase_date"
    ];

    for (const key of Object.keys(updates)) {
      let snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (key === "assignedUser" || key === "assignedUserId") snakeKey = "assigned_to";
      if (key === "assignedDate") snakeKey = "purchase_date";
      if (key === "serialNumber") snakeKey = "serial_number";

      if (allowed.includes(snakeKey)) {
        let val = updates[key];
        if (snakeKey === "category" && Array.isArray(val)) val = val.join(",");
        if (snakeKey === "purchase_date" && val === "") val = null;
        fields.push(`${snakeKey} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    // Merge metadata
    const metadataUpdates = {
      ...updates,
      assignedUserId: targetAssignee !== undefined ? targetAssignee : undefined,
      assignedUserName: assignedUserName !== undefined ? assignedUserName : undefined
    };
    Object.keys(metadataUpdates).forEach(k => metadataUpdates[k] === undefined && delete metadataUpdates[k]);

    fields.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${idx}::jsonb`);
    values.push(JSON.stringify(metadataUpdates));
    idx++;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE assets SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asset not found." });
    }

    const r = result.rows[0];
    const meta = (r.metadata && typeof r.metadata === "object") ? r.metadata : {};
    
    let cat = meta.category || r.category;
    if (typeof cat === "string") {
      cat = cat.includes(",") ? cat.split(",").map(s=>s.trim()) : [cat];
    }

    res.json({
      ...r,
      ...meta,
      id: r.id,
      _id: r.id,
      serialNumber: r.serial_number,
      assignedUser: r.assigned_to,
      assignedUserId: r.assigned_to,
      assigned_to: r.assigned_to,
      assigned_user_id: r.assigned_to,
      assignedUserName: assignedUserName || meta.assignedUserName || "",
      assignedDate: r.purchase_date,
      category: Array.isArray(cat) ? cat : ["Laptop"]
    });
  } catch (err) {
    console.error("updateAsset error:", err);
    res.status(500).json({ error: "Failed to update asset." });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM assets WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asset not found." });
    }
    res.json({ message: "Asset deleted successfully.", id });
  } catch (err) {
    console.error("deleteAsset error:", err);
    res.status(500).json({ error: "Failed to delete asset." });
  }
};
