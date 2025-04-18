import express, { RequestHandler } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  mentionUser,
  getTaskMentions,
} from "../controllers/notificationController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Bildirimler
router.get("/", auth as RequestHandler, getNotifications as RequestHandler);
router.put(
  "/:id/read",
  auth as RequestHandler,
  markNotificationAsRead as RequestHandler
);
router.put(
  "/read-all",
  auth as RequestHandler,
  markAllNotificationsAsRead as RequestHandler
);
router.delete(
  "/:id",
  auth as RequestHandler,
  deleteNotification as RequestHandler
);

// Kullanıcı etiketleme
router.post("/mention", auth as RequestHandler, mentionUser as RequestHandler);
router.get(
  "/mentions/task/:taskId",
  auth as RequestHandler,
  getTaskMentions as RequestHandler
);

export default router;
