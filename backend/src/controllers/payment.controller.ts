import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { PromptPayService } from '../services/promptpay.service.js';

export class PaymentController {
  /**
   * ยืนยันการชำระเงิน (Webhook จากธนาคาร หรือการกดจำลองชำระเงินสำเร็จ)
   */
  static async confirmPayment(req: Request, res: Response): Promise<void> {
    const { order_no, transaction_ref } = req.body;

    if (!order_no) {
      res.status(400).json({ success: false, message: 'กรุณาระบุหมายเลขคำร้อง (order_no)' });
      return;
    }

    try {
      const reqRes = await db.query(`SELECT * FROM document_requests WHERE order_no = $1`, [order_no]);
      if (reqRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบคำร้องที่ระบุ' });
        return;
      }
      const requestRecord = reqRes.rows[0];

      if (['paid', 'processing', 'ready_for_pickup', 'shipped', 'completed'].includes(requestRecord.status)) {
        res.json({ success: true, message: 'คำร้องนี้ได้รับการชำระเงินเรียบร้อยแล้ว', status: requestRecord.status });
        return;
      }

      // สร้างเลขที่ใบเสร็จรับเงิน
      const yearStr = new Date().getFullYear() + 543; // ปี พ.ศ.
      const countRes = await db.query(`SELECT COUNT(*) FROM payments WHERE status = 'success'`);
      const seq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(5, '0');
      const receipt_no = `REC-${yearStr}-${seq}`;

      // อัปเดตรายการชำระเงิน
      await db.query(
        `UPDATE payments 
         SET status = 'success', paid_at = CURRENT_TIMESTAMP, transaction_ref = $1, receipt_no = $2
         WHERE request_id = $3`,
        [transaction_ref || `TXN-${Date.now()}`, receipt_no, requestRecord.id]
      );

      // อัปเดตสถานะคำร้องเป็น 'processing' (กำลังจัดทำเอกสาร)
      await db.query(
        `UPDATE document_requests SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [requestRecord.id]
      );

      // บันทึก Activity Log
      await db.query(
        `INSERT INTO activity_logs (request_id, action_name, description)
         VALUES ($1, 'PAYMENT_SUCCESS', $2)`,
        [requestRecord.id, `ชำระเงินสำเร็จจำนวน ${requestRecord.total_amount} บาท ออกใบเสร็จเลขที่ ${receipt_no}`]
      );

      res.json({
        success: true,
        message: 'ยืนยันการชำระเงินสำเร็จ ระบบกำลังดำเนินการจัดทำเอกสาร',
        order_no,
        receipt_no,
        status: 'processing',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการยืนยันชำระเงิน: ${err.message}` });
    }
  }

  /**
   * รองรับ Webhook Callback จากระบบสร้าง QR กลาง มก. / ธนาคาร (ตามคู่มือ ข้อ 10 หน้า 10)
   */
  static async handleKuQrCallback(req: Request, res: Response): Promise<void> {
    const {
      qrId,
      appCode,
      appId,
      transactionId,
      amount,
      bankConfirmedTime,
      bankNotification,
    } = req.body;

    console.log('[KU Central QR Webhook] Received payment callback:', JSON.stringify(req.body));

    if (!transactionId) {
      res.status(400).json({ success: false, message: 'Missing transactionId' });
      return;
    }

    try {
      // Find request by order_no (transactionId)
      const reqRes = await db.query(
        'SELECT * FROM document_requests WHERE order_no = $1',
        [transactionId]
      );

      if (reqRes.rows.length === 0) {
        console.warn(`[KU Central QR Webhook] Request not found for transactionId: ${transactionId}`);
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      const requestRecord = reqRes.rows[0];

      // If already processed, acknowledge receipt
      if (['paid', 'processing', 'ready_for_pickup', 'shipped', 'completed'].includes(requestRecord.status)) {
        res.json({ success: true, message: 'Order is already processed' });
        return;
      }

      // Generate receipt number
      const yearStr = new Date().getFullYear() + 543;
      const countRes = await db.query("SELECT COUNT(*) FROM payments WHERE status = 'success'");
      const seq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(5, '0');
      const receipt_no = `REC-${yearStr}-${seq}`;

      const bankTxnId = bankNotification?.transactionId || `KUQR-${qrId || Date.now()}`;
      const payerName = bankNotification?.payerAccountName || bankNotification?.payerName || 'นิสิต/ผู้ชำระเงิน';

      // Update payment record
      await db.query(
        `UPDATE payments
         SET status = 'success',
             paid_at = CURRENT_TIMESTAMP,
             transaction_ref = $1,
             receipt_no = $2,
             qr_id = $3,
             bank_transaction_id = $4,
             bank_confirmed_at = $5,
             bank_notification = $6
         WHERE request_id = $7`,
        [
          bankTxnId,
          receipt_no,
          qrId ? String(qrId) : null,
          bankTxnId,
          bankConfirmedTime ? new Date(bankConfirmedTime) : new Date(),
          JSON.stringify(bankNotification || {}),
          requestRecord.id,
        ]
      );

      // Update request status to 'processing'
      await db.query(
        `UPDATE document_requests SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [requestRecord.id]
      );

      // Insert Activity Log
      await db.query(
        `INSERT INTO activity_logs (request_id, action_name, description)
         VALUES ($1, 'KU_QR_AUTO_PAYMENT', $2)`,
        [
          requestRecord.id,
          `ชำระเงินผ่านระบบกลาง มก. / ธนาคารสำเร็จ (จำนวน ${amount || requestRecord.total_amount} บาท โดย ${payerName}) ใบเสร็จเลขที่ ${receipt_no}`,
        ]
      );

      res.json({
        success: true,
        message: 'Payment verified and order updated successfully',
        order_no: transactionId,
        receipt_no,
      });
    } catch (err: any) {
      console.error('[KU Central QR Webhook] Error processing callback:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * ดึงข้อมูลใบเสร็จรับเงินสำหรับพิมพ์ (Print-Ready Receipt Data)
   */
  static async getReceipt(req: Request, res: Response): Promise<void> {
    const { orderNo } = req.params;

    try {
      const reqRes = await db.query(
        `SELECT r.*, p.receipt_no, p.paid_at, p.payment_method, p.transaction_ref,
          COALESCE(json_agg(json_build_object(
            'item_name', ri.item_name,
            'unit_price', ri.unit_price,
            'quantity', ri.quantity,
            'amount', ri.amount
          )) FILTER (WHERE ri.id IS NOT NULL), '[]') as items
         FROM document_requests r
         JOIN payments p ON p.request_id = r.id
         LEFT JOIN request_items ri ON ri.request_id = r.id
         WHERE r.order_no = $1 AND p.status = 'success'
         GROUP BY r.id, p.receipt_no, p.paid_at, p.payment_method, p.transaction_ref`,
        [orderNo]
      );

      if (reqRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบข้อมูลใบเสร็จหรือคำร้องนี้ยังไม่ได้ชำระเงิน' });
        return;
      }

      const receipt = reqRes.rows[0];
      const totalAmount = parseFloat(receipt.total_amount);

      res.json({
        success: true,
        data: {
          receipt_no: receipt.receipt_no,
          order_no: receipt.order_no,
          paid_at: receipt.paid_at,
          payment_method: receipt.payment_method,
          student_id: receipt.student_id,
          student_name: receipt.student_name,
          faculty_name: receipt.faculty_name,
          subtotal: receipt.subtotal,
          shipping_fee: receipt.shipping_fee,
          total_amount: totalAmount,
          thai_baht_text: PromptPayService.thaiBahtText(totalAmount),
          items: receipt.items,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}