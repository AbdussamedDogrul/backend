import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Etiketleri getir
export const getTags = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [tags] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC',
      [userId]
    );
    
    res.status(200).json({ tags });
  } catch (error) {
    console.error('Etiketleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Etiket oluştur
export const createTag = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, color } = req.body;
    
    // Aynı isimde etiket var mı kontrol et
    const [existingTags] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE name = ? AND user_id = ?',
      [name, userId]
    );
    
    if (existingTags.length > 0) {
      return res.status(400).json({ message: 'Bu isimde bir etiket zaten mevcut.' });
    }
    
    // Etiketi ekle
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO tags (name, color, user_id) VALUES (?, ?, ?)',
      [name, color, userId]
    );
    
    const [newTag] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Etiket başarıyla oluşturuldu.',
      tag: newTag[0]
    });
  } catch (error) {
    console.error('Etiket oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Etiket güncelle
export const updateTag = async (req: Request, res: Response) => {
  try {
    const tagId = req.params.id;
    const userId = req.user?.id;
    const { name, color } = req.body;
    
    // Etiketin kullanıcıya ait olup olmadığını kontrol et
    const [tags] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?',
      [tagId, userId]
    );
    
    if (tags.length === 0) {
      return res.status(404).json({ message: 'Etiket bulunamadı.' });
    }
    
    // Aynı isimde başka etiket var mı kontrol et
    const [existingTags] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE name = ? AND user_id = ? AND id != ?',
      [name, userId, tagId]
    );
    
    if (existingTags.length > 0) {
      return res.status(400).json({ message: 'Bu isimde bir etiket zaten mevcut.' });
    }
    
    // Etiketi güncelle
    await pool.query(
      'UPDATE tags SET name = ?, color = ? WHERE id = ? AND user_id = ?',
      [name, color, tagId, userId]
    );
    
    const [updatedTag] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE id = ?',
      [tagId]
    );
    
    res.status(200).json({
      message: 'Etiket başarıyla güncellendi.',
      tag: updatedTag[0]
    });
  } catch (error) {
    console.error('Etiket güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Etiket sil
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const tagId = req.params.id;
    const userId = req.user?.id;
    
    // Etiketin kullanıcıya ait olup olmadığını kontrol et
    const [tags] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?',
      [tagId, userId]
    );
    
    if (tags.length === 0) {
      return res.status(404).json({ message: 'Etiket bulunamadı.' });
    }
    
    // Etiketi sil
    await pool.query(
      'DELETE FROM tags WHERE id = ? AND user_id = ?',
      [tagId, userId]
    );
    
    res.status(200).json({
      message: 'Etiket başarıyla silindi.'
    });
  } catch (error) {
    console.error('Etiket silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Göreve etiket ekle
export const addTagToTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { task_id, tag_id } = req.body;
    
    // Görev ve etiketin kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [task_id, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    const [tags] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?',
      [tag_id, userId]
    );
    
    if (tags.length === 0) {
      return res.status(404).json({ message: 'Etiket bulunamadı.' });
    }
    
    // İlişki zaten var mı kontrol et
    const [existingRelations] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_tags WHERE task_id = ? AND tag_id = ?',
      [task_id, tag_id]
    );
    
    if (existingRelations.length > 0) {
      return res.status(400).json({ message: 'Bu etiket zaten göreve eklenmiş.' });
    }
    
    // İlişkiyi ekle
    await pool.query(
      'INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)',
      [task_id, tag_id]
    );
    
    res.status(201).json({
      message: 'Etiket göreve başarıyla eklendi.'
    });
  } catch (error) {
    console.error('Göreve etiket ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görevden etiket kaldır
export const removeTagFromTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.taskId;
    const tagId = req.params.tagId;
    
    // Görev ve etiketin kullanıcıya ait olup olmadığını kontrol et
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM task_cards WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev kartı bulunamadı.' });
    }
    
    // İlişkiyi kaldır
    await pool.query(
      'DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?',
      [taskId, tagId]
    );
    
    res.status(200).json({
      message: 'Etiket görevden başarıyla kaldırıldı.'
    });
  } catch (error) {
    console.error('Görevden etiket kaldırma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Görevin etiketlerini getir
export const getTaskTags = async (req: Request, res: Response) => {
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
    
    // Görevin etiketlerini getir
    const [tags] = await pool.query<RowDataPacket[]>(
      `SELECT t.* FROM tags t
       JOIN task_tags tt ON t.id = tt.tag_id
       WHERE tt.task_id = ? AND t.user_id = ?
       ORDER BY t.name ASC`,
      [taskId, userId]
    );
    
    res.status(200).json({ tags });
  } catch (error) {
    console.error('Görev etiketlerini getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
