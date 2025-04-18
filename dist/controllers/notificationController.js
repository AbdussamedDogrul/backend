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
exports.getTaskMentions = exports.mentionUser = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const db_1 = __importDefault(require("../config/db"));
// Bildirimleri getir
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const [notifications] = yield db_1.default.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.status(200).json({ notifications });
    }
    catch (error) {
        console.error('Bildirimleri getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.getNotifications = getNotifications;
// Bildirimi okundu olarak işaretle
const markNotificationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const notificationId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Bildirimin kullanıcıya ait olup olmadığını kontrol et
        const [notifications] = yield db_1.default.query('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
        if (notifications.length === 0) {
            return res.status(404).json({ message: 'Bildirim bulunamadı.' });
        }
        // Bildirimi okundu olarak işaretle
        yield db_1.default.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);
        res.status(200).json({
            message: 'Bildirim okundu olarak işaretlendi.'
        });
    }
    catch (error) {
        console.error('Bildirim işaretleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
// Tüm bildirimleri okundu olarak işaretle
const markAllNotificationsAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Tüm bildirimleri okundu olarak işaretle
        yield db_1.default.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        res.status(200).json({
            message: 'Tüm bildirimler okundu olarak işaretlendi.'
        });
    }
    catch (error) {
        console.error('Tüm bildirimleri işaretleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Bildirimi sil
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const notificationId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Bildirimin kullanıcıya ait olup olmadığını kontrol et
        const [notifications] = yield db_1.default.query('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
        if (notifications.length === 0) {
            return res.status(404).json({ message: 'Bildirim bulunamadı.' });
        }
        // Bildirimi sil
        yield db_1.default.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
        res.status(200).json({
            message: 'Bildirim başarıyla silindi.'
        });
    }
    catch (error) {
        console.error('Bildirim silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.deleteNotification = deleteNotification;
// Kullanıcıyı etiketle
const mentionUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { task_id, mentioned_user_id } = req.body;
        // Görevin kullanıcıya ait olup olmadığını kontrol et
        const [tasks] = yield db_1.default.query('SELECT * FROM task_cards WHERE id = ? AND user_id = ?', [task_id, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
        }
        // Etiketlenen kullanıcının var olup olmadığını kontrol et
        const [users] = yield db_1.default.query('SELECT * FROM users WHERE id = ?', [mentioned_user_id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        // Kullanıcı etiketleme kaydı oluştur
        const [result] = yield db_1.default.query('INSERT INTO user_mentions (task_id, mentioned_user_id, mentioning_user_id) VALUES (?, ?, ?)', [task_id, mentioned_user_id, userId]);
        res.status(201).json({
            message: 'Kullanıcı başarıyla etiketlendi.',
            mention_id: result.insertId
        });
    }
    catch (error) {
        console.error('Kullanıcı etiketleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.mentionUser = mentionUser;
// Görevdeki etiketlenen kullanıcıları getir
const getTaskMentions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const taskId = req.params.taskId;
        // Görevin kullanıcıya ait olup olmadığını kontrol et
        const [tasks] = yield db_1.default.query('SELECT * FROM task_cards WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
        }
        // Görevdeki etiketlenen kullanıcıları getir
        const [mentions] = yield db_1.default.query(`SELECT um.id, um.created_at, u.id as user_id, u.username, u.full_name, u.avatar
       FROM user_mentions um
       JOIN users u ON um.mentioned_user_id = u.id
       WHERE um.task_id = ?
       ORDER BY um.created_at DESC`, [taskId]);
        res.status(200).json({ mentions });
    }
    catch (error) {
        console.error('Görev etiketlerini getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.getTaskMentions = getTaskMentions;
