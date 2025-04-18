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
exports.deleteTaskStatus = exports.updateTaskStatus = exports.createTaskStatus = exports.getTaskStatuses = void 0;
const db_1 = __importDefault(require("../config/db"));
// Görev durumlarını getir
const getTaskStatuses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const [statuses] = yield db_1.default.query('SELECT * FROM task_statuses WHERE is_default = TRUE OR user_id = ? ORDER BY is_default DESC, name ASC', [userId]);
        res.status(200).json({ statuses });
    }
    catch (error) {
        console.error('Görev durumlarını getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.getTaskStatuses = getTaskStatuses;
// Görev durumu oluştur
const createTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { name, color } = req.body;
        // Aynı isimde durum var mı kontrol et
        const [existingStatuses] = yield db_1.default.query('SELECT * FROM task_statuses WHERE name = ? AND (is_default = TRUE OR user_id = ?)', [name, userId]);
        if (existingStatuses.length > 0) {
            return res.status(400).json({ message: 'Bu isimde bir durum zaten mevcut.' });
        }
        // Durumu ekle
        const [result] = yield db_1.default.query('INSERT INTO task_statuses (name, color, user_id, is_default) VALUES (?, ?, ?, FALSE)', [name, color, userId]);
        const [newStatus] = yield db_1.default.query('SELECT * FROM task_statuses WHERE id = ?', [result.insertId]);
        res.status(201).json({
            message: 'Görev durumu başarıyla oluşturuldu.',
            status: newStatus[0]
        });
    }
    catch (error) {
        console.error('Görev durumu oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.createTaskStatus = createTaskStatus;
// Görev durumu güncelle
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const statusId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { name, color } = req.body;
        // Durumun kullanıcıya ait olup olmadığını kontrol et
        const [statuses] = yield db_1.default.query('SELECT * FROM task_statuses WHERE id = ? AND user_id = ? AND is_default = FALSE', [statusId, userId]);
        if (statuses.length === 0) {
            return res.status(404).json({ message: 'Görev durumu bulunamadı veya varsayılan durum olduğu için düzenlenemez.' });
        }
        // Aynı isimde başka durum var mı kontrol et
        const [existingStatuses] = yield db_1.default.query('SELECT * FROM task_statuses WHERE name = ? AND id != ? AND (is_default = TRUE OR user_id = ?)', [name, statusId, userId]);
        if (existingStatuses.length > 0) {
            return res.status(400).json({ message: 'Bu isimde bir durum zaten mevcut.' });
        }
        // Durumu güncelle
        yield db_1.default.query('UPDATE task_statuses SET name = ?, color = ? WHERE id = ? AND user_id = ? AND is_default = FALSE', [name, color, statusId, userId]);
        const [updatedStatus] = yield db_1.default.query('SELECT * FROM task_statuses WHERE id = ?', [statusId]);
        res.status(200).json({
            message: 'Görev durumu başarıyla güncellendi.',
            status: updatedStatus[0]
        });
    }
    catch (error) {
        console.error('Görev durumu güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.updateTaskStatus = updateTaskStatus;
// Görev durumu sil
const deleteTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const statusId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Durumun kullanıcıya ait olup olmadığını kontrol et
        const [statuses] = yield db_1.default.query('SELECT * FROM task_statuses WHERE id = ? AND user_id = ? AND is_default = FALSE', [statusId, userId]);
        if (statuses.length === 0) {
            return res.status(404).json({ message: 'Görev durumu bulunamadı veya varsayılan durum olduğu için silinemez.' });
        }
        // Bu durumda görev var mı kontrol et
        const [tasks] = yield db_1.default.query('SELECT COUNT(*) as task_count FROM task_cards WHERE status_id = ?', [statusId]);
        if (tasks[0].task_count > 0) {
            return res.status(400).json({ message: 'Bu durumda görevler bulunduğu için silinemez. Önce görevleri başka bir duruma taşıyın.' });
        }
        // Durumu sil
        yield db_1.default.query('DELETE FROM task_statuses WHERE id = ? AND user_id = ? AND is_default = FALSE', [statusId, userId]);
        res.status(200).json({
            message: 'Görev durumu başarıyla silindi.'
        });
    }
    catch (error) {
        console.error('Görev durumu silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.deleteTaskStatus = deleteTaskStatus;
