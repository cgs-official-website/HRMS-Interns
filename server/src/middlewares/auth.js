import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "hrms_jwt_super_secret_railway_2026";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const role = (req.user.role || "").toLowerCase().trim();
  const isAdmin = role === "admin" || role === "superadmin" || role === "system admin" || role === "systemadmin" || req.user.isAdmin === true;

  if (!isAdmin) {
    return res.status(403).json({ error: "Access forbidden. Admin role required." });
  }

  next();
};

export const requireManagerOrAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const result = await query("SELECT role, is_project_manager FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found." });
    }

    const dbUser = result.rows[0];
    const role = (dbUser.role || "").toLowerCase().trim();
    const isAllowed = role === "admin" || role === "superadmin" || role === "system admin" || role === "systemadmin" || role === "manager" || role === "project manager" || Boolean(dbUser.is_project_manager);

    if (!isAllowed) {
      return res.status(403).json({ error: "Access forbidden. Manager or Admin role required." });
    }

    next();
  } catch (err) {
    console.error("requireManagerOrAdmin error:", err);
    return res.status(500).json({ error: "Failed to verify permissions." });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const role = (req.user.role || "").toLowerCase().trim();
  const isSuper = role === "superadmin" || role === "system admin" || role === "systemadmin";

  if (!isSuper) {
    return res.status(403).json({ error: "Access forbidden. Superadmin role required." });
  }

  next();
};

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};

