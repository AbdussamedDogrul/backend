import express, { RequestHandler } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskPositions,
} from "../controllers/taskController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Görev kartları
router.get("/", auth as RequestHandler, getTasks as RequestHandler);
router.post("/", auth as RequestHandler, createTask as RequestHandler);
router.put("/:id", auth as RequestHandler, updateTask as RequestHandler);
router.delete("/:id", auth as RequestHandler, deleteTask as RequestHandler);
router.put(
  "/positions/update",
  auth as RequestHandler,
  updateTaskPositions as RequestHandler
);

export default router;
