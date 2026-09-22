import express from "express";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from "../controllers/roleController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getRoles);
router.post("/", createRole);
router.patch("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
