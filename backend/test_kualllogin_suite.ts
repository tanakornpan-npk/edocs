import { KuAllLoginService } from './src/services/kuAllLogin.service.js';

async function runKuAllLoginVerification() {
  console.log('================================================================');
  console.log('🔐 เริ่มการตรวจสอบระบบยืนยันตัวตน KU All-login (OAuth 2.0 PKCE)');
  console.log('================================================================\n');

  // TEST 1: ทดสอบการสร้าง Authorize URL พร้อม PKCE S256
  console.log('▶ [TEST 1] ทดสอบการเรียก GET /api/auth/ku (Authorize Endpoint)...');
  const authRes = await fetch('http://localhost:5050/api/auth/ku', {
    redirect: 'manual',
  });

  if (authRes.status !== 302) {
    throw new Error(`Expected HTTP 302 Redirect, got status: ${authRes.status}`);
  }

  const location = authRes.headers.get('location') || '';
  console.log('  ✅ 1.1 ได้รับ HTTP 302 Redirect ไปยัง Keycloak สำเร็จ');
  console.log('      Location:', location);

  const parsedUrl = new URL(location);
  if (!parsedUrl.origin.includes('alllogin.ku.ac.th')) {
    throw new Error(`Invalid Keycloak Host: ${parsedUrl.origin}`);
  }
  console.log('  ✅ 1.2 ยืนยันปลายทางเป็นเซิร์ฟเวอร์จริง: alllogin.ku.ac.th');

  const params = parsedUrl.searchParams;
  const checks = [
    { key: 'response_type', expected: 'code' },
    { key: 'client_id', expected: 'KU_CSC_MIS' },
    { key: 'code_challenge_method', expected: 'S256' },
  ];

  for (const check of checks) {
    const val = params.get(check.key);
    if (val !== check.expected) {
      throw new Error(`Param [${check.key}] expected '${check.expected}', got '${val}'`);
    }
  }
  console.log('  ✅ 1.3 พารามิเตอร์ OAuth ถูกต้องครบถ้วน: response_type=code, client_id, method=S256');

  const state = params.get('state');
  const challenge = params.get('code_challenge');
  if (!state || state.length < 32) {
    throw new Error(`Invalid state generated: ${state}`);
  }
  if (!challenge || challenge.length < 43) {
    throw new Error(`Invalid code_challenge generated: ${challenge}`);
  }
  console.log(`  ✅ 1.4 PKCE Hash สำเร็จ: State (${state.length} chars), Challenge (${challenge.length} chars)`);

  // TEST 2: ทดสอบการป้องกันความปลอดภัยเมื่อส่ง State ผิดหรือหมดอายุ
  console.log('\n▶ [TEST 2] ทดสอบการป้องกัน Callback เมื่อส่ง State ผิด (State Validation)...');
  const fakeCallbackRes = await fetch('http://localhost:5050/api/auth/ku/callback?code=fake_code&state=fake_state');
  const fakeCallbackBody = await fakeCallbackRes.text();
  
  if (fakeCallbackRes.status === 500 && fakeCallbackBody.includes('Invalid or expired OAuth state')) {
    console.log('  ✅ 2.1 ป้องกัน State ปลอมสำเร็จ: ระบบปฏิเสธพร้อมแจ้ง Invalid or expired OAuth state');
  } else {
    throw new Error('State validation failed to catch invalid state!');
  }

  // TEST 3: ทดสอบกรณีผู้ใช้ยกเลิกการเข้าสู่ระบบที่ Keycloak (OAuth Error Handling)
  console.log('\n▶ [TEST 3] ทดสอบกรณีผู้ใช้กดยกเลิกที่หน้า Keycloak (Error Callback)...');
  const errorCallbackRes = await fetch('http://localhost:5050/api/auth/ku/callback?error=access_denied&error_description=User%20cancelled%20login');
  const errorCallbackBody = await errorCallbackRes.text();

  if (errorCallbackRes.status === 400 && errorCallbackBody.includes('เข้าสู่ระบบไม่สำเร็จ')) {
    console.log('  ✅ 3.1 ดักจับ Error Callback สำเร็จ พร้อมแสดงข้อความภาษาไทยเข้าใจง่าย');
  } else {
    throw new Error('Error callback handling failed!');
  }

  // TEST 4: ทดสอบวงจรชีวิตของ PKCE State & Verifier ในหน่วยความจำ (Memory State Lifecycle)
  console.log('\n▶ [TEST 4] ทดสอบการสร้างและสกัด State & Verifier (PKCE Lifecycle)...');
  const testAuthorizeUrl = KuAllLoginService.getAuthorizeUrl('http://localhost:3000/custom-return');
  const testUrl = new URL(testAuthorizeUrl);
  const testState = testUrl.searchParams.get('state')!;
  
  const consumed = KuAllLoginService.consumeState(testState);
  if (consumed.verifier && consumed.verifier.length >= 43 && consumed.returnUrl === 'http://localhost:3000/custom-return') {
    console.log('  ✅ 4.1 ดึง Verifier และ ReturnURL ได้ถูกต้อง: Verifier Length =', consumed.verifier.length);
  } else {
    throw new Error('Consumed state data mismatch!');
  }

  // ทดสอบการเรียกซ้ำ State เดิม (ต้องไม่สามารถ Replay Attack ได้)
  try {
    KuAllLoginService.consumeState(testState);
    throw new Error('Replay Attack vulnerability: Same state consumed twice!');
  } catch (err: any) {
    if (err.message.includes('Invalid or expired OAuth state')) {
      console.log('  ✅ 4.2 ป้องกัน Replay Attack สำเร็จ: State ถูกลบทันทีหลังการใช้งานครั้งแรก (Single-use)');
    } else {
      throw err;
    }
  }

  console.log('\n================================================================');
  console.log('🎉 ผลการตรวจสอบ: ระบบยืนยันตัวตน KU All-login (PKCE) ผ่าน 100%');
  console.log('================================================================\n');
}

runKuAllLoginVerification().catch((err) => {
  console.error('\n❌ เกิดข้อผิดพลาดในการตรวจสอบ KU All-login:', err);
  process.exit(1);
});
