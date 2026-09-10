import * as xlsx from 'xlsx';

export interface WhitelistItem {
  student_id: string;
  full_name?: string;
  remark?: string;
}

export class ExcelService {
  /**
   * อ่านข้อมูลรหัสนิสิตจากไฟล์ Excel Buffer
   */
  static parseWhitelistFile(buffer: Buffer): WhitelistItem[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // แปลง sheet เป็น json
    const rawRows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });
    if (!rawRows || rawRows.length === 0) return [];

    const results: WhitelistItem[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      // ค้นหาคอลัมน์ที่มีลักษณะเป็นรหัสนิสิต (ตัวเลข 10 หลัก)
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (/^\d{10}$/.test(val)) {
          if (!seenIds.has(val)) {
            seenIds.add(val);
            const nameVal = row[c + 1] ? String(row[c + 1]).trim() : undefined;
            results.push({
              student_id: val,
              full_name: nameVal,
            });
          }
          break;
        }
      }
    }

    return results;
  }
}
