"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tagController_1 = require("../controllers/tagController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Etiketler
router.get("/", auth_1.auth, tagController_1.getTags);
router.post("/", auth_1.auth, tagController_1.createTag);
router.put("/:id", auth_1.auth, tagController_1.updateTag);
router.delete("/:id", auth_1.auth, tagController_1.deleteTag);
// Görev-Etiket ilişkileri
router.post("/task", auth_1.auth, tagController_1.addTagToTask);
router.delete("/task/:taskId/tag/:tagId", auth_1.auth, tagController_1.removeTagFromTask);
router.get("/task/:taskId", auth_1.auth, tagController_1.getTaskTags);
exports.default = router;
