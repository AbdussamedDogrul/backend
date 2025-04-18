import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Bildirimleri getir
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [notifications] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Bildirimleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Bildirimi okundu olarak işaretle
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;
    
    // Bildirimin kullanıcıya ait olup olmadığını kontrol et
    const [notifications] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Bildirim bulunamadı.' });
    }
    
    // Bildirimi okundu olarak işaretle
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    res.status(200).json({
      message: 'Bildirim okundu olarak işaretlendi.'
    });
  } catch (error) {
    console.error('Bildirim işaretleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tüm bildirimleri okundu olarak işaretle
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Tüm bildirimleri okundu olarak işaretle
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId]
    );
    
    res.status(200).json({
      message: 'Tüm bildirimler okundu olarak işaretlendi.'
    });
  } catch (error) {
    console.error('Tüm bildirimleri işaretleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Bildirimi sil
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;
    
    // Bildirimin kullanıcıya ait olup olmadığını kontrol et
    const [notifications] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Bildirim bulunamadı.' });
    }
    
    // Bildirimi sil
    await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    res.status(200).json({
      message: 'Bildirim başarıyla silindi.'
    });
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kullanıcıyı etiketle
export const mentionUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { task_id, mentioned_user_id } = req.body;
    
    // Görevin kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [task_id, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    // Etiketlenen kullanıcının var olup olmadığını kontrol et
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [mentioned_user_id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    
    // Kullanıcı etiketleme kaydı oluştur
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO user_mentions (task_id, mentioned_user_id, mentioning_user_id) VALUES (?, ?, ?)',
      [task_id, mentioned_user_id, userId]
    );
    
    res.status(201).json({
      message: 'Kullanıcı başarıyla etiketlendi.',
      mention_id: result.insertId
    });
  } catch (error) {
    console.error('Kullanıcı etiketleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görevdeki etiketlenen kullanıcıları getir
export const getTaskMentions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.taskId;
    
    // Görevin kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    // Görevdeki etiketlenen kullanıcıları getir
    const [mentions] = await pool.query<RowDataPacket[]>(
      `SELECT um.id, um.created_at, u.id as user_id, u.username, u.full_name, u.avatar
       FROM user_mentions um
       JOIN users u ON um.mentioned_user_id = u.id
       WHERE um.task_id = ?
       ORDER BY um.created_at DESC`,
      [taskId]
    );
    
    res.status(200).json({ mentions });
  } catch (error) {
    console.error('Görev etiketlerini getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
