"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Route'ları import et
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const subtaskRoutes_1 = __importDefault(require("./routes/subtaskRoutes"));
const tagRoutes_1 = __importDefault(require("./routes/tagRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const statusRoutes_1 = __importDefault(require("./routes/statusRoutes"));
// Çevre değişkenlerini yükle
dotenv_1.default.config();
// Express uygulamasını oluştur
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware'ler
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Dosya yükleme için uploads klasörünü oluştur
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Statik dosyalar için uploads klasörünü kullanıma aç
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", uploadDir)));
// Route'ları tanımla
app.use("/api/auth", authRoutes_1.default);
app.use("/api/tasks", taskRoutes_1.default);
app.use("/api/subtasks", subtaskRoutes_1.default);
app.use("/api/tags", tagRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/statuses", statusRoutes_1.default);
// Ana route
app.get("/", (req, res) => {
    res.send("Görev Yöneticisi API çalışıyor!");
});
// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Sunucu hatası." });
});
// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
exports.default = app;
