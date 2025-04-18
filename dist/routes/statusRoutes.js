"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statusController_1 = require("../controllers/statusController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Görev durumları
router.get("/", auth_1.auth, statusController_1.getTaskStatuses);
router.post("/", auth_1.auth, statusController_1.createTaskStatus);
router.put("/:id", auth_1.auth, statusController_1.updateTaskStatus);
router.delete("/:id", auth_1.auth, statusController_1.deleteTaskStatus);
exports.default = router;
