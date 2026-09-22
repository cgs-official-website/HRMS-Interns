import jwt from "jsonwebtoken";

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

export const requireManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const role = (req.user.role || "").toLowerCase().trim();
  const isAllowed = role === "admin" || role === "superadmin" || role === "system admin" || role === "systemadmin" || role === "manager" || role === "project manager" || Boolean(req.user?.isProjectManager || req.user?.is_project_manager) || req.user.isAdmin === true;

  if (!isAllowed) {
    return res.status(403).json({ error: "Access forbidden. Manager or Admin role required." });
  }

  next();
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

