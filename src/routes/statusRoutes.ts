import express, { RequestHandler } from "express";
import {
  getTaskStatuses,
  createTaskStatus,
  updateTaskStatus,
  deleteTaskStatus,
} from "../controllers/statusController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Görev durumları
router.get("/", auth as RequestHandler, getTaskStatuses as RequestHandler);
router.post("/", auth as RequestHandler, createTaskStatus as RequestHandler);
router.put("/:id", auth as RequestHandler, updateTaskStatus as RequestHandler);
router.delete(
  "/:id",
  auth as RequestHandler,
  deleteTaskStatus as RequestHandler
);

export default router;
