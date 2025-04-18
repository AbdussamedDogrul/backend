import express, { RequestHandler } from "express";
import {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  updateSubtaskPositions,
} from "../controllers/subtaskController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Alt görevler
router.get(
  "/task/:taskId",
  auth as RequestHandler,
  getSubtasks as RequestHandler
);
router.post(
  "/task/:taskId",
  auth as RequestHandler,
  createSubtask as RequestHandler
);
router.put("/:id", auth as RequestHandler, updateSubtask as RequestHandler);
router.delete("/:id", auth as RequestHandler, deleteSubtask as RequestHandler);
router.put(
  "/positions/update",
  auth as RequestHandler,
  updateSubtaskPositions as RequestHandler
);

export default router;
