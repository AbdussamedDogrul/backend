import express, { RequestHandler } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
} from "../controllers/authController";
import { auth } from "../middleware/auth";
import multer from "multer";

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || "./uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Sadece resim dosyaları yüklenebilir."));
    }
  },
});

const router = express.Router();

// Auth rotaları
router.post("/register", register as RequestHandler);
router.post("/login", login as RequestHandler);
router.get("/profile", auth as RequestHandler, getProfile as RequestHandler);
router.put(
  "/profile",
  auth as RequestHandler,
  upload.single("avatar"),
  updateProfile as RequestHandler
);

export default router;
