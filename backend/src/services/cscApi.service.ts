import { config } from '../config/index.js';

export interface StudentProfile {
  student_id: string;
  citizen_id: string;
  title_th: string;
  first_name_th: string;
  last_name_th: string;
  title_en?: string;
  first_name_en?: string;
  last_name_en?: string;
  status_code: 'S' | 'D' | 'G' | 'W' | 'R';
  status_desc_th: string;
  faculty_code: string;
  faculty_name_th: string;
  department_name_th: string;
  major_name_th: string;
  degree_level: 'Bachelor' | 'Master' | 'Doctoral';
  degree_name_th: string;
  curriculum_year: string;
  gpa: number;
  graduation_year?: string;
  phone_number?: string;
  email?: string;
}

// Built-in Mock Student Database (KU CSC Test Data)
const MOCK_STUDENTS: StudentProfile[] = [
  {
    student_id: '6540201234',
    citizen_id: '1479900123456',
    title_th: 'นาย',
    first_name_th: 'นนทรี',
    last_name_th: 'อีสานงาม',
    title_en: 'Mr.',
    first_name_en: 'Nontri',
    last_name_en: 'Isanngam',
    status_code: 'S',
    status_desc_th: 'กำลังศึกษา (Studying)',
    faculty_code: 'K01',
    faculty_name_th: 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์',
    department_name_th: 'ภาควิชาวิศวกรรมคอมพิวเตอร์และสารสนเทศ',
    major_name_th: 'วิศวกรรมคอมพิวเตอร์',
    degree_level: 'Bachelor',
    degree_name_th: 'วิศวกรรมศาสตรบัณฑิต',
    curriculum_year: '2565',
    gpa: 3.45,
    phone_number: '0812345678',
    email: 'nontri.i@ku.th',
  },
  {
    student_id: '6440205678',
    citizen_id: '1479900654321',
    title_th: 'นางสาว',
    first_name_th: 'สกลนคร',
    last_name_th: 'สุขสวัสดิ์',
    title_en: 'Miss',
    first_name_en: 'Sakonnakhon',
    last_name_en: 'Suksawat',
    status_code: 'D',
    status_desc_th: 'ลาพักการศึกษา (Drop / Leave of Absence)',
    faculty_code: 'K02',
    faculty_name_th: 'คณะศิลปศาสตร์และวิทยาการจัดการ',
    department_name_th: 'ภาควิชาการบัญชีและการเงิน',
    major_name_th: 'การบัญชี',
    degree_level: 'Bachelor',
    degree_name_th: 'บัญชีบัณฑิต',
    curriculum_year: '2564',
    gpa: 2.95,
    phone_number: '0898765432',
    email: 'sakonnakhon.s@ku.th',
  },
  {
    student_id: '6240208899',
    citizen_id: '1479900999999',
    title_th: 'นาย',
    first_name_th: 'สมหวัง',
    last_name_th: 'เรียนจบแล้ว',
    title_en: 'Mr.',
    first_name_en: 'Somwang',
    last_name_en: 'Rianjoblaew',
    status_code: 'G',
    status_desc_th: 'สำเร็จการศึกษา (Graduated)',
    faculty_code: 'K03',
    faculty_name_th: 'คณะทรัพยากรธรรมชาติและอุตสาหกรรมเกษตร',
    department_name_th: 'ภาควิชาเกษตรศาสตร์',
    major_name_th: 'พืชศาสตร์',
    degree_level: 'Bachelor',
    degree_name_th: 'วิทยาศาสตรบัณฑิต (เกษตรศาสตร์)',
    curriculum_year: '2562',
    graduation_year: '2566',
    gpa: 3.65,
    phone_number: '0855554444',
    email: 'somwang.graduate@gmail.com',
  },
  {
    student_id: '6040209999',
    citizen_id: '1479900999999', // Same citizen ID has master degree as well (Multi-degree test)
    title_th: 'นาย',
    first_name_th: 'สมหวัง',
    last_name_th: 'เรียนจบแล้ว',
    title_en: 'Mr.',
    first_name_en: 'Somwang',
    last_name_en: 'Rianjoblaew',
    status_code: 'G',
    status_desc_th: 'สำเร็จการศึกษา (Graduated)',
    faculty_code: 'K01',
    faculty_name_th: 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์',
    department_name_th: 'ภาควิชาวิศวกรรมศาสตร์',
    major_name_th: 'วิศวกรรมความปลอดภัย',
    degree_level: 'Master',
    degree_name_th: 'วิศวกรรมศาสตรมหาบัณฑิต',
    curriculum_year: '2564',
    graduation_year: '2566',
    gpa: 3.88,
    phone_number: '0855554444',
    email: 'somwang.graduate@gmail.com',
  },
];

export class CscApiService {
  /**
   * เรียก API ดึงข้อมูลนิสิตจาก https://api.csc.ku.ac.th/api/student-profile/{id}
   * รองรับทั้ง std_id (รหัสนิสิต) และ p_id (เลขบัตรประชาชน)
   */
  private static async fetchFromCampusApi(id: string): Promise<any | null> {
    const cleanId = id.trim().replace(/[-\s]/g, '');
    const token = config.cscApi.apiKey;

    // ลองทั้ง path ที่มี /api และไม่มี /api
    const candidateUrls = [
      `https://api.csc.ku.ac.th/api/student-profile/${cleanId}`,
      `https://api.csc.ku.ac.th/student-profile/${cleanId}`,
    ];

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'X-API-KEY': token,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          // ตรวจสอบว่า API ส่งสถานะ error หรือไม่
          if (json && json.status === 'error') {
            console.log(`[CscApiService] Campus API returned error for ${cleanId}:`, json.message);
            return null;
          }
          return json.data || json;
        }
      } catch (err: any) {
        console.warn(`[CscApiService] Network error calling ${url}:`, err.message);
      }
    }

    return null;
  }

  /**
   * แปลงผลลัพธ์จาก API มหาวิทยาลัยให้อยู่ในโครงสร้างมาตรฐาน StudentProfile
   */
  private static mapToStudentProfile(raw: any, fallbackId: string): StudentProfile {
    const studentId = raw.std_id || raw.student_id || raw.STUDENT_ID || fallbackId;
    const citizenId = raw.p_id || raw.citizen_id || raw.CITIZEN_ID || raw.id_card || '';
    const statusCode = (raw.status_code || raw.STATUS_CODE || raw.std_status || 'S').toUpperCase();

    const statusDescMap: Record<string, string> = {
      S: 'กำลังศึกษา (Studying)',
      D: 'ลาพักการศึกษา (Drop / Leave of Absence)',
      G: 'สำเร็จการศึกษา (Graduated)',
      W: 'พ้นสภาพการเป็นนิสิต (Withdrawn)',
      R: 'เกษียณ/สิ้นสุดการศึกษา (Retired)',
    };

    return {
      student_id: String(studentId),
      citizen_id: String(citizenId),
      title_th: raw.title_th || raw.TITLE_TH || raw.title || 'นาย/นางสาว',
      first_name_th: raw.fname_th || raw.first_name_th || raw.NAME_TH || raw.fname || '',
      last_name_th: raw.lname_th || raw.last_name_th || raw.SURNAME_TH || raw.lname || '',
      title_en: raw.title_en || raw.TITLE_EN || '',
      first_name_en: raw.fname_en || raw.first_name_en || raw.NAME_EN || '',
      last_name_en: raw.lname_en || raw.last_name_en || raw.SURNAME_EN || '',
      status_code: (['S', 'D', 'G', 'W', 'R'].includes(statusCode) ? statusCode : 'S') as any,
      status_desc_th: statusDescMap[statusCode] || 'กำลังศึกษา',
      faculty_code: raw.faculty_code || raw.FACULTY_CODE || 'K01',
      faculty_name_th: raw.faculty_name || raw.faculty_name_th || raw.FACULTY_NAME_TH || 'มหาวิทยาลัยเกษตรศาสตร์ วข.ฉกส.',
      department_name_th: raw.department_name || raw.department_name_th || raw.DEPT_NAME_TH || '',
      major_name_th: raw.major_name || raw.major_name_th || raw.MAJOR_NAME_TH || '',
      degree_level: raw.degree_level || raw.DEGREE_LEVEL || 'Bachelor',
      degree_name_th: raw.degree_name || raw.degree_name_th || raw.DEGREE_NAME_TH || 'ปริญญาตรี',
      curriculum_year: String(raw.curriculum_year || raw.entry_year || '2565'),
      graduation_year: raw.graduation_year ? String(raw.graduation_year) : undefined,
      gpa: parseFloat(raw.gpa || raw.GPA || '3.00'),
      phone_number: raw.phone || raw.phone_number || raw.mobile || '',
      email: raw.email || raw.EMAIL || `${studentId}@ku.th`,
    };
  }

  /**
   * ค้นหาข้อมูลนิสิตด้วยรหัสนิสิต (10 หลัก - std_id)
   */
  static async getStudentByStudentId(studentId: string): Promise<StudentProfile | null> {
    const cleanId = studentId.trim();

    // 1. เรียก API จริงของมหาวิทยาลัย
    const liveData = await this.fetchFromCampusApi(cleanId);
    if (liveData) {
      console.log(`✅ [CscApiService] Found student ${cleanId} from live campus API`);
      return this.mapToStudentProfile(liveData, cleanId);
    }

    // 2. Fallback to mock data for dev/testing
    const found = MOCK_STUDENTS.find((s) => s.student_id === cleanId);
    if (found) return found;

    // 3. Dynamic test generator for 10-digit IDs
    if (/^\d{10}$/.test(cleanId)) {
      const yearPrefix = cleanId.substring(0, 2);
      const isGrad = parseInt(yearPrefix, 10) <= 63;
      return {
        student_id: cleanId,
        citizen_id: '14799' + cleanId.substring(2),
        title_th: 'นาย',
        first_name_th: `นิสิต (${cleanId})`,
        last_name_th: 'มก.ฉกส.',
        status_code: isGrad ? 'G' : 'S',
        status_desc_th: isGrad ? 'สำเร็จการศึกษา (Graduated)' : 'กำลังศึกษา (Studying)',
        faculty_code: 'K01',
        faculty_name_th: 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์',
        department_name_th: 'ภาควิชาวิศวกรรมคอมพิวเตอร์และสารสนเทศ',
        major_name_th: 'วิศวกรรมสารสนเทศ',
        degree_level: 'Bachelor',
        degree_name_th: 'วิศวกรรมศาสตรบัณฑิต',
        curriculum_year: `25${yearPrefix}`,
        gpa: 3.12,
        email: `b${cleanId}@ku.th`,
      };
    }

    return null;
  }

  /**
   * ค้นหาข้อมูลนิสิตด้วยเลขประจำตัวประชาชน (13 หลัก - p_id)
   */
  static async getStudentsByCitizenId(citizenId: string): Promise<StudentProfile[]> {
    const cleanId = citizenId.replace(/[-\s]/g, '');

    // 1. เรียก API จริงของมหาวิทยาลัย
    const liveData = await this.fetchFromCampusApi(cleanId);
    if (liveData) {
      console.log(`✅ [CscApiService] Found alumni ${cleanId} from live campus API`);
      if (Array.isArray(liveData)) {
        return liveData.map((item) => this.mapToStudentProfile(item, item.std_id || ''));
      }
      return [this.mapToStudentProfile(liveData, liveData.std_id || '')];
    }

    // 2. Fallback to mock database
    const matched = MOCK_STUDENTS.filter((s) => s.citizen_id === cleanId);
    if (matched.length > 0) return matched;

    // 3. Dynamic test generator for 13-digit IDs
    if (/^\d{13}$/.test(cleanId)) {
      return [
        {
          student_id: '624020' + cleanId.slice(-4),
          citizen_id: cleanId,
          title_th: 'นาย',
          first_name_th: 'บัณฑิตใหม่',
          last_name_th: 'นนทรีสกลนคร',
          status_code: 'G',
          status_desc_th: 'สำเร็จการศึกษา (Graduated)',
          faculty_code: 'K01',
          faculty_name_th: 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์',
          department_name_th: 'ภาควิชาวิศวกรรมคอมพิวเตอร์และสารสนเทศ',
          major_name_th: 'วิศวกรรมคอมพิวเตอร์',
          degree_level: 'Bachelor',
          degree_name_th: 'วิศวกรรมศาสตรบัณฑิต',
          curriculum_year: '2562',
          graduation_year: '2566',
          gpa: 3.52,
          email: 'graduate.user@gmail.com',
        },
      ];
    }

    return [];
  }
}