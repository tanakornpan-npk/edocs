import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { CscApiService } from '../services/cscApi.service.js';

export class StudentController {
  /**
   * ระบบ Just-In-Time Verification สำหรับนิสิตเก่า (G)
   * ตรวจสอบเลขประจำตัวประชาชน 13 หลักเพื่อดึงข้อมูลประวัติการศึกษาจาก api.csc.ku.ac.th
   */
  static async verifyCitizenId(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { citizen_id, selected_student_id } = req.body;

    if (!citizen_id) {
      res.status(400).json({ success: false, message: 'กรุณาระบุเลขประจำตัวประชาชน 13 หลัก' });
      return;
    }

    const cleanCitizenId = citizen_id.replace(/[-\s]/g, '');
    if (!/^\d{13}$/.test(cleanCitizenId)) {
      res.status(400).json({ success: false, message: 'รูปแบบเลขประจำตัวประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก)' });
      return;
    }

    try {
      const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      if (userRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        return;
      }
      const user = userRes.rows[0];

      // 1. ตรวจสอบกับ api.csc.ku.ac.th
      const matchingRecords = await CscApiService.getStudentsByCitizenId(cleanCitizenId);
      if (!matchingRecords || matchingRecords.length === 0) {
        res.status(404).json({
          success: false,
          message: 'ไม่พบประวัติการศึกษาที่ตรงกับเลขประจำตัวประชาชนนี้ในระบบมหาวิทยาลัยเกษตรศาสตร์ วข.เฉลิมพระเกียรติ จ.สกลนคร',
        });
        return;
      }

      // กรองเฉพาะผู้สำเร็จการศึกษา (G)
      const graduatedRecords = matchingRecords.filter((r) => r.status_code === 'G');
      if (graduatedRecords.length === 0) {
        res.status(403).json({
          success: false,
          message: 'พบประวัตินิสิตแต่ยังไม่มีสถานะสำเร็จการศึกษา (status_code != G)',
        });
        return;
      }

      // หากพบมากกว่า 1 ปริญญา (เช่น จบ ป.ตรี และ ป.โท) และยังไม่ได้เลือก
      if (graduatedRecords.length > 1 && !selected_student_id) {
        res.json({
          success: true,
          require_selection: true,
          message: 'พบประวัติการศึกษามากกว่า 1 รายการ กรุณาเลือกรหัสนิสิต/ระดับการศึกษาที่ต้องการทำรายการ',
          records: graduatedRecords,
        });
        return;
      }

      const selectedRecord = selected_student_id
        ? graduatedRecords.find((r) => r.student_id === selected_student_id) || graduatedRecords[0]
        : graduatedRecords[0];

      // อัปเดตข้อมูลลง PostgreSQL
      const updateRes = await db.query(
        `UPDATE users 
         SET citizen_id = $1, student_id = $2, first_name_th = $3, last_name_th = $4,
             faculty_name = $5, department_name = $6, status_code = $7, is_verified = true, verified_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          cleanCitizenId,
          selectedRecord.student_id,
          selectedRecord.first_name_th,
          selectedRecord.last_name_th,
          selectedRecord.faculty_name_th,
          selectedRecord.department_name_th,
          selectedRecord.status_code,
          user.id,
        ]
      );

      const updatedUser = updateRes.rows[0];

      // ออก Token ใหม่ที่มีข้อมูลครบถ้วน
      const newToken = jwt.sign(
        {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          auth_provider: updatedUser.auth_provider,
          student_id: updatedUser.student_id,
          status_code: updatedUser.status_code,
          citizen_id: updatedUser.citizen_id,
          first_name_th: updatedUser.first_name_th,
          last_name_th: updatedUser.last_name_th,
        },
        config.jwtSecret,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        require_selection: false,
        message: 'ยืนยันตัวตนและเชื่อมโยงประวัตินิสิตเก่าสำเร็จ',
        token: newToken,
        user: updatedUser,
        studentProfile: selectedRecord,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * ค้นหาข้อมูลนิสิต (สำหรับเคาน์เตอร์บริการ)
   */
  static async searchStudent(req: Request, res: Response): Promise<void> {
    const { query } = req.params;
    if (!query) {
      res.status(400).json({ success: false, message: 'กรุณาระบุรหัสนิสิตหรือเลขบัตรประชาชน' });
      return;
    }

    const cleanQuery = query.trim().replace(/[-\s]/g, '');
    let student = null;

    if (cleanQuery.length === 10) {
      student = await CscApiService.getStudentByStudentId(cleanQuery);
    } else if (cleanQuery.length === 13) {
      const records = await CscApiService.getStudentsByCitizenId(cleanQuery);
      student = records.length > 0 ? records[0] : null;
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนิสิตในระบบ api.csc.ku.ac.th' });
      return;
    }

    res.json({
      success: true,
      student,
    });
  }
}