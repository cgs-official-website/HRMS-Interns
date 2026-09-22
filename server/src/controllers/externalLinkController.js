import { query } from "../config/db.js";

export const getExternalLinks = async (req, res) => {
  try {
    const { companyId } = req.query;
    const targetCompanyId = companyId || req.user?.companyId;

    let sql = "SELECT * FROM external_links WHERE 1=1";
    const params = [];
    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND company_id = $${params.length}`;
    }
    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    
    const formatted = result.rows.map(row => ({
      ...row,
      id: row.id,
      _id: row.id,
      token: row.link_token,
      linkToken: row.link_token,
      clientName: row.client_name,
      clientEmail: row.client_email,
      projectName: row.project_name,
      projectId: row.project_id,
      pmId: row.pm_id,
      pmName: row.pm_name,
      channelId: row.channel_id,
      status: row.status,
      companyId: row.company_id,
      createdAt: row.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getExternalLinks error:", err);
    res.status(500).json({ error: "Failed to fetch external links." });
  }
};

export const getExternalLinkByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await query("SELECT * FROM external_links WHERE link_token = $1", [token]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "External link not found or expired." });
    }
    const row = result.rows[0];
    res.json({
      ...row,
      id: row.id,
      _id: row.id,
      token: row.link_token,
      linkToken: row.link_token,
      channelId: row.channel_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      projectId: row.project_id,
      projectName: row.project_name,
      pmId: row.pm_id,
      pmName: row.pm_name,
      companyId: row.company_id,
      status: row.status,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error("getExternalLinkByToken error:", err);
    res.status(500).json({ error: "Failed to fetch external link." });
  }
};

export const createExternalLink = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      projectId,
      projectName,
      pmId,
      pmName,
      channelId,
      companyId,
      userId
    } = req.body;

    const targetCompanyId = companyId || req.user?.companyId;
    const targetUserId = userId || req.user?.id || pmId || null;
    const token = "link_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const id = "ext_" + Math.random().toString(36).substr(2, 9);

    // Create channel for external link if not provided
    let finalChannelId = channelId;
    if (!finalChannelId) {
      finalChannelId = "ch_client_" + (projectName || "project").toLowerCase().replace(/[^a-z0-9]/g, "-") + "_" + Math.random().toString(36).substr(2, 6);
      await query(
        `INSERT INTO channels (id, company_id, name, description, created_by, is_private)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (id) DO NOTHING`,
        [finalChannelId, targetCompanyId, `Client Chat - ${projectName || clientName}`, `External Client channel for ${clientName}`, pmId || null]
      );
    }

    const result = await query(
      `INSERT INTO external_links (id, company_id, user_id, link_token, channel_id, client_name, client_email, project_id, project_name, pm_id, pm_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
       RETURNING *`,
      [id, targetCompanyId, targetUserId, token, finalChannelId, clientName, clientEmail, projectId, projectName, pmId, pmName]
    );

    const row = result.rows[0];
    res.status(201).json({
      ...row,
      id: row.id,
      _id: row.id,
      token,
      linkToken: token,
      channelId: row.channel_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      projectName: row.project_name,
      pmName: row.pm_name,
      status: row.status,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error("createExternalLink error:", err);
    res.status(500).json({ error: "Failed to create external link." });
  }
};

export const revokeExternalLink = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE external_links SET status = 'revoked' WHERE id = $1 OR link_token = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "External link not found." });
    }
    const row = result.rows[0];
    res.json({
      message: "External link revoked.",
      link: {
        ...row,
        token: row.link_token,
        linkToken: row.link_token,
        channelId: row.channel_id
      }
    });
  } catch (err) {
    console.error("revokeExternalLink error:", err);
    res.status(500).json({ error: "Failed to revoke external link." });
  }
};
