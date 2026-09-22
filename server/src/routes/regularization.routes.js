import express from "express";
import {
  getRegularizationRequests,
  createRegularizationRequest,
  updateRegularizationStatus
} from "../controllers/regularizationController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getRegularizationRequests);
router.post("/", createRegularizationRequest);
router.patch("/:id", updateRegularizationStatus);
router.patch("/:id/status", updateRegularizationStatus);

export default router;

