import { db } from './db.js';

export async function initAnnouncements() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(300) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        summary TEXT,
        content TEXT,
        badge_text VARCHAR(100),
        image_url VARCHAR(500),
        external_link VARCHAR(500),
        is_pinned BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        view_count INT DEFAULT 0,
        publish_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countRes = await db.query('SELECT COUNT(*) FROM announcements');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial announcements...');
      const seedData = [
        {
          title: 'ประกาศกำหนดการยื่นขอสำเร็จการศึกษาและขอเอกสารสำคัญ ภาคเรียนที่ 1 ปีการศึกษา 2569',
          category: 'urgent',
          badge_text: '🔥 ประกาศด่วน / สำเร็จการศึกษา',
          summary: 'ขอให้นิสิตชั้นปีสุดท้ายตรวจสอบรายวิชาคงเหลือ และยื่นคำร้องขอใบรับรองสำเร็จการศึกษาและ Transcript ล่วงหน้าตามปฏิทินการศึกษา',
          content: `งานบริการการศึกษา มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร ขอแจ้งกำหนดการสำคัญสำหรับนิสิตระดับปริญญาตรีและบัณฑิตศึกษา ดังนี้:

1. **ระยะเวลายื่นคำร้องขอสำเร็จการศึกษา:** ตั้งแต่วันที่ 1 - 30 กันยายน 2569 ผ่านระบบออนไลน์ e-Doc
2. **เอกสารที่ต้องจัดเตรียม:** ตรวจสอบความถูกต้องของชื่อ-นามสกุลภาษาไทยและภาษาอังกฤษในระบบ KU All-login ให้ตรงกับบัตรประจำตัวประชาชน
3. **การชำระเงิน:** สามารถเลือกชำระเงินแบบเหมาจ่ายด้วย "ชุดแพ็กเกจผู้สำเร็จการศึกษา (Graduation Bundle)" ในราคาพิเศษ 160 บาท จากราคาปกติ 220 บาท
4. **ช่องทางรับเอกสาร:** สามารถเลือกรับด้วยตนเอง ณ อาคาร 14 (บริหาร) หรือเลือกจัดส่งทางไปรษณีย์ด่วนพิเศษ (EMS) ส่งตรงถึงบ้าน

หากมีข้อสงสัย ติดต่อสอบถามได้ที่ งานบริการการศึกษา โทร. 042-725-000 หรืออีเมล csc_service@ku.th`,
          is_pinned: true,
          publish_date: '2026-09-05',
        },
        {
          title: 'เปิดให้บริการขอใบรายงานผลการศึกษาดิจิทัล (e-Transcript) พร้อมลายมือชื่ออิเล็กทรอนิกส์มาตรฐานสากล',
          category: 'guide',
          badge_text: '💡 บริการดิจิทัล e-Doc',
          summary: 'นิสิตและผู้สำเร็จการศึกษาสามารถยื่นขอไฟล์ PDF e-Transcript ที่มี Digital Signature รองรับการสมัครงานและศึกษาต่อได้ทันที',
          content: `มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร เพิ่มความสะดวกรวดเร็วในการขอเอกสารทางการศึกษาด้วยระบบ e-Document:

- **มาตรฐานความปลอดภัย:** ไฟล์ PDF แนบลายมือชื่อดิจิทัล (Digital Signature) ตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ ตรวจสอบความถูกต้องได้ 100%
- **ระยะเวลาดำเนินการ:** จัดทำและส่งลิงก์ดาวน์โหลดเข้าสู่อีเมลของนิสิตภายใน 1 วันทำการหลังจากยืนยันการชำระเงิน
- **การนำไปใช้งาน:** สามารถใช้แนบยื่นสมัครงาน สมัครทุนการศึกษา หรือสมัครศึกษาต่อในระดับบัณฑิตศึกษาทั้งในและต่างประเทศได้ทันทีโดยไม่ต้องพิมพ์ลงกระดาษ`,
          is_pinned: false,
          publish_date: '2026-09-04',
        },
        {
          title: 'แจ้งรอบเวลาการจัดส่งเอกสารทางไปรษณีย์ด่วนพิเศษ (EMS) ประจำวันทำการ ตัดรอบเวลา 14.00 น.',
          category: 'general',
          badge_text: '📮 ข้อมูลการจัดส่ง',
          summary: 'สำหรับผู้ที่เลือกรับเอกสารทางไปรษณีย์ EMS ระบบจะจัดส่งทุกวันจันทร์ - ศุกร์ พร้อมส่งหมายเลข Tracking ติดตามพัสดุ',
          content: `งานบริการการศึกษา มก.ฉกส. ขอแจ้งรายละเอียดการจัดส่งเอกสารทางไปรษณีย์ด่วนพิเศษ (EMS):

- **รอบการจัดส่ง:** จัดส่งทุกวันทำการ (จันทร์ - ศุกร์) ยกเว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์
- **เวลาตัดรอบ:** เวลา 14.00 น. ของแต่ละวัน คำร้องที่ผ่านการอนุมัติหลังเวลาตัดรอบจะจัดส่งในรอบวันทำการถัดไป
- **การติดตามสถานะพัสดุ:** เมื่อส่งมอบพัสดุให้แก่ไปรษณีย์ไทยแล้ว เจ้าหน้าที่จะบันทึกหมายเลข EMS Tracking เข้าระบบ edoc ทันที นิสิตสามารถตรวจสอบได้ที่เมนู "ติดตามสถานะคำร้อง"`,
          is_pinned: false,
          publish_date: '2026-09-02',
        },
        {
          title: 'แนะนำการชำระเงินผ่าน Thai QR Payment ทุกธนาคาร ตรวจสอบยอดและออกใบเสร็จรับเงินทันที 24 ชม.',
          category: 'academic',
          badge_text: '💳 การเงิน & ใบเสร็จ',
          summary: 'ลดขั้นตอนการส่งสลิป ระบบตัดยอดเงินอัตโนมัติผ่าน QR Code พร้อมพิมพ์ใบเสร็จรับเงินอิเล็กทรอนิกส์ได้ทันที',
          content: `ระบบ KU CSC e-Doc เชื่อมโยงระบบ Thai QR Payment (พร้อมเพย์) เพื่ออำนวยความสะดวกแก่นิสิต:

- สแกนจ่ายได้ทุกแอปพลิเคชัน Mobile Banking ทั่วประเทศ ไม่มีค่าธรรมเนียม
- ยอดเงินอัปเดตแบบเรียลไทม์ คำร้องเปลี่ยนสถานะเป็น "ชำระเงินแล้ว" ทันที ไม่ต้องรอตรวจสอบสลิป
- นิสิตสามารถกดพิมพ์หรือบันทึก "ใบเสร็จรับเงินภาษาไทย" ฉบับจริงได้ทันทีหลังจากชำระเงินเรียบร้อยแล้ว`,
          is_pinned: false,
          publish_date: '2026-08-28',
        },
        {
          title: 'เวลาเปิดทำการเคาน์เตอร์บริการการศึกษา ณ อาคารบริหาร มก.ฉกส. ในช่วงภาคการศึกษา 1/2569',
          category: 'general',
          badge_text: '🏛️ เคาน์เตอร์บริการ',
          summary: 'เปิดให้บริการวันจันทร์ - ศุกร์ เวลา 08.30 - 16.30 น. (ไม่ปิดพักเที่ยง) พร้อมจุดบริการตรวจสอบสิทธิ์อัตโนมัติ',
          content: `จุดบริการเคาน์เตอร์งานบริการการศึกษา (Service Desk) อาคาร 14 ชั้น 1 มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร:

- **เวลาทำการ:** วันจันทร์ - วันศุกร์ เวลา 08.30 - 16.30 น.
- **บริการพักเที่ยง:** เปิดให้บริการต่อเนื่องตลอดช่วงพักเที่ยง (12.00 - 13.00 น.)
- **การติดต่อรับเอกสาร:** กรุณานำบัตรประจำตัวประชาชน หรือบัตรประจำตัวนิสิตมาแสดงต่อเจ้าหน้าที่เพื่อรับเอกสารฉบับจริง`,
          is_pinned: false,
          publish_date: '2026-08-20',
        },
      ];

      for (const item of seedData) {
        await db.query(
          `INSERT INTO announcements (title, category, badge_text, summary, content, is_pinned, publish_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.title, item.category, item.badge_text, item.summary, item.content, item.is_pinned, item.publish_date]
        );
      }
      console.log('Seeded announcements successfully!');
    }
  } catch (err: any) {
    console.error('Failed to init announcements:', err.message);
  }
}

if (process.argv[1]?.endsWith('init_announcements.ts')) {
  initAnnouncements().then(() => {
    console.log('Done');
    process.exit(0);
  });
}
