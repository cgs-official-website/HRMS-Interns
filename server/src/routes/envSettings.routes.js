import express from "express";
import {
  getEnvSettings,
  createEnvSetting,
  updateEnvSetting,
  deleteEnvSetting
} from "../controllers/envSettingsController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getEnvSettings);
router.post("/", createEnvSetting);
router.patch("/:id", updateEnvSetting);
router.delete("/:id", deleteEnvSetting);

export default router;
