import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { ThaiQrBillPaymentService } from '../services/thaiQrBillPayment.service.js';
import { KuCentralQrService } from '../services/kuCentralQr.service.js';
import { migrateThaiQr } from '../database/migrate_thai_qr.js';

export class ThaiQrConfigController {
  // =========================================================================
  // 1. BILLER CONFIGS
  // =========================================================================

  static async getBillerConfigs(_req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query(
        'SELECT * FROM biller_configs ORDER BY is_active DESC, created_at DESC'
      );
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูล Biller ID: ' + err.message });
    }
  }

  static async saveBillerConfig(req: Request, res: Response): Promise<void> {
    const {
      id,
      biller_id,
      merchant_name,
      service_name_th,
      is_active = true,
      use_central_service = false,
      soap_url,
      biller_suffix,
      app_code,
      callback_url,
    } = req.body;

    if (!biller_id || !merchant_name) {
      res.status(400).json({ success: false, message: 'กรุณาระบุ Biller ID และชื่อบัญชีผู้รับชำระ' });
      return;
    }

    try {
      if (is_active) {
        // If this one is active, deactivate others
        await db.query('UPDATE biller_configs SET is_active = false');
      }

      let savedRecord;
      if (id) {
        const updateRes = await db.query(
          `UPDATE biller_configs
           SET biller_id = $1,
               merchant_name = $2,
               service_name_th = $3,
               is_active = $4,
               use_central_service = $5,
               soap_url = $6,
               biller_suffix = $7,
               app_code = $8,
               callback_url = $9,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $10 RETURNING *`,
          [
            biller_id.trim(),
            merchant_name.trim(),
            (service_name_th || '').trim(),
            is_active,
            !!use_central_service,
            (soap_url || 'https://fin.ku.th/qr/service').trim(),
            (biller_suffix || '01').trim(),
            (app_code || '06').trim(),
            (callback_url || 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback').trim(),
            id,
          ]
        );
        savedRecord = updateRes.rows[0];
      } else {
        const insertRes = await db.query(
          `INSERT INTO biller_configs (
             biller_id, merchant_name, service_name_th, is_active,
             use_central_service, soap_url, biller_suffix, app_code, callback_url
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (biller_id) DO UPDATE SET
             merchant_name = EXCLUDED.merchant_name,
             service_name_th = EXCLUDED.service_name_th,
             is_active = EXCLUDED.is_active,
             use_central_service = EXCLUDED.use_central_service,
             soap_url = EXCLUDED.soap_url,
             biller_suffix = EXCLUDED.biller_suffix,
             app_code = EXCLUDED.app_code,
             callback_url = EXCLUDED.callback_url,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            biller_id.trim(),
            merchant_name.trim(),
            (service_name_th || '').trim(),
            is_active,
            !!use_central_service,
            (soap_url || 'https://fin.ku.th/qr/service').trim(),
            (biller_suffix || '01').trim(),
            (app_code || '06').trim(),
            (callback_url || 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback').trim(),
          ]
        );
        savedRecord = insertRes.rows[0];
      }

      res.json({
        success: true,
        message: 'บันทึกข้อมูล Biller ID สำเร็จ',
        data: savedRecord,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึก Biller ID: ' + err.message });
    }
  }

  // =========================================================================
  // 2. PAYMENT TYPES (map_App code)
  // =========================================================================

  static async getPaymentTypes(_req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query('SELECT * FROM payment_types ORDER BY code ASC');
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลประเภทการชำระเงิน: ' + err.message });
    }
  }

  static async savePaymentType(req: Request, res: Response): Promise<void> {
    const { id, code, name, description } = req.body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'กรุณาระบุรหัสประเภทและชื่อประเภทการชำระเงิน' });
      return;
    }

    try {
      let saved;
      if (id) {
        const updateRes = await db.query(
          `UPDATE payment_types
           SET code = $1, name = $2, description = $3
           WHERE id = $4 RETURNING *`,
          [code.trim(), name.trim(), (description || '').trim(), id]
        );
        saved = updateRes.rows[0];
      } else {
        const insertRes = await db.query(
          `INSERT INTO payment_types (code, name, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (code) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description
           RETURNING *`,
          [code.trim(), name.trim(), (description || '').trim()]
        );
        saved = insertRes.rows[0];
      }

      res.json({ success: true, message: 'บันทึกประเภทการชำระเงินสำเร็จ', data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกประเภทการชำระเงิน: ' + err.message });
    }
  }

  static async deletePaymentType(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM payment_types WHERE id = $1', [id]);
      res.json({ success: true, message: 'ลบประเภทการชำระเงินสำเร็จ' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถลบประเภทการชำระเงิน: ' + err.message });
    }
  }

  // =========================================================================
  // 3. PAYMENT CATEGORIES (หมวด/กลุ่ม)
  // =========================================================================

  static async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query('SELECT * FROM payment_categories ORDER BY created_at ASC');
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลหมวดหมู่: ' + err.message });
    }
  }

  static async saveCategory(req: Request, res: Response): Promise<void> {
    const { id, code, name } = req.body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'กรุณาระบุรหัสหมวดและชื่อหมวด' });
      return;
    }

    try {
      let saved;
      if (id) {
        const resUp = await db.query(
          'UPDATE payment_categories SET code = $1, name = $2 WHERE id = $3 RETURNING *',
          [code.trim(), name.trim(), id]
        );
        saved = resUp.rows[0];
      } else {
        const resIns = await db.query(
          `INSERT INTO payment_categories (code, name) VALUES ($1, $2)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
           RETURNING *`,
          [code.trim(), name.trim()]
        );
        saved = resIns.rows[0];
      }
      res.json({ success: true, message: 'บันทึกหมวด/กลุ่มสำเร็จ', data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกหมวด/กลุ่ม: ' + err.message });
    }
  }

  static async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM payment_categories WHERE id = $1', [id]);
      res.json({ success: true, message: 'ลบหมวด/กลุ่มสำเร็จ' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถลบหมวด/กลุ่ม: ' + err.message });
    }
  }

  // =========================================================================
  // 4. CREDIT LIMITS (วงเงิน)
  // =========================================================================

  static async getCreditLimits(_req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query('SELECT * FROM credit_limits ORDER BY code ASC');
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลวงเงิน: ' + err.message });
    }
  }

  static async saveCreditLimit(req: Request, res: Response): Promise<void> {
    const { id, code, name } = req.body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'กรุณาระบุรหัสวงเงินและชื่อวงเงิน' });
      return;
    }

    try {
      let saved;
      if (id) {
        const resUp = await db.query(
          'UPDATE credit_limits SET code = $1, name = $2 WHERE id = $3 RETURNING *',
          [code.trim(), name.trim(), id]
        );
        saved = resUp.rows[0];
      } else {
        const resIns = await db.query(
          `INSERT INTO credit_limits (code, name) VALUES ($1, $2)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
           RETURNING *`,
          [code.trim(), name.trim()]
        );
        saved = resIns.rows[0];
      }
      res.json({ success: true, message: 'บันทึกวงเงินสำเร็จ', data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกวงเงิน: ' + err.message });
    }
  }

  static async deleteCreditLimit(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM credit_limits WHERE id = $1', [id]);
      res.json({ success: true, message: 'ลบวงเงินสำเร็จ' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถลบวงเงิน: ' + err.message });
    }
  }

  // =========================================================================
  // 5. REF2 MASTER & MAPPING TABLE
  // =========================================================================

  static async getRef2Configs(_req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          r.id,
          r.ref2_code,
          r.name,
          r.category_id,
          c.name AS category_name,
          c.code AS category_code,
          r.credit_limit_id,
          l.code AS credit_limit_code,
          l.name AS credit_limit_name,
          r.payment_type_id,
          t.code AS payment_type_code,
          t.name AS payment_type_name,
          r.is_active,
          r.created_at,
          r.updated_at
        FROM ref2_configs r
        LEFT JOIN payment_categories c ON r.category_id = c.id
        LEFT JOIN credit_limits l ON r.credit_limit_id = l.id
        LEFT JOIN payment_types t ON r.payment_type_id = t.id
        ORDER BY r.ref2_code ASC
      `;
      const result = await db.query(query);
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถดึงรายการ REF2: ' + err.message });
    }
  }

  static async saveRef2Config(req: Request, res: Response): Promise<void> {
    const { id, ref2_code, name, category_id, credit_limit_id, payment_type_id, is_active = true } = req.body;

    if (!ref2_code || !name) {
      res.status(400).json({ success: false, message: 'กรุณาระบุรหัส REF2 และชื่อ/ความหมาย' });
      return;
    }

    try {
      let saved;
      if (id) {
        const updateRes = await db.query(
          `UPDATE ref2_configs
           SET ref2_code = $1, name = $2, category_id = $3, credit_limit_id = $4,
               payment_type_id = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
           WHERE id = $7 RETURNING *`,
          [
            ref2_code.trim(),
            name.trim(),
            category_id || null,
            credit_limit_id || null,
            payment_type_id || null,
            is_active,
            id,
          ]
        );
        saved = updateRes.rows[0];
      } else {
        const insertRes = await db.query(
          `INSERT INTO ref2_configs (ref2_code, name, category_id, credit_limit_id, payment_type_id, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (ref2_code) DO UPDATE SET
             name = EXCLUDED.name,
             category_id = EXCLUDED.category_id,
             credit_limit_id = EXCLUDED.credit_limit_id,
             payment_type_id = EXCLUDED.payment_type_id,
             is_active = EXCLUDED.is_active,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            ref2_code.trim(),
            name.trim(),
            category_id || null,
            credit_limit_id || null,
            payment_type_id || null,
            is_active,
          ]
        );
        saved = insertRes.rows[0];
      }

      res.json({ success: true, message: 'บันทึกรหัส REF2 สำเร็จ', data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกรหัส REF2: ' + err.message });
    }
  }

  static async deleteRef2Config(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM ref2_configs WHERE id = $1', [id]);
      res.json({ success: true, message: 'ลบรหัส REF2 สำเร็จ' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถลบรหัส REF2: ' + err.message });
    }
  }

  static async seedDefaults(_req: Request, res: Response): Promise<void> {
    try {
      await migrateThaiQr();
      res.json({ success: true, message: 'นำเข้าข้อมูลเริ่มต้น 36 รายการเรียบร้อยแล้ว' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถนำเข้าข้อมูลเริ่มต้น: ' + err.message });
    }
  }

  // =========================================================================
  // 6. TEST GENERATE QR
  // =========================================================================

  static async testGenerateQr(req: Request, res: Response): Promise<void> {
    const { amount = 50, ref1 = '6540201234', ref2 = '300', biller_id } = req.body;
    try {
      const qrResult = await ThaiQrBillPaymentService.generateBillPaymentQr({
        amount: Number(amount),
        ref1: String(ref1),
        ref2: String(ref2),
        billerId: biller_id || undefined,
      });

      res.json({ success: true, data: qrResult });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'ไม่สามารถสร้าง QR ทดสอบ: ' + err.message });
    }
  }

  // =========================================================================
  // 7. TEST KU CENTRAL SOAP WEB SERVICE
  // =========================================================================

  static async testKuCentralSoap(req: Request, res: Response): Promise<void> {
    const {
      soap_url,
      app_code,
      biller_suffix,
      callback_url,
      amount = 1.0,
      student_id = '6540201234',
      ref2_code = '300',
    } = req.body;

    try {
      const result = await KuCentralQrService.requestOeaQr({
        amount: Number(amount) || 1.0,
        transactionId: `TEST-${Date.now().toString().slice(-6)}`,
        studentId: student_id,
        ref2Code: ref2_code,
        appCode: app_code,
        billerSuffix: biller_suffix,
        soapUrl: soap_url,
        callbackUrl: callback_url,
        timeoutMs: 8000,
      });

      res.json({
        success: result.success,
        data: result,
        message: result.success
          ? 'เชื่อมต่อและสร้าง QR Code จากระบบกลาง มก. สำเร็จ'
          : `การเชื่อมต่อระบบกลางไม่สำเร็จ: ${result.error}`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการทดสอบ: ' + err.message });
    }
  }
}
