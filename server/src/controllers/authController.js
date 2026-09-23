import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { generateToken } from "../middlewares/auth.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await query(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER($1) ORDER BY (password_hash IS NOT NULL) DESC, created_at DESC LIMIT 1",
      [cleanEmail]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials. User not found." });
    }

    const user = result.rows[0];

    // If password_hash does not exist, require user to set a password via Forgot Password
    if (!user.password_hash) {
      return res.status(401).json({ error: "Password has not been set for this account. Please use 'Forgot password?' to set your password." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      isProjectManager: user.is_project_manager
    });

    const { password_hash, metadata = {}, ...userProfile } = user;
    const meta = metadata && typeof metadata === "object" ? metadata : {};
    const empId = user.employee_id || meta.employeeId || meta.employee_id || "";

    const mappedUser = {
      ...userProfile,
      ...meta,
      uid: user.id,
      id: user.id,
      employeeId: empId,
      employee_id: empId,
      companyId: user.company_id,
      company_id: user.company_id,
      shiftStart: user.shift_start,
      shiftEnd: user.shift_end,
      annualLeaves: Number(user.casual_leave_quota || 25),
      sickLeaves: Number(user.sick_leave_quota || 10),
      casualLeaves: Number(user.paid_leave_quota || 6),
      isProjectManager: user.is_project_manager,
      projects: Array.isArray(user.projects) ? user.projects : (meta.projects || []),
      tasks: Array.isArray(meta.tasks) ? meta.tasks : []
    };

    res.json({ token, user: mappedUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during login." });
  }
};

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      designation,
      programType,
      shiftStart,
      shiftEnd,
      companyId,
      role: requestedRole,
      employeeId
    } = req.body;

    // Determine safe role: only allow admin/superadmin if explicitly set AND no companyId
    // When registering via the org link (companyId provided), always force role to 'employee'
    let role = requestedRole || "employee";
    if (companyId && companyId.trim() !== "") {
      // Registering under a company via the org link — only allow employee role
      if (role !== "admin" && role !== "superadmin") {
        role = "employee";
      }
    } else {
      // No company context — allow employee (never auto-elevate to admin)
      if (!role || role === "user") role = "employee";
    }

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "User with this email already exists." });
    }

    let resolvedCompanyId = null;
    if (companyId && typeof companyId === "string" && companyId.trim() !== "") {
      const trimmedCompanyId = companyId.trim();
      const compCheck = await query(
        "SELECT id FROM companies WHERE id = $1 OR slug = $1 LIMIT 1",
        [trimmedCompanyId]
      );
      if (compCheck.rows.length > 0) {
        resolvedCompanyId = compCheck.rows[0].id;
      } else {
        // Auto-create company stub if not existing so foreign key constraint is met
        await query(
          `INSERT INTO companies (id, name, slug, status) 
           VALUES ($1, $2, $3, 'pending') 
           ON CONFLICT (id) DO NOTHING`,
          [trimmedCompanyId, trimmedCompanyId, trimmedCompanyId.toLowerCase()]
        );
        resolvedCompanyId = trimmedCompanyId;
      }
    }

    // Auto-generate Employee ID if not provided
    let resolvedEmployeeId = (employeeId || "").trim() || null;
    if (!resolvedEmployeeId && resolvedCompanyId) {
      // Count existing users in this company to generate a sequential ID
      const countRes = await query(
        "SELECT COUNT(*) as cnt FROM users WHERE company_id = $1",
        [resolvedCompanyId]
      );
      const seq = (parseInt(countRes.rows[0]?.cnt || 0) + 1).toString().padStart(4, "0");
      resolvedEmployeeId = `EMP-${seq}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = "usr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    const insertRes = await query(
      `INSERT INTO users (
         id, name, email, password_hash, department, designation, program_type,
         shift_start, shift_end, company_id, role, employee_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, name, email, role, department, designation, program_type, shift_start, shift_end, company_id, employee_id, created_at`,
      [
        userId,
        name,
        email.toLowerCase().trim(),
        passwordHash,
        department || null,
        designation || null,
        programType || "Full-time",
        shiftStart || "09:00",
        shiftEnd || "18:00",
        resolvedCompanyId,
        role,
        resolvedEmployeeId
      ]
    );

    const newUser = insertRes.rows[0];
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.company_id
    });

    const mappedUser = {
      ...newUser,
      uid: newUser.id,
      id: newUser.id,
      employeeId: resolvedEmployeeId || "",
      employee_id: resolvedEmployeeId || "",
      companyId: newUser.company_id,
      company_id: newUser.company_id,
      shiftStart: newUser.shift_start || shiftStart || "09:00",
      shiftEnd: newUser.shift_end || shiftEnd || "18:00",
      annualLeaves: 25,
      sickLeaves: 10,
      casualLeaves: 6,
      isProjectManager: false,
      projects: [],
      tasks: []
    };

    // Send welcome email asynchronously
    sendWelcomeEmail({
      email: newUser.email,
      name: newUser.name,
      employeeId: resolvedEmployeeId || null,
      shiftStart: shiftStart || "09:00",
      shiftEnd: shiftEnd || "18:00",
      role: newUser.role
    }).catch(e => console.error("Error sending welcome email:", e));

    res.status(201).json({ token, user: mappedUser });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Internal server error during registration." });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    const { password_hash, metadata = {}, ...userProfile } = result.rows[0];
    const meta = metadata && typeof metadata === "object" ? metadata : {};
    const empId = userProfile.employee_id || meta.employeeId || meta.employee_id || "";

    const mappedUser = {
      ...userProfile,
      ...meta,
      uid: userProfile.id,
      id: userProfile.id,
      employeeId: empId,
      employee_id: empId,
      companyId: userProfile.company_id,
      company_id: userProfile.company_id,
      shiftStart: userProfile.shift_start,
      shiftEnd: userProfile.shift_end,
      annualLeaves: Number(userProfile.casual_leave_quota || 25),
      sickLeaves: Number(userProfile.sick_leave_quota || 10),
      casualLeaves: Number(userProfile.paid_leave_quota || 6),
      isProjectManager: userProfile.is_project_manager,
      projects: Array.isArray(userProfile.projects) ? userProfile.projects : (meta.projects || []),
      tasks: Array.isArray(meta.tasks) ? meta.tasks : []
    };

    res.json({ user: mappedUser });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch user profile." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await query(
      "SELECT id, name, email FROM users WHERE LOWER(TRIM(email)) = LOWER($1) ORDER BY (password_hash IS NOT NULL) DESC, created_at DESC LIMIT 1",
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    const user = result.rows[0];
    const jwtSecret = process.env.JWT_SECRET || "hrms_jwt_super_secret_railway_2026";

    // Generate a reset token valid for 30 minutes
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: "password_reset" },
      jwtSecret,
      { expiresIn: "30m" }
    );

    // Determine client base URL dynamically
    const origin = req.headers.origin || req.headers.referer;
    let baseUrl = process.env.APP_URL || "https://hrms.teamzuna.in";
    if (origin) {
      try {
        const parsed = new URL(origin);
        baseUrl = parsed.origin;
      } catch (e) {
        // use default baseUrl
      }
    }

    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Dispatch email with prompt response protection (returns within 4s while background finishes)
    const emailPromise = sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetToken,
      resetUrl
    });

    const emailResult = await Promise.race([
      emailPromise,
      new Promise((resolve) => setTimeout(() => resolve({ success: true, pending: true }), 4000))
    ]);

    if (!emailResult.success && emailResult.reason === "SMTP_NOT_CONFIGURED") {
      return res.status(500).json({ error: "Email service is not configured on the server." });
    }

    if (!emailResult.success && !emailResult.pending) {
      return res.status(500).json({ error: emailResult.error || "Failed to deliver reset email." });
    }

    res.json({ message: "Password reset email sent successfully. Please check your inbox." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ error: "Internal server error while processing password reset." });
  }
};

export const confirmResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const jwtSecret = process.env.JWT_SECRET || "hrms_jwt_super_secret_railway_2026";
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return res.status(400).json({ error: "Password reset link is invalid or has expired. Please request a new one." });
    }

    if (decoded.type !== "password_reset" || !decoded.id) {
      return res.status(400).json({ error: "Invalid password reset token." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updateRes = await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 OR LOWER(TRIM(email)) = LOWER($3) RETURNING id, email, name",
      [passwordHash, decoded.id, decoded.email]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "Password has been successfully reset. You can now log in with your new password." });
  } catch (err) {
    console.error("confirmResetPassword error:", err);
    res.status(500).json({ error: "Internal server error while resetting password." });
  }
};

