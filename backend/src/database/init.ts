import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running database schema migration on PostgreSQL (158.108.110.98)...');
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8').replace(/^\uFEFF/, '');

    await client.query(sql);
    console.log('✅ Tables created or verified successfully!');

    // Check if document_types has rows
    const docCountRes = await client.query('SELECT COUNT(*) FROM document_types');
    if (parseInt(docCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial document types...');
      const seedDocs = [
        ['TRANSCRIPT_TH', 'ใบแสดงผลการศึกษา (Transcript) ภาษาไทย', 'Academic Transcript (Thai)', 'ใบรายงานผลการศึกษาตลอดหลักสูตรฉบับภาษาไทย พร้อมตราประทับมหาวิทยาลัย', 50.00, 'both', ['S', 'D', 'G'], 2],
        ['TRANSCRIPT_EN', 'ใบแสดงผลการศึกษา (Transcript) ภาษาอังกฤษ', 'Academic Transcript (English)', 'Official Academic Transcript in English with University Seal', 50.00, 'both', ['S', 'D', 'G'], 2],
        ['CERT_STUDENT_STATUS_TH', 'หนังสือรับรองการเป็นนิสิต ภาษาไทย', 'Certificate of Student Status (Thai)', 'รับรองสถานภาพการเป็นนิสิตปัจจุบัน สำหรับยื่นขอทุนหรือทำธุรกรรม', 30.00, 'both', ['S', 'D'], 1],
        ['CERT_STUDENT_STATUS_EN', 'หนังสือรับรองการเป็นนิสิต ภาษาอังกฤษ', 'Certificate of Student Status (English)', 'Official Student Status Certificate in English for Visa/Scholarships', 30.00, 'both', ['S', 'D'], 1],
        ['CERT_EXPECTED_GRAD', 'หนังสือรับรองคาดว่าจะสำเร็จการศึกษา', 'Certificate of Expected Graduation', 'สำหรับนิสิตชั้นปีสุดท้ายที่กำลังจะจบการศึกษาในภาคเรียนปัจจุบัน', 40.00, 'both', ['S'], 2],
        ['CERT_GRADUATION_TH', 'หนังสือรับรองสำเร็จการศึกษา ภาษาไทย', 'Certificate of Graduation (Thai)', 'รับรองการสำเร็จการศึกษาและได้รับอนุมัติปริญญาแล้ว', 50.00, 'both', ['G'], 2],
        ['CERT_GRADUATION_EN', 'หนังสือรับรองสำเร็จการศึกษา ภาษาอังกฤษ', 'Certificate of Graduation (English)', 'Official Certificate of Graduation in English', 50.00, 'both', ['G'], 2],
        ['COURSE_DESC_TH', 'คำอธิบายรายวิชา (Course Description)', 'Course Description', 'รายละเอียดเนื้อหารายวิชาสำหรับเทียบโอนหน่วยกิตหรือศึกษาต่อ', 100.00, 'hardcopy', ['S', 'D', 'G'], 3],
      ];

      for (const d of seedDocs) {
        await client.query(
          `INSERT INTO document_types (code, name_th, name_en, description, price, format, allowed_statuses, processing_days)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (code) DO NOTHING`,
          d
        );
      }
      console.log('✅ Document types seeded.');
    }

    // Check document packages
    const pkgCountRes = await client.query('SELECT COUNT(*) FROM document_packages');
    if (parseInt(pkgCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding packages...');
      const pkg1 = await client.query(
        `INSERT INTO document_packages (code, name_th, description, package_price, is_restricted_whitelist, allowed_statuses)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          'PKG_GRAD_BUNDLE',
          '🎓 ชุดแพ็กเกจผู้สำเร็จการศึกษา (Graduation Bundle)',
          'รวม Transcript ไทย 1 ฉบับ + Transcript อังกฤษ 1 ฉบับ + ใบรับรองสำเร็จการศึกษา ไทยและอังกฤษ อย่างละ 1 ฉบับ (รวม 4 ฉบับ)',
          160.00,
          false,
          ['G'],
        ]
      );

      const pkg2 = await client.query(
        `INSERT INTO document_packages (code, name_th, description, package_price, is_restricted_whitelist, allowed_statuses)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          'PKG_INTERN_BUNDLE',
          '💼 ชุดแพ็กเกจสมัครฝึกงาน/สหกิจศึกษา (Internship Bundle)',
          'รวม Transcript ไทย 1 ฉบับ + หนังสือรับรองการเป็นนิสิต 1 ฉบับ พร้อมยื่นสถานประกอบการ',
          65.00,
          false,
          ['S'],
        ]
      );

      const pkg3 = await client.query(
        `INSERT INTO document_packages (code, name_th, description, package_price, is_restricted_whitelist, allowed_statuses)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          'PKG_HONOR_SCHOLAR',
          '⭐ แพ็กเกจนิสิตเกียรตินิยม/ทุนการศึกษา (เฉพาะรายชื่อที่กำหนด)',
          'เอกสารชุดพิเศษสำหรับนิสิตที่ผ่านการอนุมัติเกียรตินิยมและได้รับยกเว้นค่าธรรมเนียมบางส่วน (กำหนดสิทธิ์ด้วยรายชื่อ Excel)',
          50.00,
          true,
          ['G'],
        ]
      );

      // Seed Whitelist for pkg3
      await client.query(
        `INSERT INTO package_whitelist (package_id, student_id, full_name)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [pkg3.rows[0].id, '6240208899', 'นายสมหวัง เรียนจบแล้ว']
      );

      console.log('✅ Document packages and whitelist seeded.');
    }

    // Seed default internal users
    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial users...');
      const seedUsers = [
        ['admin.edoc', 'admin.edoc@ku.th', 'admin', 'ku_alllogin', 'ผู้ดูแลระบบ', 'ทะเบียนและประมวลผล', '042-725000', true],
        ['staff.counter', 'staff.counter@ku.th', 'staff', 'ku_alllogin', 'สมศรี', 'บริการดีเลิศ', '042-725001', true],
        ['exec.dean', 'exec.dean@ku.th', 'executive', 'ku_alllogin', 'รศ.ดร. นนทรี', 'ผู้บริหาร มก.ฉกส.', '042-725002', true],
        ['6540201234', 'nontri.i@ku.th', 'student', 'ku_alllogin', 'นนทรี', 'อีสานงาม', '0812345678', true, '6540201234', '1479900123456', 'S', 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 'ภาควิชาวิศวกรรมคอมพิวเตอร์และสารสนเทศ'],
        ['somwang.graduate@gmail.com', 'somwang.graduate@gmail.com', 'student', 'google', 'สมหวัง', 'เรียนจบแล้ว', '0855554444', true, '6240208899', '1479900999999', 'G', 'คณะทรัพยากรธรรมชาติและอุตสาหกรรมเกษตร', 'ภาควิชาเกษตรศาสตร์'],
      ];

      for (const u of seedUsers) {
        await client.query(
          `INSERT INTO users (username, email, role, auth_provider, first_name_th, last_name_th, phone_number, is_verified, student_id, citizen_id, status_code, faculty_name, department_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (username) DO NOTHING`,
          [u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8] || null, u[9] || null, u[10] || null, u[11] || null, u[12] || null]
        );
      }
      console.log('✅ Seed users created.');
    }

    console.log('🎉 Database initialization complete!');
  } catch (err: any) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
