import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Görev kartlarını getir
export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [tasks] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, s.name as status_name, s.color as status_color 
       FROM task_cards t 
       JOIN task_statuses s ON t.status_id = s.id 
       WHERE t.user_id = ? AND t.parent_id IS NULL
       ORDER BY t.position ASC`,
      [userId]
    );
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Görev kartları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev kartı oluştur
export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, due_date, priority, status_id, parent_id } = req.body;
    
    // Dosya varsa işle
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path;
    }
    
    // Pozisyon hesapla
    const [maxPosition] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(position) as max_pos FROM task_cards WHERE user_id = ? AND parent_id IS NULL',
      [userId]
    );
    
    const position = maxPosition[0].max_pos ? maxPosition[0].max_pos + 1 : 0;
    
    // Görev kartını ekle
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO task_cards 
       (title, description, due_date, priority, image, status_id, user_id, parent_id, position) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, due_date, priority, imagePath, status_id, userId, parent_id, position]
    );
    
    const [newTask] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, s.name as status_name, s.color as status_color 
       FROM task_cards t 
       JOIN task_statuses s ON t.status_id = s.id 
       WHERE t.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Görev kartı başarıyla oluşturuldu.',
      task: newTask[0]
    });
  } catch (error) {
    console.error('Görev kartı oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev kartı güncelle
export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.id;
    const { title, description, due_date, priority, status_id } = req.body;
    
    // Görev kartının kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    // Dosya varsa işle
    let imagePath = tasks[0].image;
    if (req.file) {
      imagePath = req.file.path;
    }
    
    // Görev kartını güncelle
    await pool.query(
      `UPDATE task_cards 
       SET title = ?, description = ?, due_date = ?, priority = ?, image = ?, status_id = ? 
       WHERE id = ? AND user_id = ?`,
      [title, description, due_date, priority, imagePath, status_id, taskId, userId]
    );
    
    const [updatedTask] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, s.name as status_name, s.color as status_color 
       FROM task_cards t 
       JOIN task_statuses s ON t.status_id = s.id 
       WHERE t.id = ?`,
      [taskId]
    );
    
    res.status(200).json({
      message: 'Görev kartı başarıyla güncellendi.',
      task: updatedTask[0]
    });
  } catch (error) {
    console.error('Görev kartı güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev kartı sil
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.id;
    
    // Görev kartının kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    // Görev kartını sil
    await pool.query(
      'DELETE FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    res.status(200).json({
      message: 'Görev kartı başarıyla silindi.'
    });
  } catch (error) {
    console.error('Görev kartı silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev kartlarının pozisyonunu güncelle (sürükle-bırak için)
export const updateTaskPositions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { tasks } = req.body;
    
    // Veritabanı işlemini bir transaction içinde yap
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const task of tasks) {
        await connection.query(
          'UPDATE task_cards SET position = ?, status_id = ? WHERE id = ? AND user_id = ?',
          [task.position, task.status_id, task.id, userId]
        );
      }
      
      await connection.commit();
      
      res.status(200).json({
        message: 'Görev kartları pozisyonları başarıyla güncellendi.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Görev kartları pozisyon güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
