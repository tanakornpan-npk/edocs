import { Request, Response } from 'express';
import { db } from '../database/db.js';

export class AnnouncementController {
  static async getAnnouncements(req: Request, res: Response): Promise<void> {
    const { category } = req.query;
    try {
      let query = `SELECT * FROM announcements WHERE is_active = true`;
      const params: any[] = [];

      if (category && category !== 'all') {
        query += ` AND category = $1`;
        params.push(category);
      }

      query += ` ORDER BY is_pinned DESC, publish_date DESC, created_at DESC`;

      const result = await db.query(query, params);
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getAnnouncementDetail(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await db.query(
        `UPDATE announcements 
         SET view_count = view_count + 1 
         WHERE id = $1 AND is_active = true 
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบประกาศที่ระบุ' });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async saveAnnouncement(req: Request, res: Response): Promise<void> {
    const { id, title, category, summary, content, badge_text, image_url, external_link, is_pinned, is_active } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'กรุณากรอกหัวข้อและเนื้อหาประกาศ' });
      return;
    }

    try {
      if (id) {
        const updateRes = await db.query(
          `UPDATE announcements
           SET title = $1, category = $2, summary = $3, content = $4, badge_text = $5,
               image_url = $6, external_link = $7, is_pinned = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
           WHERE id = $10 RETURNING *`,
          [title, category || 'general', summary || '', content, badge_text || '', image_url || '', external_link || '', !!is_pinned, is_active !== false, id]
        );
        res.json({ success: true, message: 'แก้ไขประกาศเรียบร้อย', data: updateRes.rows[0] });
      } else {
        const insertRes = await db.query(
          `INSERT INTO announcements (title, category, summary, content, badge_text, image_url, external_link, is_pinned, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [title, category || 'general', summary || '', content, badge_text || '', image_url || '', external_link || '', !!is_pinned, is_active !== false]
        );
        res.json({ success: true, message: 'สร้างประกาศใหม่เรียบร้อย', data: insertRes.rows[0] });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await db.query(`UPDATE announcements SET is_active = false WHERE id = $1`, [id]);
      res.json({ success: true, message: 'ลบประกาศเรียบร้อย' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
