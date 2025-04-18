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
exports.updateTaskPositions = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const db_1 = __importDefault(require("../config/db"));
// Görev kartlarını getir
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const [tasks] = yield db_1.default.query(`SELECT t.*, s.name as status_name, s.color as status_color 
       FROM task_cards t 
       JOIN task_statuses s ON t.status_id = s.id 
       WHERE t.user_id = ? AND t.parent_id IS NULL
       ORDER BY t.position ASC`, [userId]);
        res.status(200).json({ tasks });
    }
    catch (error) {
        console.error('Görev kartları getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.getTasks = getTasks;
// Görev kartı oluştur
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { title, description, due_date, priority, status_id, parent_id } = req.body;
        // Dosya varsa işle
        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path;
        }
        // Pozisyon hesapla
        const [maxPosition] = yield db_1.default.query('SELECT MAX(position) as max_pos FROM task_cards WHERE user_id = ? AND parent_id IS NULL', [userId]);
        const position = maxPosition[0].max_pos ? maxPosition[0].max_pos + 1 : 0;
        // Görev kartını ekle
        const [result] = yield db_1.default.query(`INSERT INTO task_cards 
       (title, description, due_date, priority, image, status_id, user_id, parent_id, position) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, description, due_date, priority, imagePath, status_id, userId, parent_id, position]);
        const [newTask] = yield db_1.default.query(`SELECT t.*, s.name as status_name, s.color as status_color 
       FROM task_cards t 
       JOIN task_statuses s ON t.status_id = s.id 
       WHERE t.id = ?`, [result.insertId]);
        res.status(201).json({
            message: 'Görev kartı başarıyla oluşturuldu.',
            task: newTask[0]
        });
    }
    catch (error) {
        console.error('Görev kartı oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.createTask = createTask;
// Görev kartı güncelle
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const taskId = req.params.id;
        const { title, description, due_date, priority, status_id } = req.body;
        // Görev kartının kullanıcıya ait olup olmadığını kontrol et
        const [tasks] = yield db_1.default.query('SELECT * FROM task_cards WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
        }
        // Dosya varsa işle
        let imagePath = tasks[0].image;
        if (req.file) {
            imagePath = req.file.path;
        }
        // Görev kartını güncelle
        yield db_1.default.query(`UPDATE task_cards 
       SET title = ?, description = ?, due_date = ?, priority = ?, image = ?, status_id = ? 
       WHERE id = ? AND user_id = ?`, [title, description, due_date, priority, imagePath, status_id, taskId, userId]);
        const [updatedTask] = yield db_1.default.query(`SELECT t.*, s.name as status_name, s.color as status_color 
       FROM task_cards t 
       JOIN task_statuses s ON t.status_id = s.id 
       WHERE t.id = ?`, [taskId]);
        res.status(200).json({
            message: 'Görev kartı başarıyla güncellendi.',
            task: updatedTask[0]
        });
    }
    catch (error) {
        console.error('Görev kartı güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.updateTask = updateTask;
// Görev kartı sil
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const taskId = req.params.id;
        // Görev kartının kullanıcıya ait olup olmadığını kontrol et
        const [tasks] = yield db_1.default.query('SELECT * FROM task_cards WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
        }
        // Görev kartını sil
        yield db_1.default.query('DELETE FROM task_cards WHERE id = ? AND user_id = ?', [taskId, userId]);
        res.status(200).json({
            message: 'Görev kartı başarıyla silindi.'
        });
    }
    catch (error) {
        console.error('Görev kartı silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.deleteTask = deleteTask;
// Görev kartlarının pozisyonunu güncelle (sürükle-bırak için)
const updateTaskPositions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { tasks } = req.body;
        // Veritabanı işlemini bir transaction içinde yap
        const connection = yield db_1.default.getConnection();
        yield connection.beginTransaction();
        try {
            for (const task of tasks) {
                yield connection.query('UPDATE task_cards SET position = ?, status_id = ? WHERE id = ? AND user_id = ?', [task.position, task.status_id, task.id, userId]);
            }
            yield connection.commit();
            res.status(200).json({
                message: 'Görev kartları pozisyonları başarıyla güncellendi.'
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
        console.error('Görev kartları pozisyon güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});
exports.updateTaskPositions = updateTaskPositions;
