import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Görev durumlarını getir
export const getTaskStatuses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [statuses] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE is_default = TRUE OR user_id = ? ORDER BY is_default DESC, name ASC',
      [userId]
    );
    
    res.status(200).json({ statuses });
  } catch (error) {
    console.error('Görev durumlarını getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev durumu oluştur
export const createTaskStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, color } = req.body;
    
    // Aynı isimde durum var mı kontrol et
    const [existingStatuses] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE name = ? AND (is_default = TRUE OR user_id = ?)',
      [name, userId]
    );
    
    if (existingStatuses.length > 0) {
      return res.status(400).json({ message: 'Bu isimde bir durum zaten mevcut.' });
    }
    
    // Durumu ekle
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO task_statuses (name, color, user_id, is_default) VALUES (?, ?, ?, FALSE)',
      [name, color, userId]
    );
    
    const [newStatus] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Görev durumu başarıyla oluşturuldu.',
      status: newStatus[0]
    });
  } catch (error) {
    console.error('Görev durumu oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev durumu güncelle
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const statusId = req.params.id;
    const userId = req.user?.id;
    const { name, color } = req.body;
    
    // Durumun kullanıcıya ait olup olmadığını kontrol et
    const [statuses] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE id = ? AND user_id = ? AND is_default = FALSE',
      [statusId, userId]
    );
    
    if (statuses.length === 0) {
      return res.status(404).json({ message: 'Görev durumu bulunamadı veya varsayılan durum olduğu için düzenlenemez.' });
    }
    
    // Aynı isimde başka durum var mı kontrol et
    const [existingStatuses] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE name = ? AND id != ? AND (is_default = TRUE OR user_id = ?)',
      [name, statusId, userId]
    );
    
    if (existingStatuses.length > 0) {
      return res.status(400).json({ message: 'Bu isimde bir durum zaten mevcut.' });
    }
    
    // Durumu güncelle
    await pool.query(
      'UPDATE task_statuses SET name = ?, color = ? WHERE id = ? AND user_id = ? AND is_default = FALSE',
      [name, color, statusId, userId]
    );
    
    const [updatedStatus] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE id = ?',
      [statusId]
    );
    
    res.status(200).json({
      message: 'Görev durumu başarıyla güncellendi.',
      status: updatedStatus[0]
    });
  } catch (error) {
    console.error('Görev durumu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görev durumu sil
export const deleteTaskStatus = async (req: Request, res: Response) => {
  try {
    const statusId = req.params.id;
    const userId = req.user?.id;
    
    // Durumun kullanıcıya ait olup olmadığını kontrol et
    const [statuses] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_statuses WHERE id = ? AND user_id = ? AND is_default = FALSE',
      [statusId, userId]
    );
    
    if (statuses.length === 0) {
      return res.status(404).json({ message: 'Görev durumu bulunamadı veya varsayılan durum olduğu için silinemez.' });
    }
    
    // Bu durumda görev var mı kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as task_count FROM task_cards WHERE status_id = ?',
      [statusId]
    );
    
    if (tasks[0].task_count > 0) {
      return res.status(400).json({ message: 'Bu durumda görevler bulunduğu için silinemez. Önce görevleri başka bir duruma taşıyın.' });
    }
    
    // Durumu sil
    await pool.query(
      'DELETE FROM task_statuses WHERE id = ? AND user_id = ? AND is_default = FALSE',
      [statusId, userId]
    );
    
    res.status(200).json({
      message: 'Görev durumu başarıyla silindi.'
    });
  } catch (error) {
    console.error('Görev durumu silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
