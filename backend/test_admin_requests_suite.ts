import { db } from './src/database/db.js';

async function runAdminRequestsVerification() {
  console.log('================================================================');
  console.log('🔍 ตรวจสอบฟังก์ชัน Admin ดูรายชื่อผู้ส่งคำร้อง & อัปเดตสถานะเอกสาร');
  console.log('================================================================\n');

  // 1. ล็อกอินด้วยบัญชี Admin
  console.log('▶ [ขั้นตอนที่ 1] ล็อกอินเป็น Admin (admin.edoc)...');
  const adminLoginRes = await fetch('http://localhost:5050/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  });
  const adminData = await adminLoginRes.json();
  if (!adminData.success || adminData.user.role !== 'admin') {
    throw new Error('Admin login failed: ' + JSON.stringify(adminData));
  }
  const adminToken = adminData.token;
  console.log(`  ✅ ล็อกอินเป็น Admin สำเร็จ: ${adminData.user.first_name_th} (${adminData.user.username})`);

  // 2. สร้างคำร้องจำลองจากนิสิตเพื่อทดสอบกระบวนการทั้งหมด
  console.log('\n▶ [ขั้นตอนที่ 2] จำลองการส่งคำร้องขอเอกสารจากนิสิต (Postal EMS)...');
  const studentLoginRes = await fetch('http://localhost:5050/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student_s' }),
  });
  const studentData = await studentLoginRes.json();
  const studentToken = studentData.token;

  const createReqRes = await fetch('http://localhost:5050/api/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      student_id: '6540209999',
      student_name: 'นายทดสอบ คำร้องแอดมิน',
      student_status: 'S',
      faculty_name: 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์',
      department_name: 'วิศวกรรมคอมพิวเตอร์',
      delivery_method: 'postal',
      recipient_name: 'นายทดสอบ คำร้องแอดมิน',
      shipping_address: '59 หมู่ 1 ต.เชียงเครือ อ.เมือง จ.สกลนคร 47000',
      items: [
        {
          item_name: 'ใบรายงานผลการศึกษา (Transcript)',
          unit_price: 50,
          quantity: 2,
        },
      ],
    }),
  });
  const createdReqData = await createReqRes.json();
  if (!createdReqData.success) {
    throw new Error('Create request failed: ' + JSON.stringify(createdReqData));
  }
  const testOrderNo = createdReqData.order_no;
  console.log(`  ✅ ยื่นคำร้องสำเร็จ: ${testOrderNo}`);
  console.log(`     ผู้ส่งคำร้อง: นายทดสอบ คำร้องแอดมิน (6540209999)`);
  console.log(`     ช่องทางรับ: ไปรษณีย์ EMS | ยอดชำระ: ฿${createdReqData.payment.amount}`);

  // 3. Admin เรียกดูรายชื่อผู้ส่งคำร้องทั้งหมด
  console.log('\n▶ [ขั้นตอนที่ 3] Admin เรียกดูรายการคำร้องทั้งหมด (GET /api/counter/orders)...');
  const getOrdersRes = await fetch('http://localhost:5050/api/counter/orders', {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  const ordersData = await getOrdersRes.json();
  if (!ordersData.success || !Array.isArray(ordersData.data)) {
    throw new Error('Get orders failed: ' + JSON.stringify(ordersData));
  }
  console.log(`  ✅ Admin สามารถดึงรายชื่อคำร้องได้สำเร็จ: พบทั้งหมด ${ordersData.data.length} รายการ`);

  // ตรวจสอบว่าคำร้องที่เพิ่งสร้างปรากฏในรายการ
  const targetOrder = ordersData.data.find((o: any) => o.order_no === testOrderNo);
  if (!targetOrder) {
    throw new Error(`Order ${testOrderNo} not found in admin orders list!`);
  }
  console.log(`  ✅ คำร้อง ${testOrderNo} แสดงข้อมูลครบถ้วน:`);
  console.log(`     - ชื่อ-นามสกุล: ${targetOrder.student_name}`);
  console.log(`     - รหัสนิสิต: ${targetOrder.student_id} (สถานะ: ${targetOrder.student_status})`);
  console.log(`     - สถานะเริ่มต้น: ${targetOrder.status}`);
  console.log(`     - รายการเอกสาร: ${targetOrder.items.map((i: any) => i.item_name).join(', ')}`);

  // 4. Admin อัปเดตสถานะเป็น "processing" (กำลังจัดทำเอกสาร)
  console.log('\n▶ [ขั้นตอนที่ 4] Admin อัปเดตสถานะเป็น "processing" (กำลังจัดทำ)...');
  const updateProcRes = await fetch(`http://localhost:5050/api/counter/orders/${testOrderNo}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'processing' }),
  });
  const updateProcData = await updateProcRes.json();
  if (!updateProcData.success || updateProcData.data.status !== 'processing') {
    throw new Error('Update to processing failed: ' + JSON.stringify(updateProcData));
  }
  console.log(`  ✅ อัปเดตเป็น 'processing' สำเร็จ`);

  // 5. Admin อัปเดตสถานะเป็น "shipped" พร้อมระบุเลขพัสดุ EMS
  console.log('\n▶ [ขั้นตอนที่ 5] Admin อัปเดตสถานะเป็น "shipped" พร้อมใส่เลขพัสดุ EMS...');
  const testTracking = 'ED123456789TH';
  const updateShipRes = await fetch(`http://localhost:5050/api/counter/orders/${testOrderNo}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'shipped',
      postal_tracking_no: testTracking,
    }),
  });
  const updateShipData = await updateShipRes.json();
  if (!updateShipData.success || updateShipData.data.status !== 'shipped' || updateShipData.data.postal_tracking_no !== testTracking) {
    throw new Error('Update to shipped failed: ' + JSON.stringify(updateShipData));
  }
  console.log(`  ✅ อัปเดตเป็น 'shipped' สำเร็จ เลข EMS: ${updateShipData.data.postal_tracking_no}`);

  // 6. ตรวจสอบว่าฝั่งนิสิตเห็นเลข EMS และสถานะที่ Admin อัปเดตเรียลไทม์
  console.log('\n▶ [ขั้นตอนที่ 6] ตรวจสอบฝั่งนิสิต (GET /api/requests/:orderNo)...');
  const studentCheckRes = await fetch(`http://localhost:5050/api/requests/${testOrderNo}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  });
  const studentCheckData = await studentCheckRes.json();
  if (studentCheckData.data.status !== 'shipped' || studentCheckData.data.postal_tracking_no !== testTracking) {
    throw new Error('Student view does not reflect updated status or tracking no!');
  }
  console.log(`  ✅ ฝั่งนิสิตได้รับสถานะอัปเดตเรียบร้อย: สถานะ '${studentCheckData.data.status}' พัสดุ EMS '${studentCheckData.data.postal_tracking_no}'`);

  // 7. Admin ปิดงานเป็น "completed"
  console.log('\n▶ [ขั้นตอนที่ 7] Admin อัปเดตสถานะเป็น "completed" (ส่งมอบสำเร็จ)...');
  const updateCompRes = await fetch(`http://localhost:5050/api/counter/orders/${testOrderNo}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'completed' }),
  });
  const updateCompData = await updateCompRes.json();
  if (!updateCompData.success || updateCompData.data.status !== 'completed') {
    throw new Error('Update to completed failed: ' + JSON.stringify(updateCompData));
  }
  console.log(`  ✅ อัปเดตเป็น 'completed' สำเร็จ`);

  // 8. ตรวจสอบ Activity Logs ในฐานข้อมูล
  console.log('\n▶ [ขั้นตอนที่ 8] ตรวจสอบ Activity Logs ในฐานข้อมูล PostgreSQL...');
  const logsRes = await db.query(
    `SELECT * FROM activity_logs WHERE request_id = $1 ORDER BY created_at ASC`,
    [targetOrder.id]
  );
  console.log(`  ✅ พบ Activity Log ทั้งหมด ${logsRes.rows.length} รายการ:`);
  logsRes.rows.forEach((log, idx) => {
    console.log(`     ${idx + 1}. [${log.action_name}] ${log.description}`);
  });

  // 9. ทำความสะอาดข้อมูลทดสอบ
  console.log('\n▶ [ขั้นตอนที่ 9] ทำความสะอาดข้อมูลทดสอบ...');
  await db.query(`DELETE FROM activity_logs WHERE request_id = $1`, [targetOrder.id]);
  await db.query(`DELETE FROM payments WHERE request_id = $1`, [targetOrder.id]);
  await db.query(`DELETE FROM request_items WHERE request_id = $1`, [targetOrder.id]);
  await db.query(`DELETE FROM document_requests WHERE id = $1`, [targetOrder.id]);
  console.log(`  ✅ ลบคำร้องทดสอบ ${testOrderNo} เรียบร้อย ฐานข้อมูลสะอาดสมบูรณ์`);

  console.log('\n================================================================');
  console.log('🎉 การตรวจสอบระบบงาน Admin สำเร็จครบถ้วน 100% (9/9 รายการ)');
  console.log('================================================================\n');
}

runAdminRequestsVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during verification:', err);
    process.exit(1);
  });
