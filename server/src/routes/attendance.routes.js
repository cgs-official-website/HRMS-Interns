import express from "express";
import {
  getAttendance,
  checkIn,
  checkOut,
  updateAttendance,
  deleteAttendance,
  getAttendanceRules,
  updateAttendanceRules
} from "../controllers/attendanceController.js";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";

const router = express.Router();

// Rules (Publicly readable)
router.get("/rules", optionalAuth, getAttendanceRules);

router.use(authenticateToken);
router.get("/", getAttendance);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.patch("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);
router.post("/rules", updateAttendanceRules);

export default router;
