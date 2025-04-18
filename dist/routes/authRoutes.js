"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
// Multer konfigürasyonu
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_PATH || "./uploads");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${uniqueSuffix}${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Sadece resim dosyaları yüklenebilir."));
        }
    },
});
const router = express_1.default.Router();
// Auth rotaları
router.post("/register", authController_1.register);
router.post("/login", authController_1.login);
router.get("/profile", auth_1.auth, authController_1.getProfile);
router.put("/profile", auth_1.auth, upload.single("avatar"), authController_1.updateProfile);
exports.default = router;
