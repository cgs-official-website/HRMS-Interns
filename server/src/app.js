import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import usersRoutes from "./routes/users.routes.js";
import leavesRoutes from "./routes/leaves.routes.js";
import regularizationRoutes from "./routes/regularization.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import assetsRoutes from "./routes/assets.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import envSettingsRoutes from "./routes/envSettings.routes.js";
import companiesRoutes from "./routes/companies.routes.js";
import externalLinksRoutes from "./routes/externalLinks.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

const app = express();
app.set("trust proxy", 1);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== "/api/health") {
      console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// CORS Configuration with origin reflection
app.use(cors({
  origin: (origin, callback) => {
    // Always allow requests (origin reflection) while declaring safe headers
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/leaves", leavesRoutes);
app.use("/api/regularization", regularizationRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/environment-settings", envSettingsRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/external-links", externalLinksRoutes);

// Global 404 Handler for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Standardized Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Application Error:", err);
  const status = err.status || 500;
  const message = (process.env.NODE_ENV === "production" && status === 500)
    ? "An unexpected internal server error occurred."
    : (err.message || "Internal server error.");
  res.status(status).json({ error: message });
});

export default app;

