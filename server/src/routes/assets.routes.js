import express from "express";
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset
} from "../controllers/assetController.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getAssets);
router.post("/", requireAdmin, createAsset);
router.patch("/:id", requireAdmin, updateAsset);
router.delete("/:id", requireAdmin, deleteAsset);

export default router;

