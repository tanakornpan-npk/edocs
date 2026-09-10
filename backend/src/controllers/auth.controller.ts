import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { CscApiService } from '../services/cscApi.service.js';
import { KuAllLoginService } from '../services/kuAllLogin.service.js';

export class AuthController {
  /**
   * เข้าสู่ระบบด้วย KU All-login (Admin, Staff, Exec และ นิสิตปัจจุบัน S, D)
   */
  static async kuAllLogin(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    if (!username) {
      res.status(400).json({ success: false, message: 'กรุณาระบุบัญชีผู้ใช้ KU All-login' });
      return;
    }

    const cleanUsername = username.trim();

    try {
      // 1. ตรวจสอบในตาราง users ว่าเป็นเจ้าหน้าที่หรือผู้บริหารหรือไม่
      const staffRes = await db.query(
        `SELECT * FROM users WHERE username = $1 AND role IN ('admin', 'staff', 'executive')`,
        [cleanUsername]
      );

      if (staffRes.rows.length > 0) {
        const staff = staffRes.rows[0];
        const token = jwt.sign(
          {
            id: staff.id,
            username: staff.username,
            role: staff.role,
            auth_provider: 'ku_alllogin',
            first_name_th: staff.first_name_th,
            last_name_th: staff.last_name_th,
          },
          config.jwtSecret,
          { expiresIn: '12h' }
        );

        res.json({
          success: true,
          message: `เข้าสู่ระบบสำเร็จในฐานะ ${staff.role.toUpperCase()}`,
          token,
          user: staff,
        });
        return;
      }

      // 2. ตรวจสอบนิสิตปัจจุบันจาก api.csc.ku.ac.th
      const student = await CscApiService.getStudentByStudentId(cleanUsername);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลบัญชีหรือรหัสนิสิตนี้ในระบบมหาวิทยาลัยเกษตรศาสตร์',
        });
        return;
      }

      // เฉพาะสถานะ S และ D ที่ให้ล็อกอินผ่าน KU All-login
      if (!['S', 'D'].includes(student.status_code)) {
        res.status(403).json({
          success: false,
          message: `รหัสนิสิตนี้มีสถานะ '${student.status_desc_th}' ไม่สามารถเข้าสู่ระบบผ่านช่องทางนิสิตปัจจุบันได้ (กรณีสำเร็จการศึกษา กรุณาใช้ช่องทางนิสิตเก่า)`,
        });
        return;
      }

      // ตรวจสอบหรือสร้างระเบียนในฐานข้อมูล PostgreSQL
      let userRes = await db.query(`SELECT * FROM users WHERE student_id = $1`, [student.student_id]);
      let user = userRes.rows[0];

      if (!user) {
        const insertRes = await db.query(
          `INSERT INTO users (username, email, role, auth_provider, first_name_th, last_name_th, phone_number, is_verified, student_id, citizen_id, status_code, faculty_name, department_name)
           VALUES ($1, $2, 'student', 'ku_alllogin', $3, $4, $5, true, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            student.student_id,
            student.email || `${student.student_id}@ku.th`,
            student.first_name_th,
            student.last_name_th,
            student.phone_number || '',
            student.student_id,
            student.citizen_id,
            student.status_code,
            student.faculty_name_th,
            student.department_name_th,
          ]
        );
        user = insertRes.rows[0];
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: 'student',
          auth_provider: 'ku_alllogin',
          student_id: user.student_id,
          status_code: user.status_code,
          citizen_id: user.citizen_id,
          first_name_th: user.first_name_th,
          last_name_th: user.last_name_th,
        },
        config.jwtSecret,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ (นิสิต มก.ฉกส.)',
        token,
        user,
        studentProfile: student,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${err.message}` });
    }
  }

  /**
   * เข้าสู่ระบบสำหรับนิสิตเก่า (Google, LINE, Email/Password)
   */
  static async socialOrAlumniLogin(req: Request, res: Response): Promise<void> {
    const { provider, email, name, provider_id } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'กรุณาระบุอีเมลที่ต้องการเข้าสู่ระบบ' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      let userRes = await db.query(`SELECT * FROM users WHERE email = $1`, [cleanEmail]);
      let user = userRes.rows[0];

      if (!user) {
        // ลงทะเบียนผู้ใช้งานนิสิตเก่าใหม่ (สถานะยังไม่ verify เลขบัตร)
        const insertRes = await db.query(
          `INSERT INTO users (username, email, role, auth_provider, provider_id, first_name_th, last_name_th, is_verified, status_code)
           VALUES ($1, $2, 'student', $3, $4, $5, '', false, 'G')
           RETURNING *`,
          [cleanEmail, cleanEmail, provider || 'google', provider_id || `prov-${Date.now()}`, name || 'นิสิตเก่า']
        );
        user = insertRes.rows[0];
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: 'student',
          auth_provider: user.auth_provider,
          student_id: user.student_id,
          status_code: user.status_code || 'G',
          citizen_id: user.citizen_id,
          first_name_th: user.first_name_th,
          last_name_th: user.last_name_th,
        },
        config.jwtSecret,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ (บัญชีนิสิตเก่า)',
        token,
        user,
        require_citizen_id_verification: !user.is_verified,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: `เกิดข้อผิดพลาด: ${err.message}` });
    }
  }

  /**
   * ข้อมูลบัญชีผู้ใช้ปัจจุบัน (Current Profile)
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    try {
      const userRes = await db.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      if (userRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
        return;
      }

      const user = userRes.rows[0];
      let studentDetails = null;
      if (user.student_id) {
        studentDetails = await CscApiService.getStudentByStudentId(user.student_id);
      }

      res.json({
        success: true,
        user,
        studentDetails,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * สลับบัญชีทดสอบในโหมด Dev (Fast Role Switcher)
   */
  static async switchDevRole(req: Request, res: Response): Promise<void> {
    const roleType = req.body.roleType || req.body.role;
    let targetUsername = 'admin.edoc';

    if (roleType === 'admin') targetUsername = 'admin.edoc';
    else if (roleType === 'staff') targetUsername = 'staff.counter';
    else if (roleType === 'exec') targetUsername = 'exec.dean';
    else if (roleType === 'student_s') targetUsername = '6540201234';
    else if (roleType === 'alumni_g') targetUsername = 'somwang.graduate@gmail.com';

    try {
      const userRes = await db.query(`SELECT * FROM users WHERE username = $1`, [targetUsername]);
      if (userRes.rows.length === 0) {
        res.status(404).json({ success: false, message: `ไม่พบบัญชีทดสอบ '${targetUsername}'` });
        return;
      }

      const user = userRes.rows[0];
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          auth_provider: user.auth_provider,
          student_id: user.student_id,
          status_code: user.status_code,
          citizen_id: user.citizen_id,
          first_name_th: user.first_name_th,
          last_name_th: user.last_name_th,
        },
        config.jwtSecret,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        message: `สลับบทบาทเป็น: ${user.first_name_th} (${user.role}) สำเร็จ`,
        token,
        user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * เริ่มต้นกระบวนการ KU All-login (OAuth 2.0 PKCE Redirect)
   */
  static async kuAuthorize(req: Request, res: Response): Promise<void> {
    try {
      const returnUrl = (req.query.returnUrl as string) || `${config.frontendUrl}/`;
      const authorizeUrl = KuAllLoginService.getAuthorizeUrl(returnUrl);
      res.redirect(authorizeUrl);
    } catch (err: any) {
      res.status(500).send(`เกิดข้อผิดพลาดในการเชื่อมต่อ KU All-login: ${err.message}`);
    }
  }

  /**
   * รับ Callback จาก KU All-login Keycloak แลกเปลี่ยน Code และออก JWT
   */
  static async kuCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;

    if (error) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>KU All-login Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #c53030;">เข้าสู่ระบบไม่สำเร็จ</h2>
          <p>${error}: ${errorDescription || 'การยืนยันตัวตนถูกยกเลิกหรือมีข้อผิดพลาด'}</p>
          <a href="${config.frontendUrl}/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#006633; color:white; text-decoration:none; border-radius:8px;">กลับสู่หน้าหลัก</a>
        </body>
        </html>
      `);
      return;
    }

    if (!code || !state) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Bad Request</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #c53030;">ข้อมูลไม่ถูกต้อง</h2>
          <p>ไม่พบ Authorization Code หรือ State Parameter จากระบบ KU All-login</p>
          <a href="${config.frontendUrl}/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#006633; color:white; text-decoration:none; border-radius:8px;">กลับสู่หน้าหลัก</a>
        </body>
        </html>
      `);
      return;
    }

    try {
      // 1. ตรวจสอบ state และดึง verifier
      const stateData = KuAllLoginService.consumeState(state);
      const returnUrl = stateData.returnUrl || `${config.frontendUrl}/`;

      // 2. แลก code เป็น access_token
      const accessToken = await KuAllLoginService.exchangeCodeForToken(code, stateData.verifier);

      // 3. ดึง user profile จาก Keycloak
      const kuProfile = await KuAllLoginService.getUserProfile(accessToken);
      const uid = kuProfile.uid;

      // 4. ค้นหาในฐานข้อมูลว่ามีบัญชีนี้อยู่แล้วหรือไม่ (Admin / Staff / Executive / Existing Student)
      let userRes = await db.query(
        `SELECT * FROM users WHERE username = $1 OR (email = $2 AND email != '')`,
        [uid, kuProfile.email]
      );
      let user = userRes.rows[0];

      if (user) {
        // หากมีบัญชีอยู่แล้ว (เช่น เจ้าหน้าที่ แอดมิน หรือนิสิตที่เคยบันทึกไว้)
        await db.query(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [user.id]);
      } else {
        // ตรวจสอบว่าเป็นนิสิตหรือไม่
        const cleanStdId = uid.replace(/^[bg]/i, '');
        let studentProfile = null;
        try {
          studentProfile = await CscApiService.getStudentByStudentId(cleanStdId);
        } catch {
          // ignore
        }

        if (studentProfile) {
          // สร้างระเบียนนิสิตใหม่ในระบบ
          const insertRes = await db.query(
            `INSERT INTO users (
              username, email, role, auth_provider, first_name_th, last_name_th, 
              phone_number, is_verified, student_id, citizen_id, status_code, faculty_name, department_name
            ) VALUES ($1, $2, 'student', 'ku_alllogin', $3, $4, $5, true, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
              uid,
              kuProfile.email,
              studentProfile.first_name_th,
              studentProfile.last_name_th,
              studentProfile.phone_number || '',
              studentProfile.student_id,
              studentProfile.citizen_id,
              studentProfile.status_code,
              studentProfile.faculty_name_th,
              studentProfile.department_name_th,
            ]
          );
          user = insertRes.rows[0];
        } else {
          // ผู้ใช้งานบุคลากรทั่วไป หรือนิสิตที่ไม่อยู่ใน API
          const nameParts = kuProfile.fullname.split(' ');
          const fName = nameParts[0] || kuProfile.fullname;
          const lName = nameParts.slice(1).join(' ') || '';
          const insertRes = await db.query(
            `INSERT INTO users (
              username, email, role, auth_provider, first_name_th, last_name_th, is_verified
            ) VALUES ($1, $2, 'student', 'ku_alllogin', $3, $4, false)
            RETURNING *`,
            [uid, kuProfile.email, fName, lName]
          );
          user = insertRes.rows[0];
        }
      }

      // 5. สร้าง JWT Token ของ edoc
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          auth_provider: 'ku_alllogin',
          student_id: user.student_id,
          status_code: user.status_code,
          citizen_id: user.citizen_id,
          first_name_th: user.first_name_th,
          last_name_th: user.last_name_th,
        },
        config.jwtSecret,
        { expiresIn: '12h' }
      );

      // 6. ตอบกลับด้วย HTML สคริปต์เพื่อจัดเก็บ Token ใน LocalStorage และเปลี่ยนหน้าไปยัง Frontend
      const safeUserData = JSON.stringify(user);
      const safeToken = JSON.stringify(token);
      const safeTargetUrl = JSON.stringify(returnUrl);

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>เข้าสู่ระบบสำเร็จ - KU CSC e-Doc</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
            .icon { width: 56px; height: 56px; background: #e6f4ea; color: #006633; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 20px; }
            h2 { color: #006633; margin: 0 0 10px 0; font-size: 22px; }
            p { color: #64748b; font-size: 14px; margin: 0 0 24px 0; }
            .spinner { border: 3px solid #e2e8f0; border-top: 3px solid #006633; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>เข้าสู่ระบบ KU All-login สำเร็จ</h2>
            <p>ยินดีต้อนรับ ${user.first_name_th || user.username}<br>กำลังพาคุณเข้าสู่ระบบ...</p>
            <div class="spinner"></div>
          </div>
          <script>
            try {
              localStorage.setItem('edoc_token', ${safeToken});
              localStorage.setItem('edoc_user', ${safeUserData});
            } catch (e) {
              console.error(e);
            }
            setTimeout(() => {
              window.location.href = ${safeTargetUrl};
            }, 800);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>KU All-login Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #c53030;">เข้าสู่ระบบ KU All-login ล้มเหลว</h2>
          <p style="color: #666;">${err.message}</p>
          <a href="${config.frontendUrl}/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#006633; color:white; text-decoration:none; border-radius:8px;">กลับสู่หน้าหลัก</a>
        </body>
        </html>
      `);
    }
  }
}