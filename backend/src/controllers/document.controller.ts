import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { ExcelService } from '../services/excel.service.js';

export class DocumentController {
  /**
   * ดึงรายการเอกสารทั้งหมด (กรองตามสิทธิ์และสถานะของนิสิต)
   */
  static async getDocuments(req: Request, res: Response): Promise<void> {
    const userRole = req.user?.role;
    const userStatus = req.user?.status_code;

    try {
      let query = `SELECT * FROM document_types WHERE is_active = true`;
      const params: any[] = [];

      if (userRole === 'student' && userStatus) {
        query += ` AND $1 = ANY(allowed_statuses)`;
        params.push(userStatus);
      }

      query += ` ORDER BY code ASC`;

      const result = await db.query(query, params);
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * ดึงรายการแพ็กเกจเอกสารรวม (กรองตามสถานะ และตรวจสอบสิทธิ์ Whitelist) พร้อมรายการเอกสารที่รวมในแพ็กเกจ
   */
  static async getPackages(req: Request, res: Response): Promise<void> {
    const userRole = req.user?.role;
    const userStatus = req.user?.status_code;
    const studentId = req.user?.student_id;

    try {
      const result = await db.query(`SELECT * FROM document_packages WHERE is_active = true ORDER BY created_at DESC`);
      let pkgs = result.rows;

      // ดึงรายการเอกสารทั้งหมดที่ผูกกับแพ็กเกจ package_items
      const itemsRes = await db.query(`
        SELECT 
          pi.id,
          pi.package_id,
          pi.document_type_id,
          pi.quantity,
          dt.code as document_code,
          dt.name_th as document_name_th,
          dt.name_th,
          dt.name_en as document_name_en,
          dt.price as document_price,
          dt.format as document_format
        FROM package_items pi
        JOIN document_types dt ON pi.document_type_id = dt.id
        ORDER BY pi.id ASC
      `);

      const itemsByPackage: Record<string, any[]> = {};
      for (const item of itemsRes.rows) {
        if (!itemsByPackage[item.package_id]) {
          itemsByPackage[item.package_id] = [];
        }
        itemsByPackage[item.package_id].push({
          id: item.id,
          document_type_id: item.document_type_id,
          quantity: item.quantity,
          document_code: item.document_code,
          document_name_th: item.document_name_th,
          name_th: item.document_name_th,
          document_name_en: item.document_name_en,
          document_price: item.document_price,
          document_format: item.document_format,
        });
      }

      for (const pkg of pkgs) {
        pkg.items = itemsByPackage[pkg.id] || [];
      }

      if (userRole === 'student') {
        const eligiblePkgs = [];
        for (const pkg of pkgs) {
          // ตรวจสอบสถานะ
          if (userStatus && !pkg.allowed_statuses.includes(userStatus)) {
            continue;
          }

          // ตรวจสอบ Whitelist
          if (pkg.is_restricted_whitelist) {
            if (!studentId) continue;
            const wlCheck = await db.query(
              `SELECT 1 FROM package_whitelist WHERE package_id = $1 AND student_id = $2`,
              [pkg.id, studentId]
            );
            if (wlCheck.rows.length === 0) continue;
          }

          eligiblePkgs.push(pkg);
        }
        pkgs = eligiblePkgs;
      }

      res.json({
        success: true,
        data: pkgs,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * [Admin] บันทึกประเภทเอกสาร (Create / Update)
   */
  static async saveDocument(req: Request, res: Response): Promise<void> {
    const { id, code, name_th, name_en, description, price, format, allowed_statuses, processing_days, ref2_code } = req.body;

    if (!code || !name_th || price === undefined) {
      res.status(400).json({ success: false, message: 'กรุณากรอกรหัส, ชื่อเอกสาร และราคาให้ครบถ้วน' });
      return;
    }

    try {
      const finalRef2 = (ref2_code || '300').trim();
      if (id) {
        const updateRes = await db.query(
          `UPDATE document_types 
           SET code = $1, name_th = $2, name_en = $3, description = $4, price = $5, format = $6, allowed_statuses = $7, processing_days = $8, ref2_code = $9
           WHERE id = $10 RETURNING *`,
          [code, name_th, name_en || '', description || '', parseFloat(price), format || 'both', allowed_statuses || ['S', 'D', 'G'], parseInt(processing_days, 10) || 2, finalRef2, id]
        );
        res.json({ success: true, message: 'อัปเดตข้อมูลเอกสารเรียบร้อย', data: updateRes.rows[0] });
      } else {
        const insertRes = await db.query(
          `INSERT INTO document_types (code, name_th, name_en, description, price, format, allowed_statuses, processing_days, ref2_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [code, name_th, name_en || '', description || '', parseFloat(price), format || 'both', allowed_statuses || ['S', 'D', 'G'], parseInt(processing_days, 10) || 2, finalRef2]
        );
        res.json({ success: true, message: 'สร้างประเภทเอกสารใหม่เรียบร้อย', data: insertRes.rows[0] });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * [Admin] บันทึกแพ็กเกจเอกสารรวม (Create / Update) พร้อมรายการเอกสารที่เลือกจากแคตตาล็อก
   */
  static async savePackage(req: Request, res: Response): Promise<void> {
    const { id, code, name_th, description, package_price, is_restricted_whitelist, allowed_statuses, items, ref2_code } = req.body;

    if (!code || !name_th || package_price === undefined) {
      res.status(400).json({ success: false, message: 'กรุณากรอกรหัสแพ็กเกจ, ชื่อแพ็กเกจ และราคาให้ครบถ้วน' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'กรุณาเลือกรายการเอกสารจากแคตตาล็อกอย่างน้อย 1 รายการสำหรับแพ็กเกจนี้' });
      return;
    }

    try {
      let packageId = id;
      let pkgRecord: any;
      const finalRef2 = (ref2_code || '300').trim();

      if (id) {
        const updateRes = await db.query(
          `UPDATE document_packages 
           SET code = $1, name_th = $2, description = $3, package_price = $4, is_restricted_whitelist = $5, allowed_statuses = $6, ref2_code = $7
           WHERE id = $8 RETURNING *`,
          [code, name_th, description || '', parseFloat(package_price), !!is_restricted_whitelist, allowed_statuses || ['G'], finalRef2, id]
        );
        pkgRecord = updateRes.rows[0];

        // ล้างรายการเดิมแล้วบันทึกใหม่
        await db.query(`DELETE FROM package_items WHERE package_id = $1`, [id]);
      } else {
        const insertRes = await db.query(
          `INSERT INTO document_packages (code, name_th, description, package_price, is_restricted_whitelist, allowed_statuses, ref2_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [code, name_th, description || '', parseFloat(package_price), !!is_restricted_whitelist, allowed_statuses || ['G'], finalRef2]
        );
        pkgRecord = insertRes.rows[0];
        packageId = pkgRecord.id;
      }

      // บันทึกรายการเอกสารที่เลือกลง package_items
      for (const it of items) {
        if (it.document_type_id) {
          await db.query(
            `INSERT INTO package_items (package_id, document_type_id, quantity)
             VALUES ($1, $2, $3)`,
            [packageId, it.document_type_id, parseInt(it.quantity, 10) || 1]
          );
        }
      }

      // ดึงข้อมูลรายการเอกสารที่ผูกสำเร็จพร้อมส่งกลับ
      const attachedItems = await db.query(
        `SELECT pi.id, pi.document_type_id, pi.quantity, dt.code as document_code, dt.name_th as document_name_th, dt.name_th, dt.price as document_price
         FROM package_items pi
         JOIN document_types dt ON pi.document_type_id = dt.id
         WHERE pi.package_id = $1`,
        [packageId]
      );
      pkgRecord.items = attachedItems.rows;

      res.json({
        success: true,
        message: id ? 'อัปเดตแพ็กเกจเรียบร้อย' : 'สร้างแพ็กเกจใหม่เรียบร้อย',
        data: pkgRecord,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * [Admin] นำเข้ารายชื่อนิสิต Whitelist จากไฟล์ Excel สำหรับแพ็กเกจพิเศษ
   */
  static async uploadWhitelistExcel(req: Request, res: Response): Promise<void> {
    const packageId = req.params.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'กรุณาแนบไฟล์ Excel (.xlsx หรือ .csv)' });
      return;
    }

    try {
      const pkgRes = await db.query(`SELECT * FROM document_packages WHERE id = $1`, [packageId]);
      if (pkgRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบแพ็กเกจที่ระบุ' });
        return;
      }
      const pkg = pkgRes.rows[0];

      const parsedItems = ExcelService.parseWhitelistFile(file.buffer);
      if (parsedItems.length === 0) {
        res.status(400).json({ success: false, message: 'ไม่พบข้อมูลรหัสนิสิต (10 หลัก) ในไฟล์ Excel' });
        return;
      }

      // ลบ whitelist เดิมของแพ็กเกจนี้
      await db.query(`DELETE FROM package_whitelist WHERE package_id = $1`, [packageId]);

      // นำเข้าข้อมูลใหม่
      for (const item of parsedItems) {
        await db.query(
          `INSERT INTO package_whitelist (package_id, student_id, full_name)
           VALUES ($1, $2, $3) ON CONFLICT (package_id, student_id) DO NOTHING`,
          [packageId, item.student_id, item.full_name || null]
        );
      }

      // ปรับให้แพ็กเกจนี้เปิดใช้ Whitelist
      await db.query(`UPDATE document_packages SET is_restricted_whitelist = true WHERE id = $1`, [packageId]);

      res.json({
        success: true,
        message: `นำเข้ารายชื่อนิสิตสำเร็จทั้งหมด ${parsedItems.length} คน สำหรับแพ็กเกจ '${pkg.name_th}'`,
        count: parsedItems.length,
        sample: parsedItems.slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel: ${err.message}` });
    }
  }

  /**
   * [Admin] ดูรายชื่อ Whitelist ของแพ็กเกจ
   */
  static async getPackageWhitelist(req: Request, res: Response): Promise<void> {
    const packageId = req.params.id;
    try {
      const resWl = await db.query(
        `SELECT student_id, full_name, imported_at FROM package_whitelist WHERE package_id = $1 ORDER BY student_id ASC`,
        [packageId]
      );
      res.json({
        success: true,
        data: resWl.rows,
        count: resWl.rowCount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}