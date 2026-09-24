import { query } from "../config/db.js";
import { sendRegistrationLinkEmail } from "../services/emailService.js";

export const getCompanies = async (req, res) => {
  try {
    const result = await query("SELECT * FROM companies ORDER BY name ASC");
    res.json(result.rows.map(r => ({
      ...r,
      logoBase64: r.logo_url,
      settings: r.settings || {},
      payrollSettings: r.settings?.payrollSettings || { pf: true, esi: true, pt: true, insurance: false, insuranceAmount: 0, workingDays: 30 },
      address: r.settings?.address || "",
      modules: r.settings?.modules || ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]
    })));
  } catch (err) {
    console.error("getCompanies error:", err);
    res.status(500).json({ error: "Failed to fetch companies." });
  }
};

export const getCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await query("SELECT * FROM companies WHERE slug = $1 OR id = $1", [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found." });
    }
    const r = result.rows[0];
    res.json({
      ...r,
      logoBase64: r.logo_url,
      settings: r.settings || {},
      payrollSettings: r.settings?.payrollSettings || { pf: true, esi: true, pt: true, insurance: false, insuranceAmount: 0, workingDays: 30 },
      address: r.settings?.address || "",
      modules: r.settings?.modules || ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]
    });
  } catch (err) {
    console.error("getCompanyBySlug error:", err);
    res.status(500).json({ error: "Failed to fetch company." });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, slug, domain, plan = "basic", logoBase64, address, payrollSettings, modules } = req.body;
    const id = req.body.id || "comp_" + Math.random().toString(36).substr(2, 9);

    const settings = {
      address: address || "",
      payrollSettings: payrollSettings || { pf: true, esi: true, pt: true, insurance: false, insuranceAmount: 0, workingDays: 30 },
      modules: modules || ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]
    };

    const result = await query(
      `INSERT INTO companies (id, name, slug, domain, plan, logo_url, settings, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         domain = EXCLUDED.domain,
         logo_url = EXCLUDED.logo_url,
         settings = EXCLUDED.settings,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, name, slug || id, domain || null, plan, logoBase64 || null, JSON.stringify(settings)]
    );

    const r = result.rows[0];
    res.status(201).json({
      ...r,
      logoBase64: r.logo_url,
      settings: r.settings || {},
      payrollSettings: r.settings?.payrollSettings || settings.payrollSettings,
      address: r.settings?.address || settings.address,
      modules: r.settings?.modules || ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]
    });
  } catch (err) {
    console.error("createCompany error:", err);
    res.status(500).json({ error: "Failed to create company." });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logoBase64, address, payrollSettings, modules, status } = req.body;
    const role = (req.user?.role || "").toLowerCase().trim();
    const isSuperAdmin = role === "superadmin" || role === "system admin" || role === "systemadmin";

    // Non-superadmins can only update their own company
    if (!isSuperAdmin && req.user?.companyId && req.user.companyId !== id) {
      return res.status(403).json({ error: "Access denied. You can only modify your own company." });
    }

    const existing = await query("SELECT * FROM companies WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Company not found." });
    }


    const currentSettings = existing.rows[0].settings || {};
    if (address !== undefined) currentSettings.address = address;
    if (payrollSettings !== undefined) currentSettings.payrollSettings = payrollSettings;
    if (modules !== undefined) currentSettings.modules = modules;

    const result = await query(
      `UPDATE companies
       SET name = COALESCE($1, name),
           logo_url = COALESCE($2, logo_url),
           status = COALESCE($3, status),
           settings = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name || null, logoBase64 || null, status || null, JSON.stringify(currentSettings), id]
    );

    const r = result.rows[0];
    res.json({
      ...r,
      logoBase64: r.logo_url,
      settings: r.settings || {},
      payrollSettings: r.settings?.payrollSettings || currentSettings.payrollSettings || { pf: true, esi: true, pt: true, insurance: false, insuranceAmount: 0, workingDays: 30 },
      address: r.settings?.address || currentSettings.address || "",
      modules: r.settings?.modules || ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]
    });
  } catch (err) {
    console.error("updateCompany error:", err);
    res.status(500).json({ error: "Failed to update company." });
  }
};

export const getCompanyDomains = async (req, res) => {
  try {
    const { companyId } = req.query;
    let sql = "SELECT * FROM company_domains WHERE 1=1";
    const params = [];
    if (companyId) {
      params.push(companyId);
      sql += ` AND company_id = $${params.length}`;
    }
    const result = await query(sql, params);
    const rows = result.rows.map(r => ({
      ...r,
      id: r.domain,
      domain: r.domain,
      companyId: r.company_id,
      status: r.status || "PENDING",
      createdBy: r.created_by,
      createdAt: r.created_at,
      verificationToken: `carrezza-verify=${Buffer.from(r.domain).toString('hex').slice(0, 12)}`
    }));
    res.json(rows);
  } catch (err) {
    console.error("getCompanyDomains error:", err);
    res.status(500).json({ error: "Failed to fetch company domains." });
  }
};

export const addCompanyDomain = async (req, res) => {
  try {
    const { domain, companyId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId;
    const createdBy = req.user?.id || null;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required." });
    }
    const cleanDomain = domain.toLowerCase().trim();

    const existing = await query("SELECT * FROM company_domains WHERE domain = $1", [cleanDomain]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "This domain is already claimed by an organization." });
    }

    const result = await query(
      `INSERT INTO company_domains (domain, company_id, status, created_by)
       VALUES ($1, $2, 'PENDING', $3)
       RETURNING *`,
      [cleanDomain, targetCompanyId, createdBy]
    );
    const r = result.rows[0];
    res.status(201).json({
      ...r,
      id: r.domain,
      domain: r.domain,
      companyId: r.company_id,
      status: r.status,
      createdBy: r.created_by,
      createdAt: r.created_at,
      verificationToken: `carrezza-verify=${Buffer.from(r.domain).toString('hex').slice(0, 12)}`
    });
  } catch (err) {
    console.error("addCompanyDomain error:", err);
    res.status(500).json({ error: "Failed to add domain." });
  }
};

export const deleteCompanyDomain = async (req, res) => {
  try {
    const domain = req.params.domain || req.query.domain || req.body.domain;
    if (!domain) {
      return res.status(400).json({ error: "Domain parameter is required." });
    }
    const cleanDomain = decodeURIComponent(domain).toLowerCase().trim();
    await query("DELETE FROM company_domains WHERE domain = $1", [cleanDomain]);
    res.json({ success: true, message: "Domain deleted successfully." });
  } catch (err) {
    console.error("deleteCompanyDomain error:", err);
    res.status(500).json({ error: "Failed to delete domain." });
  }
};

export const verifyCompanyDomain = async (req, res) => {
  try {
    const domain = req.params.domain || req.body.domainName || req.body.domain;
    if (!domain) {
      return res.status(400).json({ error: "Domain parameter is required." });
    }
    const cleanDomain = decodeURIComponent(domain).toLowerCase().trim();
    const result = await query(
      `UPDATE company_domains SET status = 'VERIFIED' WHERE domain = $1 RETURNING *`,
      [cleanDomain]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Domain not found." });
    }
    res.json({ success: true, status: "VERIFIED", domain: result.rows[0] });
  } catch (err) {
    console.error("verifyCompanyDomain error:", err);
    res.status(500).json({ error: "Failed to verify domain." });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || "").toLowerCase().trim();
    const isSuperAdmin = role === "superadmin" || role === "system admin" || role === "systemadmin";

    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Access denied. Superadmin role required to delete organizations." });
    }

    const result = await query("DELETE FROM companies WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found." });
    }

    res.json({ success: true, message: "Company deleted successfully." });
  } catch (err) {
    console.error("deleteCompany error:", err);
    res.status(500).json({ error: "Failed to delete company." });
  }
};

export const sendRegistrationLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const role = (req.user?.role || "").toLowerCase().trim();
    const isSuperAdmin = role === "superadmin" || role === "system admin" || role === "systemadmin";

    // Non-superadmins can only send links for their own company
    if (!isSuperAdmin && req.user?.companyId && req.user.companyId !== id) {
      return res.status(403).json({ error: "Access denied. You can only send registration links for your own company." });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const result = await query("SELECT * FROM companies WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found." });
    }
    const company = result.rows[0];

    const origin = req.headers.origin || req.headers.referer;
    let baseUrl = process.env.APP_URL || "https://hrms.teamzuna.in";
    if (origin) {
      try {
        baseUrl = new URL(origin).origin;
      } catch (e) {}
    }
    const registrationLink = `${baseUrl}/${company.slug}/register`;

    const emailResult = await sendRegistrationLinkEmail({
      email: email.toLowerCase().trim(),
      companyName: company.name,
      registrationLink,
      senderName: req.user?.name || ""
    });

    if (!emailResult.success && emailResult.reason === "SMTP_NOT_CONFIGURED") {
      return res.status(500).json({ error: "Email service is not configured on the server." });
    }
    if (!emailResult.success) {
      return res.status(500).json({ error: emailResult.error || "Failed to send registration link email." });
    }

    res.json({ message: "Registration link sent successfully." });
  } catch (err) {
    console.error("sendRegistrationLink error:", err);
    res.status(500).json({ error: "Failed to send registration link." });
  }
};
