"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Bildirimler
router.get("/", auth_1.auth, notificationController_1.getNotifications);
router.put("/:id/read", auth_1.auth, notificationController_1.markNotificationAsRead);
router.put("/read-all", auth_1.auth, notificationController_1.markAllNotificationsAsRead);
router.delete("/:id", auth_1.auth, notificationController_1.deleteNotification);
// Kullanıcı etiketleme
router.post("/mention", auth_1.auth, notificationController_1.mentionUser);
router.get("/mentions/task/:taskId", auth_1.auth, notificationController_1.getTaskMentions);
exports.default = router;
