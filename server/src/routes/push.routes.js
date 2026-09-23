import express from "express";
import {
  getVapidKey,
  subscribePush,
  unsubscribePush,
  getPushStatus
} from "../controllers/pushController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// Public — frontend needs VAPID key before login to subscribe
router.get("/vapid-key", getVapidKey);

// Protected — must be logged in
router.use(authenticateToken);
router.post("/subscribe", subscribePush);
router.delete("/unsubscribe", unsubscribePush);
router.get("/status", getPushStatus);

export default router;
