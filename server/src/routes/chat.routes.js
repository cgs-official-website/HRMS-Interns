import express from "express";
import {
  getChannels,
  createChannel,
  getMessages,
  sendMessage,
  pinMessage,
  getDmThreads,
  createDmThread,
  getDirectMessages,
  sendDirectMessage,
  deleteMessage,
  updateReadReceipt
} from "../controllers/chatController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/channels", getChannels);
router.post("/channels", createChannel);
router.get("/messages", getMessages);
router.post("/messages", sendMessage);
router.delete("/messages/:id", deleteMessage);
router.patch("/messages/:id/pin", pinMessage);
router.get("/dm-threads", getDmThreads);
router.post("/dm-threads", createDmThread);
router.get("/dm-threads/:threadId/messages", getDirectMessages);
router.post("/dm-messages", sendDirectMessage);
router.post("/read-receipt", updateReadReceipt);

export default router;
