import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import fs from "fs";

// Route'ları import et
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import subtaskRoutes from "./routes/subtaskRoutes";
import tagRoutes from "./routes/tagRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import statusRoutes from "./routes/statusRoutes";

// Çevre değişkenlerini yükle
dotenv.config();

// Express uygulamasını oluştur
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware'ler
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dosya yükleme için uploads klasörünü oluştur
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Statik dosyalar için uploads klasörünü kullanıma aç
app.use("/uploads", express.static(path.join(__dirname, "..", uploadDir)));

// Route'ları tanımla
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subtasks", subtaskRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statuses", statusRoutes);

// Ana route
app.get("/", (req, res) => {
  res.send("Görev Yöneticisi API çalışıyor!");
});

// Hata yakalama middleware'i
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Sunucu hatası." });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});

export default app;
