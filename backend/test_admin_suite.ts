import { db } from './src/database/db.js';
import * as xlsx from 'xlsx';

async function runAdminVerification() {
  console.log('====================================================');
  console.log('🔍 เริ่มการตรวจสอบระบบงานผู้ดูแลระบบ (Admin Test Suite)');
  console.log('====================================================\n');

  let adminToken = '';
  let studentToken = '';
  let testDocId = '';
  let testPkgId = '';

  // 1. ตรวจสอบการ Authentication และ Authorization
  console.log('▶ [TEST 1] ทดสอบการยืนยันตัวตนและการจำกัดสิทธิ์ (Auth & RBAC)...');
  
  // 1.1 ล็อกอินเป็น Admin
  const adminLogin = await fetch('http://localhost:5050/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  });
  const adminData = await adminLogin.json();
  if (!adminData.success || adminData.user.role !== 'admin') {
    throw new Error('Admin login failed: ' + JSON.stringify(adminData));
  }
  adminToken = adminData.token;
  console.log('  ✅ 1.1 ล็อกอินเป็น Admin สำเร็จ: ' + adminData.user.first_name_th + ' (' + adminData.user.role + ')');

  // 1.2 ล็อกอินเป็น Student เพื่อทดสอบว่า Student ต้องไม่มีสิทธิ์เข้า API Admin
  const studentLogin = await fetch('http://localhost:5050/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student_s' }),
  });
  const studentData = await studentLogin.json();
  studentToken = studentData.token;

  const forbiddenCheck = await fetch('http://localhost:5050/api/admin/staff', {
    headers: { 'Authorization': 'Bearer ' + studentToken },
  });
  if (forbiddenCheck.status === 403) {
    console.log('  ✅ 1.2 สิทธิ์การเข้าถึงปลอดภัย: นิสิตไม่สามารถเข้าถึง API Admin ได้ (HTTP 403 Forbidden)');
  } else {
    throw new Error('Security Breach: Student accessed Admin API! Status: ' + forbiddenCheck.status);
  }

  // 2. ตรวจสอบการจัดการประเภทเอกสาร (Document Types CRUD)
  console.log('\n▶ [TEST 2] ทดสอบการจัดการประเภทเอกสาร (Document Types CRUD)...');
  
  // 2.1 ดึงรายการเอกสาร
  const getDocsRes = await fetch('http://localhost:5050/api/documents', {
    headers: { 'Authorization': 'Bearer ' + adminToken },
  });
  const getDocsData = await getDocsRes.json();
  console.log(`  ✅ 2.1 ดึงรายการเอกสารสำเร็จ: ปัจจุบันมี ${getDocsData.data.length} รายการ`);

  // 2.2 สร้างประเภทเอกสารใหม่
  const newDocPayload = {
    code: 'TEST_DOC_2026',
    name_th: 'หนังสือรับรองผลการทดสอบระบบ (KU CSC TEST)',
    name_en: 'Certificate of System Verification 2026',
    description: 'เอกสารทดสอบการทำงานของระบบแอดมิน',
    price: 75,
    processing_days: 1,
    format: 'both',
    allowed_statuses: ['S', 'D', 'G'],
  };
  const createDocRes = await fetch('http://localhost:5050/api/admin/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken,
    },
    body: JSON.stringify(newDocPayload),
  });
  const createDocData = await createDocRes.json();
  if (!createDocData.success) {
    throw new Error('Create document failed: ' + createDocData.message);
  }
  testDocId = createDocData.data.id;
  console.log(`  ✅ 2.2 สร้างเอกสารใหม่สำเร็จ: ID=${testDocId}, Code=${createDocData.data.code}, Price=฿${createDocData.data.price}`);

  // 2.3 อัปเดต/แก้ไขเอกสารเดิม
  const updateDocPayload = {
    ...newDocPayload,
    id: testDocId,
    name_th: 'หนังสือรับรองผลการทดสอบระบบ (KU CSC TEST - ปรับปรุง)',
    price: 85,
    processing_days: 2,
  };
  const updateDocRes = await fetch('http://localhost:5050/api/admin/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken,
    },
    body: JSON.stringify(updateDocPayload),
  });
  const updateDocData = await updateDocRes.json();
  if (!updateDocData.success || parseFloat(updateDocData.data.price) !== 85) {
    throw new Error('Update document failed: ' + JSON.stringify(updateDocData));
  }
  console.log(`  ✅ 2.3 แก้ไขเอกสารสำเร็จ: ชื่อ=${updateDocData.data.name_th}, ราคาใหม่=฿${updateDocData.data.price}, SLA=${updateDocData.data.processing_days} วัน`);

  // 3. ตรวจสอบการจัดการแพ็กเกจ (Document Packages CRUD)
  console.log('\n▶ [TEST 3] ทดสอบการจัดการแพ็กเกจเอกสาร (Packages CRUD)...');
  
  // 3.1 สร้างแพ็กเกจใหม่
  const newPkgPayload = {
    code: 'PKG_VERIFY_2026',
    name_th: 'แพ็กเกจทดสอบระบบ Whitelist สำหรับบัณฑิตใหม่',
    description: 'แพ็กเกจรวมเอกสาร 3 ฉบับ พร้อมส่วนลดพิเศษ',
    package_price: 150,
    is_restricted_whitelist: false,
    allowed_statuses: ['G'],
  };
  const createPkgRes = await fetch('http://localhost:5050/api/admin/packages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken,
    },
    body: JSON.stringify(newPkgPayload),
  });
  const createPkgData = await createPkgRes.json();
  if (!createPkgData.success) {
    throw new Error('Create package failed: ' + createPkgData.message);
  }
  testPkgId = createPkgData.data.id;
  console.log(`  ✅ 3.1 สร้างแพ็กเกจใหม่สำเร็จ: ID=${testPkgId}, Code=${createPkgData.data.code}, Price=฿${createPkgData.data.package_price}`);

  // 3.2 อัปเดตแพ็กเกจ
  const updatePkgPayload = {
    ...newPkgPayload,
    id: testPkgId,
    name_th: 'แพ็กเกจทดสอบระบบ Whitelist สำหรับบัณฑิตใหม่ (จำกัดสิทธิ์)',
    package_price: 180,
    is_restricted_whitelist: true,
  };
  const updatePkgRes = await fetch('http://localhost:5050/api/admin/packages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken,
    },
    body: JSON.stringify(updatePkgPayload),
  });
  const updatePkgData = await updatePkgRes.json();
  if (!updatePkgData.success || parseFloat(updatePkgData.data.package_price) !== 180) {
    throw new Error('Update package failed: ' + JSON.stringify(updatePkgData));
  }
  console.log(`  ✅ 3.2 อัปเดตแพ็กเกจสำเร็จ: ราคาใหม่=฿${updatePkgData.data.package_price}, Restricted Whitelist=${updatePkgData.data.is_restricted_whitelist}`);

  // 4. ตรวจสอบระบบนำเข้า Excel Whitelist
  console.log('\n▶ [TEST 4] ทดสอบระบบนำเข้ารายชื่อ Whitelist จากไฟล์ Excel...');

  // 4.1 สร้างไฟล์ Excel จำลองในหน่วยความจำ
  const wsData = [
    ['ลำดับ', 'รหัสนิสิต', 'ชื่อ-นามสกุล', 'สาขาวิชา'],
    [1, '6540201111', 'นายสมชาย มุ่งมั่น', 'วิศวกรรมคอมพิวเตอร์'],
    [2, '6540202222', 'นางสาวสมหญิง จริงใจ', 'การบัญชี'],
    [3, '6540203333', 'นายอานนท์ พัฒนา', 'พืชศาสตร์'],
  ];
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, 'Whitelist');
  const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // 4.2 อัปโหลดไปยัง API
  const formData = new FormData();
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  formData.append('file', blob, 'whitelist_test.xlsx');

  const uploadRes = await fetch(`http://localhost:5050/api/admin/packages/${testPkgId}/upload-whitelist`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + adminToken,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.success || uploadData.count !== 3) {
    throw new Error('Upload whitelist failed: ' + JSON.stringify(uploadData));
  }
  console.log(`  ✅ 4.1 อัปโหลดและประมวลผล Excel สำเร็จ: นำเข้ารายชื่อนิสิตได้ทั้งหมด ${uploadData.count} คน`);

  // 4.3 ตรวจสอบรายชื่อ Whitelist ที่บันทึกในฐานข้อมูล
  const getWlRes = await fetch(`http://localhost:5050/api/admin/packages/${testPkgId}/whitelist`, {
    headers: { 'Authorization': 'Bearer ' + adminToken },
  });
  const getWlData = await getWlRes.json();
  if (!getWlData.success || getWlData.data.length !== 3) {
    throw new Error('Get whitelist failed: ' + JSON.stringify(getWlData));
  }
  console.log(`  ✅ 4.2 ตรวจสอบ Whitelist ในตาราง package_whitelist สำเร็จ: พบ ${getWlData.data.length} รายการ`);
  getWlData.data.forEach((member: any) => {
    console.log(`      - รหัส: ${member.student_id} | ${member.full_name}`);
  });

  // 5. ตรวจสอบการจัดการเจ้าหน้าที่ (Staff Management)
  console.log('\n▶ [TEST 5] ทดสอบการจัดการสิทธิ์เจ้าหน้าที่ (Staff Management)...');
  
  // 5.1 เรียกดูรายชื่อเจ้าหน้าที่
  const staffRes = await fetch('http://localhost:5050/api/admin/staff', {
    headers: { 'Authorization': 'Bearer ' + adminToken },
  });
  const staffData = await staffRes.json();
  console.log(`  ✅ 5.1 ดึงรายชื่อเจ้าหน้าที่สำเร็จ: ปัจจุบันมี ${staffData.data.length} ท่าน`);

  // 5.2 มอบหมายสิทธิ์เจ้าหน้าที่ใหม่
  const newStaffPayload = {
    username: 'staff.autotest',
    first_name_th: 'คุณธนภัทร',
    last_name_th: 'เจ้าหน้าที่เคาน์เตอร์ทดสอบ',
    phone_number: '081-234-5678',
    role: 'staff',
  };
  const addStaffRes = await fetch('http://localhost:5050/api/admin/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken,
    },
    body: JSON.stringify(newStaffPayload),
  });
  const addStaffData = await addStaffRes.json();
  if (!addStaffData.success || addStaffData.data.role !== 'staff') {
    throw new Error('Add staff failed: ' + JSON.stringify(addStaffData));
  }
  console.log(`  ✅ 5.2 มอบหมายสิทธิ์เจ้าหน้าที่สำเร็จ: บัญชี=${addStaffData.data.username}, ชื่อ=${addStaffData.data.first_name_th} ${addStaffData.data.last_name_th}, Role=${addStaffData.data.role}`);

  // 6. ทำความสะอาดข้อมูลทดสอบ (Cleanup Test Data)
  console.log('\n▶ [CLEANUP] ทำความสะอาดข้อมูลทดสอบใน PostgreSQL...');
  await db.query('DELETE FROM package_whitelist WHERE package_id = $1', [testPkgId]);
  await db.query('DELETE FROM document_packages WHERE id = $1', [testPkgId]);
  await db.query('DELETE FROM document_types WHERE id = $1', [testDocId]);
  await db.query('DELETE FROM users WHERE username = $1', ['staff.autotest']);
  console.log('  ✅ ลบข้อมูลทดสอบเรียบร้อย ฐานข้อมูลสะอาดสมบูรณ์');

  console.log('\n====================================================');
  console.log('🎉 ผลการตรวจสอบ: ฟังก์ชันผู้ดูแลระบบ (Admin) ผ่าน 100%');
  console.log('====================================================\n');
  process.exit(0);
}

runAdminVerification().catch((err) => {
  console.error('\n❌ เกิดข้อผิดพลาดในการตรวจสอบ:', err);
  process.exit(1);
});
