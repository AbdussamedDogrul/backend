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
exports.updateSubtaskPositions = exports.deleteSubtask = exports.updateSubtask = exports.createSubtask = exports.getSubtasks = void 0;
const db_1 = __importDefault(require("../config/db"));
// Alt görevleri getir
const getSubtasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const taskId = req.params.taskId;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Görev kartının kullanıcıya ait olup olmadığını kontrol et
        const [tasks] = yield db_1.default.query('SELECT * FROM task_cards WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
        }
        const [subtasks] = yield db_1.default.query('SELECT * FROM subtasks WHERE task_card_id = ? ORDER BY position ASC', [taskId]);
        res.status(200).json({ subtasks });
    }
    catch (error) {
        console.error('Alt görevleri getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.getSubtasks = getSubtasks;
// Alt görev oluştur
const createSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const taskId = req.params.taskId;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { title } = req.body;
        // Görev kartının kullanıcıya ait olup olmadığını kontrol et
        const [tasks] = yield db_1.default.query('SELECT * FROM task_cards WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
        }
        // Pozisyon hesapla
        const [maxPosition] = yield db_1.default.query('SELECT MAX(position) as max_pos FROM subtasks WHERE task_card_id = ?', [taskId]);
        const position = maxPosition[0].max_pos ? maxPosition[0].max_pos + 1 : 0;
        // Alt görevi ekle
        const [result] = yield db_1.default.query('INSERT INTO subtasks (title, task_card_id, position) VALUES (?, ?, ?)', [title, taskId, position]);
        const [newSubtask] = yield db_1.default.query('SELECT * FROM subtasks WHERE id = ?', [result.insertId]);
        res.status(201).json({
            message: 'Alt görev başarıyla oluşturuldu.',
            subtask: newSubtask[0]
        });
    }
    catch (error) {
        console.error('Alt görev oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.createSubtask = createSubtask;
// Alt görev güncelle
const updateSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const subtaskId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { title, is_completed } = req.body;
        // Alt görevin kullanıcıya ait olup olmadığını kontrol et
        const [subtasks] = yield db_1.default.query(`SELECT s.* FROM subtasks s
       JOIN task_cards t ON s.task_card_id = t.id
       WHERE s.id = ? AND t.user_id = ?`, [subtaskId, userId]);
        if (subtasks.length === 0) {
            return res.status(404).json({ message: 'Alt görev bulunamadı.' });
        }
        // Alt görevi güncelle
        yield db_1.default.query('UPDATE subtasks SET title = ?, is_completed = ? WHERE id = ?', [title, is_completed, subtaskId]);
        const [updatedSubtask] = yield db_1.default.query('SELECT * FROM subtasks WHERE id = ?', [subtaskId]);
        res.status(200).json({
            message: 'Alt görev başarıyla güncellendi.',
            subtask: updatedSubtask[0]
        });
    }
    catch (error) {
        console.error('Alt görev güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.updateSubtask = updateSubtask;
// Alt görev sil
const deleteSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const subtaskId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Alt görevin kullanıcıya ait olup olmadığını kontrol et
        const [subtasks] = yield db_1.default.query(`SELECT s.* FROM subtasks s
       JOIN task_cards t ON s.task_card_id = t.id
       WHERE s.id = ? AND t.user_id = ?`, [subtaskId, userId]);
        if (subtasks.length === 0) {
            return res.status(404).json({ message: 'Alt görev bulunamadı.' });
        }
        // Alt görevi sil
        yield db_1.default.query('DELETE FROM subtasks WHERE id = ?', [subtaskId]);
        res.status(200).json({
            message: 'Alt görev başarıyla silindi.'
        });
    }
    catch (error) {
        console.error('Alt görev silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.deleteSubtask = deleteSubtask;
// Alt görevlerin pozisyonunu güncelle (sürükle-bırak için)
const updateSubtaskPositions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { subtasks } = req.body;
        // Veritabanı işlemini bir transaction içinde yap
        const connection = yield db_1.default.getConnection();
        yield connection.beginTransaction();
        try {
            for (const subtask of subtasks) {
                // Alt görevin kullanıcıya ait olup olmadığını kontrol et
                const [result] = yield connection.query(`SELECT s.* FROM subtasks s
           JOIN task_cards t ON s.task_card_id = t.id
           WHERE s.id = ? AND t.user_id = ?`, [subtask.id, userId]);
                if (result.length > 0) {
                    yield connection.query('UPDATE subtasks SET position = ? WHERE id = ?', [subtask.position, subtask.id]);
                }
            }
            yield connection.commit();
            res.status(200).json({
                message: 'Alt görevler pozisyonları başarıyla güncellendi.'
            });
        }
        catch (error) {
            yield connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Alt görevler pozisyon güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.updateSubtaskPositions = updateSubtaskPositions;
