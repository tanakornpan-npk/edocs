import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { db } from '../database/db.js';
import { PromptPayService } from '../services/promptpay.service.js';
import { ThaiQrBillPaymentService } from '../services/thaiQrBillPayment.service.js';
import { KuCentralQrService } from '../services/kuCentralQr.service.js';

export class RequestController {
  /**
   * สร้างคำร้องขอเอกสาร (ยื่นคำขอและออก QR Payment)
   */
  static async createRequest(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const {
      student_id,
      student_name,
      student_status,
      faculty_name,
      department_name,
      delivery_method, // 'pickup', 'postal', 'digital'
      recipient_name,
      shipping_address,
      items, // array of { document_type_id?, package_id?, item_name, unit_price, quantity }
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'กรุณาเลือกรายการเอกสารอย่างน้อย 1 รายการ' });
      return;
    }

    if (!delivery_method) {
      res.status(400).json({ success: false, message: 'กรุณาระบุช่องทางการรับเอกสาร' });
      return;
    }

    if (delivery_method === 'postal' && !shipping_address) {
      res.status(400).json({ success: false, message: 'กรณีจัดส่งทางไปรษณีย์ กรุณาระบุที่อยู่จัดส่งให้ชัดเจน' });
      return;
    }

    try {
      // 1. คำนวณยอดเงิน
      let subtotal = 0;
      for (const item of items) {
        const itemQty = parseInt(item.quantity, 10) || 1;
        const itemPrice = parseFloat(item.unit_price) || 0;
        subtotal += itemPrice * itemQty;
      }

      // ค่าจัดส่งไปรษณีย์ EMS 50 บาท (รับเองที่เคาน์เตอร์และดิจิทัลฟรี)
      const shipping_fee = delivery_method === 'postal' ? 50.00 : 0.00;
      const total_amount = subtotal + shipping_fee;

      // 2. สร้างเลขที่คำร้อง (Order No.)
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countRes = await db.query(
        `SELECT COUNT(*) FROM document_requests WHERE order_no LIKE $1`,
        [`EDOC-${datePrefix}-%`]
      );
      const seq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(4, '0');
      const order_no = `EDOC-${datePrefix}-${seq}`;

      // 3. บันทึกลงตาราง document_requests
      const reqInsert = await db.query(
        `INSERT INTO document_requests (
          order_no, user_id, student_id, student_name, student_status, faculty_name, department_name,
          delivery_method, recipient_name, shipping_address, shipping_fee, subtotal, total_amount,
          status, created_by_role, counter_staff_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending_payment', $14, $15)
        RETURNING *`,
        [
          order_no,
          userId || null,
          student_id || req.user?.student_id || 'UNKNOWN',
          student_name || `${req.user?.first_name_th || ''} ${req.user?.last_name_th || ''}`.trim() || 'นิสิต มก.ฉกส.',
          student_status || req.user?.status_code || 'S',
          faculty_name || '',
          department_name || '',
          delivery_method,
          recipient_name || student_name,
          shipping_address || '',
          shipping_fee,
          subtotal,
          total_amount,
          userRole === 'staff' ? 'counter_staff' : 'student',
          userRole === 'staff' ? userId : null,
        ]
      );
      const requestRecord = reqInsert.rows[0];

      // 4. บันทึกรายการเอกสาร request_items
      for (const item of items) {
        const itemQty = parseInt(item.quantity, 10) || 1;
        const itemPrice = parseFloat(item.unit_price) || 0;
        const itemAmount = itemPrice * itemQty;

        // ดึงชื่อทางการจากฐานข้อมูลเสมอเพื่อป้องกันปัญหา character encoding
        let resolvedItemName = item.item_name || 'เอกสารทางการศึกษา';
        if (item.document_type_id) {
          const docLookup = await db.query('SELECT name_th FROM document_types WHERE id = $1', [item.document_type_id]);
          if (docLookup.rows.length > 0 && docLookup.rows[0].name_th) {
            resolvedItemName = docLookup.rows[0].name_th;
          }
        } else if (item.package_id) {
          const pkgLookup = await db.query('SELECT name_th FROM document_packages WHERE id = $1', [item.package_id]);
          if (pkgLookup.rows.length > 0 && pkgLookup.rows[0].name_th) {
            resolvedItemName = pkgLookup.rows[0].name_th;
          }
        }

        await db.query(
          `INSERT INTO request_items (request_id, document_type_id, package_id, item_name, unit_price, quantity, amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            requestRecord.id,
            item.document_type_id || null,
            item.package_id || null,
            resolvedItemName,
            itemPrice,
            itemQty,
            itemAmount,
          ]
        );
      }

      // 5. หาค่า REF2 ที่เหมาะสมจากรายการเอกสาร (Default คือ '300': ค่าเอกสารสำคัญทางการศึกษา)
      let resolvedRef2 = '300';
      try {
        if (items && items.length > 0) {
          const firstDocId = items[0].document_type_id;
          const firstPkgId = items[0].package_id;
          if (firstDocId) {
            const docRes = await db.query('SELECT ref2_code FROM document_types WHERE id = $1', [firstDocId]);
            if (docRes.rows[0]?.ref2_code) resolvedRef2 = docRes.rows[0].ref2_code;
          } else if (firstPkgId) {
            const pkgRes = await db.query('SELECT ref2_code FROM document_packages WHERE id = $1', [firstPkgId]);
            if (pkgRes.rows[0]?.ref2_code) resolvedRef2 = pkgRes.rows[0].ref2_code;
          }
        }
      } catch (err: any) {
        console.warn('Cannot resolve custom REF2, falling back to 300:', err.message);
      }

      // สร้าง Thai QR Cross-Bank Bill Payment (รองรับทั้ง Central KU Service และ Standalone Tag 30)
      const qrData = await ThaiQrBillPaymentService.generateBillPaymentQr({
        amount: total_amount,
        ref1: student_id || order_no,
        ref2: resolvedRef2,
        transactionId: order_no,
      });

      // บันทึกธุรกรรมการชำระเงิน
      await db.query(
        `INSERT INTO payments (
           request_id, order_no, amount, payment_method, qr_payload, qr_expired_at,
           biller_id, ref1, ref2, qr_id, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
        [
          requestRecord.id,
          order_no,
          total_amount,
          qrData.isCentralService ? 'ku_central_qr' : 'thai_qr',
          qrData.isCentralService ? qrData.qrDataUrl : qrData.payload,
          qrData.expiredAt,
          qrData.billerId,
          qrData.ref1,
          qrData.ref2,
          qrData.qrId || null,
        ]
      );

      // บันทึก Activity Log
      await db.query(
        `INSERT INTO activity_logs (request_id, action_by, action_name, description)
         VALUES ($1, $2, 'CREATE_REQUEST', $3)`,
        [requestRecord.id, userId || null, `ยื่นคำร้องขอเอกสารสำเร็จ หมายเลข ${order_no} (REF2: ${resolvedRef2})`]
      );

      res.json({
        success: true,
        message: 'ยื่นคำร้องสำเร็จ กรุณาสแกน QR เพื่อชำระเงิน',
        order_no,
        request: requestRecord,
        payment: {
          amount: total_amount,
          amount_thai_text: qrData.amountThaiText,
          qr_data_url: qrData.qrDataUrl,
          expired_at: qrData.expiredAt,
          biller_id: qrData.billerId,
          merchant_name: qrData.merchantName,
          service_name_th: qrData.serviceNameTh,
          ref1: qrData.ref1,
          ref2: qrData.ref2,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการสร้างคำร้อง: ${err.message}` });
    }
  }

  /**
   * ดึงประวัติคำร้องของนิสิตคนปัจจุบัน (My Requests)
   */
  static async getMyRequests(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const studentId = req.user?.student_id;

    try {
      const result = await db.query(
        `SELECT r.*, 
          COALESCE(json_agg(json_build_object(
            'id', ri.id,
            'item_name', ri.item_name,
            'unit_price', ri.unit_price,
            'quantity', ri.quantity,
            'amount', ri.amount
          )) FILTER (WHERE ri.id IS NOT NULL), '[]') as items
         FROM document_requests r
         LEFT JOIN request_items ri ON ri.request_id = r.id
         WHERE r.user_id = $1 OR r.student_id = $2
         GROUP BY r.id
         ORDER BY r.created_at DESC`,
        [userId, studentId || '']
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * รายละเอียดคำร้อง (Detail View)
   */
  static async getRequestDetail(req: Request, res: Response): Promise<void> {
    const { orderNo } = req.params;

    try {
      const reqRes = await db.query(
        `SELECT r.*,
          COALESCE(json_agg(json_build_object(
            'id', ri.id,
            'item_name', ri.item_name,
            'unit_price', ri.unit_price,
            'quantity', ri.quantity,
            'amount', ri.amount
          )) FILTER (WHERE ri.id IS NOT NULL), '[]') as items
         FROM document_requests r
         LEFT JOIN request_items ri ON ri.request_id = r.id
         WHERE r.order_no = $1 OR r.id::text = $1
         GROUP BY r.id`,
        [orderNo]
      );

      if (reqRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบคำร้องที่ระบุ' });
        return;
      }

      const request = reqRes.rows[0];

      // ข้อมูลการชำระเงิน
      const payRes = await db.query(
        `SELECT * FROM payments WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [request.id]
      );
      let payment = payRes.rows[0] || null;
      if (payment && payment.qr_payload) {
        try {
          if (payment.qr_payload.startsWith('data:image/') || payment.payment_method === 'ku_central_qr') {
            const cleanUrl = KuCentralQrService.cleanDataUrl(payment.qr_payload);
            payment = { ...payment, qr_data_url: cleanUrl || payment.qr_payload };
          } else {
            const qrDataUrl = await QRCode.toDataURL(payment.qr_payload, {
              errorCorrectionLevel: 'M',
              margin: 2,
              width: 340,
              color: { dark: '#004d26', light: '#ffffff' },
            });
            payment = { ...payment, qr_data_url: qrDataUrl };
          }
        } catch (_) {}
      }

      res.json({
        success: true,
        data: {
          ...request,
          payment,
          amount_thai_text: ThaiQrBillPaymentService.thaiBahtText(parseFloat(request.total_amount)),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}