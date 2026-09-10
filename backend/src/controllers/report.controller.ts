import { Request, Response } from 'express';
import { db } from '../database/db.js';

export class ReportController {
  /**
   * แดชบอร์ดสรุปภาพรวมสำหรับผู้บริหาร และผู้ดูแลระบบ (Executive & Admin Analytics)
   */
  static async getExecutiveDashboard(req: Request, res: Response): Promise<void> {
    try {
      // 1. KPI Cards
      const kpiRes = await db.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
          COUNT(*) FILTER (WHERE status IN ('processing', 'ready_for_pickup')) as in_progress_requests,
          COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_payment_requests,
          COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled' AND status != 'pending_payment'), 0) as total_revenue
        FROM document_requests
      `);

      // 2. แยกตามประเภทผู้ขอ (สถานะ S, D, G)
      const statusRes = await db.query(`
        SELECT 
          student_status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM document_requests
        WHERE status != 'cancelled'
        GROUP BY student_status
      `);

      // 3. แยกตามช่องทางการรับเอกสาร (Pickup, Postal, Digital)
      const deliveryRes = await db.query(`
        SELECT 
          delivery_method,
          COUNT(*) as count
        FROM document_requests
        WHERE status != 'cancelled'
        GROUP BY delivery_method
      `);

      // 4. เอกสารยอดนิยม (Top 5 Documents)
      const topDocsRes = await db.query(`
        SELECT 
          item_name,
          SUM(quantity) as total_qty,
          SUM(amount) as total_amount
        FROM request_items
        GROUP BY item_name
        ORDER BY total_qty DESC
        LIMIT 5
      `);

      // 5. แนวโน้มคำร้องรายวัน (Recent Trend)
      const trendRes = await db.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') as request_date,
          COUNT(*) as request_count,
          COALESCE(SUM(total_amount), 0) as daily_revenue
        FROM document_requests
        WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY request_date ASC
      `);

      res.json({
        success: true,
        data: {
          kpi: kpiRes.rows[0],
          status_breakdown: statusRes.rows,
          delivery_breakdown: deliveryRes.rows,
          top_documents: topDocsRes.rows,
          daily_trend: trendRes.rows,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * [Admin] จัดการเจ้าหน้าที่บริการเคาน์เตอร์
   */
  static async getStaffUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query(
        `SELECT id, username, email, role, first_name_th, last_name_th, phone_number, created_at
         FROM users
         WHERE role IN ('staff', 'admin')
         ORDER BY role ASC, created_at DESC`
      );
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * [Admin] เพิ่มหรือมอบหมายสิทธิ์เจ้าหน้าที่เคาน์เตอร์จากบัญชี KU All-login
   */
  static async addStaffUser(req: Request, res: Response): Promise<void> {
    const { username, first_name_th, last_name_th, phone_number, role = 'staff' } = req.body;

    if (!username) {
      res.status(400).json({ success: false, message: 'กรุณาระบุบัญชีผู้ใช้ KU All-login' });
      return;
    }

    try {
      const insertRes = await db.query(
        `INSERT INTO users (username, email, role, auth_provider, first_name_th, last_name_th, phone_number, is_verified)
         VALUES ($1, $2, $3, 'ku_alllogin', $4, $5, $6, true)
         ON CONFLICT (username) DO UPDATE 
         SET role = EXCLUDED.role, first_name_th = EXCLUDED.first_name_th, last_name_th = EXCLUDED.last_name_th
         RETURNING *`,
        [
          username.trim(),
          `${username.trim()}@ku.th`,
          role,
          first_name_th || 'เจ้าหน้าที่เคาน์เตอร์',
          last_name_th || '',
          phone_number || '',
        ]
      );

      res.json({
        success: true,
        message: `เพิ่ม/ปรับปรุงสิทธิ์เจ้าหน้าที่ '${username}' เรียบร้อย`,
        data: insertRes.rows[0],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * [Admin] ดูรายชื่อผู้ขอเอกสารทั้งหมด (Applicants Directory)
   */
  static async getApplicants(req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query(`
        SELECT 
          r.student_id,
          r.student_name,
          r.student_status,
          COALESCE(r.faculty_name, '-') as faculty_name,
          COALESCE(r.department_name, '-') as department_name,
          COUNT(r.id) as total_requests,
          COALESCE(SUM(r.total_amount), 0) as total_spent,
          MAX(r.created_at) as last_request_date,
          (SELECT status FROM document_requests sub WHERE sub.student_id = r.student_id ORDER BY sub.created_at DESC LIMIT 1) as latest_status,
          (SELECT order_no FROM document_requests sub WHERE sub.student_id = r.student_id ORDER BY sub.created_at DESC LIMIT 1) as latest_order_no
        FROM document_requests r
        WHERE r.student_id IS NOT NULL AND r.student_id != '' AND r.student_id != 'UNKNOWN'
        GROUP BY r.student_id, r.student_name, r.student_status, r.faculty_name, r.department_name
        ORDER BY last_request_date DESC
      `);
      res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}