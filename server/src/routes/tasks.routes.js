import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
