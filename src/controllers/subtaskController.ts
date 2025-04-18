import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Alt görevleri getir
export const getSubtasks = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user?.id;
    
    // Görev kartının kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    const [subtasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM subtasks WHERE task_card_id = ? ORDER BY position ASC',
      [taskId]
    );
    
    res.status(200).json({ subtasks });
  } catch (error) {
    console.error('Alt görevleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Alt görev oluştur
export const createSubtask = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user?.id;
    const { title } = req.body;
    
    // Görev kartının kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    // Pozisyon hesapla
    const [maxPosition] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(position) as max_pos FROM subtasks WHERE task_card_id = ?',
      [taskId]
    );
    
    const position = maxPosition[0].max_pos ? maxPosition[0].max_pos + 1 : 0;
    
    // Alt görevi ekle
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO subtasks (title, task_card_id, position) VALUES (?, ?, ?)',
      [title, taskId, position]
    );
    
    const [newSubtask] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM subtasks WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Alt görev başarıyla oluşturuldu.',
      subtask: newSubtask[0]
    });
  } catch (error) {
    console.error('Alt görev oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Alt görev güncelle
export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const subtaskId = req.params.id;
    const userId = req.user?.id;
    const { title, is_completed } = req.body;
    
    // Alt görevin kullanıcıya ait olup olmadığını kontrol et
    const [subtasks] = await pool.query<RowDataPacket[]>(
      `SELECT s.* FROM subtasks s
       JOIN task_cards t ON s.task_card_id = t.id
       WHERE s.id = ? AND t.user_id = ?`,
      [subtaskId, userId]
    );
    
    if (subtasks.length === 0) {
      return res.status(404).json({ message: 'Alt görev bulunamadı.' });
    }
    
    // Alt görevi güncelle
    await pool.query(
      'UPDATE subtasks SET title = ?, is_completed = ? WHERE id = ?',
      [title, is_completed, subtaskId]
    );
    
    const [updatedSubtask] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM subtasks WHERE id = ?',
      [subtaskId]
    );
    
    res.status(200).json({
      message: 'Alt görev başarıyla güncellendi.',
      subtask: updatedSubtask[0]
    });
  } catch (error) {
    console.error('Alt görev güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Alt görev sil
export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const subtaskId = req.params.id;
    const userId = req.user?.id;
    
    // Alt görevin kullanıcıya ait olup olmadığını kontrol et
    const [subtasks] = await pool.query<RowDataPacket[]>(
      `SELECT s.* FROM subtasks s
       JOIN task_cards t ON s.task_card_id = t.id
       WHERE s.id = ? AND t.user_id = ?`,
      [subtaskId, userId]
    );
    
    if (subtasks.length === 0) {
      return res.status(404).json({ message: 'Alt görev bulunamadı.' });
    }
    
    // Alt görevi sil
    await pool.query(
      'DELETE FROM subtasks WHERE id = ?',
      [subtaskId]
    );
    
    res.status(200).json({
      message: 'Alt görev başarıyla silindi.'
    });
  } catch (error) {
    console.error('Alt görev silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Alt görevlerin pozisyonunu güncelle (sürükle-bırak için)
export const updateSubtaskPositions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { subtasks } = req.body;
    
    // Veritabanı işlemini bir transaction içinde yap
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const subtask of subtasks) {
        // Alt görevin kullanıcıya ait olup olmadığını kontrol et
        const [result] = await connection.query<RowDataPacket[]>(
          `SELECT s.* FROM subtasks s
           JOIN task_cards t ON s.task_card_id = t.id
           WHERE s.id = ? AND t.user_id = ?`,
          [subtask.id, userId]
        );
        
        if (result.length > 0) {
          await connection.query(
            'UPDATE subtasks SET position = ? WHERE id = ?',
            [subtask.position, subtask.id]
          );
        }
      }
      
      await connection.commit();
      
      res.status(200).json({
        message: 'Alt görevler pozisyonları başarıyla güncellendi.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Alt görevler pozisyon güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
