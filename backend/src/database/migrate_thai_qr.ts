import { pool } from './db.js';

export async function migrateThaiQr() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Thai QR & REF2 schema migration...');

    // 1. biller_configs
    await client.query(`
      CREATE TABLE IF NOT EXISTS biller_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        biller_id VARCHAR(50) NOT NULL UNIQUE,
        merchant_name VARCHAR(150) NOT NULL,
        service_name_th VARCHAR(200) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ biller_configs table checked/created');

    // 2. payment_types
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ payment_types table checked/created');

    // 3. payment_categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ payment_categories table checked/created');

    // 4. credit_limits
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ credit_limits table checked/created');

    // 5. ref2_configs
    await client.query(`
      CREATE TABLE IF NOT EXISTS ref2_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ref2_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category_id UUID REFERENCES payment_categories(id) ON DELETE SET NULL,
        credit_limit_id UUID REFERENCES credit_limits(id) ON DELETE SET NULL,
        payment_type_id UUID REFERENCES payment_types(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ ref2_configs table checked/created');

    // 6. Alter document_types & document_packages & payments
    await client.query(`
      ALTER TABLE document_types ADD COLUMN IF NOT EXISTS ref2_code VARCHAR(50) DEFAULT '300';
      ALTER TABLE document_packages ADD COLUMN IF NOT EXISTS ref2_code VARCHAR(50) DEFAULT '300';
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS biller_id VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS ref1 VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS ref2 VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_id VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_transaction_id VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_confirmed_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_notification JSONB;

      ALTER TABLE biller_configs
      ADD COLUMN IF NOT EXISTS use_central_service BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS soap_url VARCHAR(255) DEFAULT 'https://fin.ku.th/qr/service',
      ADD COLUMN IF NOT EXISTS biller_suffix VARCHAR(10) DEFAULT '01',
      ADD COLUMN IF NOT EXISTS app_code VARCHAR(10) DEFAULT '06',
      ADD COLUMN IF NOT EXISTS callback_url VARCHAR(255) DEFAULT 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback';
    `);
    console.log('✅ Altered existing tables (ref2_code in docs/pkgs, biller_id/ref1/ref2 in payments, central QR columns)');

    // 7. Seed/Update Active Biller Config
    await client.query(`UPDATE biller_configs SET is_active = false;`);
    await client.query(`
      INSERT INTO biller_configs (biller_id, merchant_name, service_name_th, is_active)
      VALUES ('099400063727601', 'KASETSART UNIVERSITY CSC', 'มหาวิทยาลัยเกษตรศาสตร์ ว.เฉลิมพระเกียรติฯ', true)
      ON CONFLICT (biller_id) DO UPDATE SET
        merchant_name = EXCLUDED.merchant_name,
        service_name_th = EXCLUDED.service_name_th,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP;
    `);
    console.log('✅ Seeded/Updated active biller config to 099400063727601');

    // 8. Seed Payment Categories
    const categoriesData = [
      { code: 'EDU_FEE', name: 'ค่าธรรมเนียมการศึกษา' },
      { code: 'ACAD_DEV', name: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ' },
      { code: 'ADMISSION', name: 'ค่าสมัคร ค่ารักษาสิทธิ์' },
      { code: 'DORM', name: 'ค่าหอพัก' },
    ];
    for (const cat of categoriesData) {
      await client.query(`
        INSERT INTO payment_categories (code, name)
        VALUES ($1, $2)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
      `, [cat.code, cat.name]).catch(async () => {
        // Fallback if name has unique conflict
        await client.query(`UPDATE payment_categories SET code = $1 WHERE name = $2`, [cat.code, cat.name]);
      });
    }
    console.log('✅ Seeded payment categories');

    // 9. Seed Payment Types (map_App code)
    const typesData = [
      { code: '06', name: 'ค่าธรรมเนียมการศึกษา', description: 'ค่าธรรมเนียมการศึกษาและเอกสารสำคัญ' },
      { code: '01', name: 'ค่าสมัคร', description: 'ค่าสมัครสอบ ค่าสมัครนิสิตใหม่ ค่าสมัครงาน' },
      { code: '02', name: 'ค่าธรรมเนียมพัฒนาวิชาการ', description: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ' },
      { code: '07', name: 'ค่ารักษาสถานภาพ', description: 'ค่ารักษาสถานภาพนิสิต' },
    ];
    for (const t of typesData) {
      await client.query(`
        INSERT INTO payment_types (code, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
      `, [t.code, t.name, t.description]);
    }
    console.log('✅ Seeded payment types');

    // 10. Seed Credit Limits (วงเงิน)
    const limitsData = [
      { code: '1', name: 'วงเงินปกติ (ระดับ 1)' },
      { code: '3', name: 'วงเงินภาคพิเศษ (ระดับ 3)' },
    ];
    for (const l of limitsData) {
      await client.query(`
        INSERT INTO credit_limits (code, name)
        VALUES ($1, $2)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
      `, [l.code, l.name]);
    }
    console.log('✅ Seeded credit limits');

    // 11. Seed REF2 Mappings (36 items from the user uploaded table)
    const ref2Items = [
      { code: '271', name: 'ค่าธรรมเนียมการศึกษา ป.โท ภาคพิเศษ', cat: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ', limit: '3', type: '02' },
      { code: '371', name: 'ค่าธรรมเนียมการศึกษา MBA', cat: 'ค่าธรรมเนียมการศึกษา', limit: '3', type: '02' },
      { code: '471', name: 'ค่าธรรมเนียมการศึกษา ป.โท ภาคพิเศษ', cat: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ', limit: '3', type: '02' },
      { code: '100', name: 'ค่าธรรมเนียมการศึกษา', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '02' },
      { code: '200', name: 'ค่ารักษาสถานภาพนิสิต', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '07' },
      { code: '2000', name: 'ค่าสมัครนิสิตใหม่ ป.โท ภาคพิเศษ', cat: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ', limit: '3', type: '01' },
      { code: '2100', name: 'ค่าธรรมเนียมการศึกษา ป.โท ภาคพิเศษ', cat: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ', limit: '1', type: '02' },
      { code: '300', name: 'ค่าเอกสารสำคัญทางการศึกษา', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '301', name: 'ค่าธรรมเนียมขอจบล่าช้า', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '302', name: 'ค่าเปลี่ยนแปลงรายวิชา', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '303', name: 'ค่าธรรมเนียมขอคืนสภาพนิสิต', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '305', name: 'ค่ารักษาสถานภาพนิสิต', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '306', name: 'ค่าย้ายคณะ หลักสูตร', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '307', name: 'ค่าสอบชดใช้', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '308', name: 'ค่าเทียบรายวิชา', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '309', name: 'ค่าจัดส่งปริญญาบัตรรวมปกปริญญา', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '310', name: 'ค่าเปลี่ยนแปลงรายวิชาล่าช้า', cat: 'ค่าธรรมเนียมการศึกษา', limit: '1', type: '06' },
      { code: '500', name: 'ค่าหอพัก', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '501', name: 'ค่าหอพักและสาธารณูปโภค(บุคลากร)', cat: 'ค่าหอพัก', limit: null, type: null },
      { code: '600', name: 'ค่ารักษาสิทธิ์ + ค่าหอพัก ป.ตรี ภาคปกติ', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: '1', type: '06' },
      { code: '601', name: 'ค่าสมัครนิสิตใหม่ ป.ตรี ภาคปกติ', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: '1', type: '01' },
      { code: '6010471', name: 'ค่าสมัครป.โทพิเศษสาขาฯ', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: '3', type: '01' },
      { code: '70154', name: 'ค่าสมัครนิสิตใหม่ภาคพิเศษ (สาขาสารสนเทศ)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: '1', type: '01' },
      { code: '70156', name: 'ค่าสมัครนิสิตใหม่ภาคพิเศษ (สาขาไฟฟ้า)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: '1', type: '01' },
      { code: '70157', name: 'ค่าสมัครนิสิตใหม่ภาคพิเศษ (สาขาโยธา)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: '1', type: '01' },
      { code: '702', name: 'โครงการปรับพื้นฐาน ป.โท', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '70254', name: 'ค่ารักษาสิทธิ์นิสิตใหม่ภาคพิเศษ (สาขาสารสนเทศ)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '70256', name: 'ค่ารักษาสิทธิ์นิสิตใหม่ภาคพิเศษ (สาขาไฟฟ้า)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '70257', name: 'ค่ารักษาสิทธิ์นิสิตใหม่ภาคพิเศษ (สาขาโยธา)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '800', name: 'ค่าสมัครงาน', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '801', name: 'ค่าสมัครนิสิตใหม่ภาคพิเศษ (คณะสาธาฯ)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: '802', name: 'ค่ารักษาสิทธิ์นิสิตใหม่ภาคพิเศษ (คณะสาธาฯ)', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: 'C3100/00564/61', name: 'โครงการปรับพื้นฐาน ป.ตรี ปีการศึกษา 2561', cat: 'ค่าสมัคร ค่ารักษาสิทธิ์', limit: null, type: null },
      { code: 'C3100/00612/62', name: 'โครงการปรับพื้นฐาน ป.ตรี ปีการศึกษา 2562', cat: 'ค่าธรรมเนียมการศึกษา', limit: null, type: null },
      { code: 'c0000/00023/62', name: 'ประชุมวิชาการเกษตรแฟร์', cat: 'ค่าธรรมเนียมการศึกษา', limit: null, type: null },
      { code: 'c0403/00938/63', name: 'พัฒนาวิชาการสัมผัสอาหาร', cat: 'ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ', limit: null, type: null },
    ];

    // Fetch category, limit, and type lookup maps
    const catRows = await client.query('SELECT id, name FROM payment_categories');
    const catMap = new Map(catRows.rows.map((r: any) => [r.name, r.id]));

    const limitRows = await client.query('SELECT id, code FROM credit_limits');
    const limitMap = new Map(limitRows.rows.map((r: any) => [r.code, r.id]));

    const typeRows = await client.query('SELECT id, code FROM payment_types');
    const typeMap = new Map(typeRows.rows.map((r: any) => [r.code, r.id]));

    for (const item of ref2Items) {
      const categoryId = item.cat ? catMap.get(item.cat) || null : null;
      const creditLimitId = item.limit ? limitMap.get(item.limit) || null : null;
      const paymentTypeId = item.type ? typeMap.get(item.type) || null : null;

      await client.query(`
        INSERT INTO ref2_configs (ref2_code, name, category_id, credit_limit_id, payment_type_id, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (ref2_code) DO UPDATE SET
          name = EXCLUDED.name,
          category_id = EXCLUDED.category_id,
          credit_limit_id = EXCLUDED.credit_limit_id,
          payment_type_id = EXCLUDED.payment_type_id,
          updated_at = CURRENT_TIMESTAMP;
      `, [item.code, item.name, categoryId, creditLimitId, paymentTypeId]);
    }

    console.log(`✅ Seeded/Updated ${ref2Items.length} REF2 configurations`);
    console.log('🎉 Thai QR & REF2 database migration completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// If executed directly
if (process.argv[1]?.includes('migrate_thai_qr')) {
  migrateThaiQr()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
