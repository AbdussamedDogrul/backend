"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subtaskController_1 = require("../controllers/subtaskController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Alt görevler
router.get("/task/:taskId", auth_1.auth, subtaskController_1.getSubtasks);
router.post("/task/:taskId", auth_1.auth, subtaskController_1.createSubtask);
router.put("/:id", auth_1.auth, subtaskController_1.updateSubtask);
router.delete("/:id", auth_1.auth, subtaskController_1.deleteSubtask);
router.put("/positions/update", auth_1.auth, subtaskController_1.updateSubtaskPositions);
exports.default = router;
