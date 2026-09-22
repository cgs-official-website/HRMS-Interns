import express from "express";
import {
  getDailyReports,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
  getWeeklyReports,
  createWeeklyReport,
  updateWeeklyReport,
  deleteWeeklyReport,
  getTaskReports,
  createTaskReport
} from "../controllers/reportController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

// Daily Reports
router.get("/daily", getDailyReports);
router.post("/daily", createDailyReport);
router.patch("/daily/:id", updateDailyReport);
router.delete("/daily/:id", deleteDailyReport);

// Weekly Reports
router.get("/weekly", getWeeklyReports);
router.post("/weekly", createWeeklyReport);
router.patch("/weekly/:id", updateWeeklyReport);
router.delete("/weekly/:id", deleteWeeklyReport);

// Task Reports
router.get("/tasks", getTaskReports);
router.post("/tasks", createTaskReport);

export default router;
