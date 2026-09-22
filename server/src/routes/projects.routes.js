import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  getTasks,
  createTask,
  updateTask
} from "../controllers/projectController.js";
import { authenticateToken, requireManagerOrAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getProjects);
router.post("/", requireManagerOrAdmin, createProject);
router.patch("/:id", requireManagerOrAdmin, updateProject);
router.delete("/:id", requireManagerOrAdmin, deleteProject);
router.post("/:id/members", requireManagerOrAdmin, addProjectMember);

router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.patch("/tasks/:id", updateTask);

export default router;
