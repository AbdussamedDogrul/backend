import express, { RequestHandler } from "express";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
  getTaskTags,
} from "../controllers/tagController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Etiketler
router.get("/", auth as RequestHandler, getTags as RequestHandler);
router.post("/", auth as RequestHandler, createTag as RequestHandler);
router.put("/:id", auth as RequestHandler, updateTag as RequestHandler);
router.delete("/:id", auth as RequestHandler, deleteTag as RequestHandler);

// Görev-Etiket ilişkileri
router.post("/task", auth as RequestHandler, addTagToTask as RequestHandler);
router.delete(
  "/task/:taskId/tag/:tagId",
  auth as RequestHandler,
  removeTagFromTask as RequestHandler
);
router.get(
  "/task/:taskId",
  auth as RequestHandler,
  getTaskTags as RequestHandler
);

export default router;
