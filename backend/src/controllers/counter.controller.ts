import { Request, Response } from 'express';
import { db } from '../database/db.js';

export class CounterController {
  /**
   * ดูรายการคำร้องทั้งหมดสำหรับเจ้าหน้าที่เคาน์เตอร์ (พร้อมตัวกรอง)
   */
  static async getOrders(req: Request, res: Response): Promise<void> {
    const { status, student_id, search, limit = 50 } = req.query;

    try {
      let query = `
        SELECT r.*,
          COALESCE(json_agg(json_build_object(
            'item_name', ri.item_name,
            'unit_price', ri.unit_price,
            'quantity', ri.quantity,
            'amount', ri.amount
          )) FILTER (WHERE ri.id IS NOT NULL), '[]') as items
        FROM document_requests r
        LEFT JOIN request_items ri ON ri.request_id = r.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (status && status !== 'all') {
        query += ` AND r.status = $${pIdx++}`;
        params.push(status);
      }

      if (student_id) {
        query += ` AND r.student_id = $${pIdx++}`;
        params.push(student_id);
      }

      if (search) {
        query += ` AND (r.order_no ILIKE $${pIdx} OR r.student_name ILIKE $${pIdx} OR r.student_id ILIKE $${pIdx})`;
        params.push(`%${search}%`);
        pIdx++;
      }

      query += ` GROUP BY r.id ORDER BY r.created_at DESC LIMIT $${pIdx}`;
      params.push(parseInt(String(limit), 10));

      const result = await db.query(query, params);
      res.json({
        success: true,
        data: result.rows,
        count: result.rowCount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * อัปเดตสถานะคำร้อง (จัดทำเสร็จ / พร้อมรับ / ส่งไปรษณีย์ / รับแล้ว)
   */
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const { orderNo } = req.params;
    const { status, postal_tracking_no } = req.body;
    const staffId = req.user?.id;

    const allowedStatuses = ['pending_payment', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
      return;
    }

    try {
      const updateRes = await db.query(
        `UPDATE document_requests 
         SET status = $1, 
             postal_tracking_no = COALESCE($2, postal_tracking_no),
             counter_staff_id = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_no = $4
         RETURNING *`,
        [status, postal_tracking_no || null, staffId || null, orderNo]
      );

      if (updateRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบคำร้องที่ระบุ' });
        return;
      }

      const updated = updateRes.rows[0];

      // หากอัปเดตเป็นชำระแล้วหรือเข้าสู่ขั้นตอนจัดทำ ให้ปรับสถานะ payment เป็น completed ด้วย
      if (['paid', 'processing', 'ready_for_pickup', 'shipped', 'completed'].includes(status)) {
        await db.query(
          `UPDATE payments SET status = 'completed', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE request_id = $1 AND status = 'pending'`,
          [updated.id]
        );
      }

      // บันทึก Activity Log
      await db.query(
        `INSERT INTO activity_logs (request_id, action_by, action_name, description)
         VALUES ($1, $2, 'STATUS_CHANGE', $3)`,
        [updated.id, staffId || null, `เปลี่ยนสถานะเป็น '${status}' โดย ${req.user?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่เคาน์เตอร์'} ${req.user?.first_name_th || ''}`]
      );

      res.json({
        success: true,
        message: 'อัปเดตสถานะคำร้องเรียบร้อย',
        data: updated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * สรุปยอดปิดกะประจำวัน (Daily Counter Reconciliation)
   */
  static async getDailyReconciliation(req: Request, res: Response): Promise<void> {
    try {
      const statsRes = await db.query(`
        SELECT 
          COUNT(*) as total_orders_today,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_today,
          COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
          COUNT(*) FILTER (WHERE status = 'ready_for_pickup') as ready_pickup_count,
          COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled' AND status != 'pending_payment'), 0) as total_revenue_today
        FROM document_requests
        WHERE created_at >= CURRENT_DATE
      `);

      res.json({
        success: true,
        data: statsRes.rows[0],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}