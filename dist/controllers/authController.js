"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Kullanıcı kaydı
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, email, full_name } = req.body;
        // Kullanıcı adı veya e-posta zaten kullanılıyor mu kontrol et
        const [existingUsers] = yield db_1.default.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
        if (existingUsers.length > 0) {
            return res
                .status(400)
                .json({ message: "Kullanıcı adı veya e-posta zaten kullanılıyor." });
        }
        // Şifreyi hashle
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Kullanıcıyı veritabanına ekle
        const [result] = yield db_1.default.query("INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)", [username, hashedPassword, email, full_name]);
        // JWT token oluştur - burada JWT kütüphanesinin tiplerle ilgili sorunlarını çözmek için
        // daha basit bir yapı kullanacağız
        const secretKey = process.env.JWT_SECRET || "fallback_secret";
        // Burada jwt.sign sadece gerekli olan payload ve secretKey parametrelerini kullanıyoruz
        // options parametresini kaldırıyoruz çünkü TypeScript hataları ile ilgili sorunlar var
        const token = jsonwebtoken_1.default.sign({ id: result.insertId, username }, secretKey);
        res.status(201).json({
            message: "Kullanıcı başarıyla kaydedildi.",
            token,
            user: {
                id: result.insertId,
                username,
                email,
                full_name,
            },
        });
    }
    catch (error) {
        console.error("Kayıt hatası:", error);
        res.status(500).json({ message: "Sunucu hatası." });
    }
});
exports.register = register;
// Kullanıcı girişi
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // Kullanıcıyı bul
        const [users] = yield db_1.default.query("SELECT * FROM users WHERE username = ?", [username]);
        if (users.length === 0) {
            return res
                .status(401)
                .json({ message: "Geçersiz kullanıcı adı veya şifre." });
        }
        const user = users[0];
        // Şifreyi kontrol et
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ message: "Geçersiz kullanıcı adı veya şifre." });
        }
        // JWT token oluştur - burada JWT kütüphanesinin tiplerle ilgili sorunlarını çözmek için
        // daha basit bir yapı kullanacağız
        const secretKey = process.env.JWT_SECRET || "fallback_secret";
        // Burada jwt.sign sadece gerekli olan payload ve secretKey parametrelerini kullanıyoruz
        // options parametresini kaldırıyoruz çünkü TypeScript hataları ile ilgili sorunlar var
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, secretKey);
        res.status(200).json({
            message: "Giriş başarılı.",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({ message: "Sunucu hatası." });
    }
});
exports.login = login;
// Kullanıcı profili
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const [users] = yield db_1.default.query("SELECT id, username, email, full_name, avatar, registration_date FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı." });
        }
        res.status(200).json({
            user: users[0],
        });
    }
    catch (error) {
        console.error("Profil getirme hatası:", error);
        res.status(500).json({ message: "Sunucu hatası." });
    }
});
exports.getProfile = getProfile;
// Kullanıcı profili güncelleme
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { full_name, email } = req.body;
        // Avatar dosyası varsa işle
        let avatarPath = null;
        if (req.file) {
            avatarPath = req.file.path;
        }
        // Güncelleme sorgusu
        let query = "UPDATE users SET full_name = ?, email = ?";
        let params = [full_name, email];
        // Avatar varsa sorguya ekle
        if (avatarPath) {
            query += ", avatar = ?";
            params.push(avatarPath);
        }
        query += " WHERE id = ?";
        params.push(userId);
        yield db_1.default.query(query, params);
        res.status(200).json({
            message: "Profil başarıyla güncellendi.",
        });
    }
    catch (error) {
        console.error("Profil güncelleme hatası:", error);
        res.status(500).json({ message: "Sunucu hatası." });
    }
});
exports.updateProfile = updateProfile;
