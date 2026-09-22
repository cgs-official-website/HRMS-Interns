import express from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
