import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { config } from '../config/index.js';

export class PromptPayService {
  /**
   * สร้าง PromptPay Dynamic QR Payload พร้อมแปลงเป็น DataURL (Base64 Image)
   * @param amount ยอดเงินที่ต้องชำระ (บาท)
   * @param orderNo รหัสคำสั่งซื้ออ้างอิง
   */
  static async generatePromptPayQr(amount: number, orderNo: string): Promise<{ payload: string; qrDataUrl: string; expiredAt: Date }> {
    // กำหนดเวลาหมดอายุของ QR (15 นาที)
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // สร้าง EMVCo Payload
    const payload = (generatePayload as any)(config.promptpay.accountNumber, { amount });
    
    // แปลง Payload เป็น Base64 QR Image (สีเขียวนนทรี สวยงาม)
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#004d26', // เขียวเข้มเกษตรศาสตร์
        light: '#ffffff',
      },
    });

    return {
      payload,
      qrDataUrl,
      expiredAt,
    };
  }

  /**
   * แปลงจำนวนเงินตัวเลขเป็นข้อความภาษาไทย (เช่น 150.00 -> หนึ่งร้อยห้าสิบบาทถ้วน)
   * สำหรับใช้ในการออกใบเสร็จรับเงิน
   */
  static thaiBahtText(amount: number): string {
    const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    
    if (isNaN(amount) || amount === 0) return 'ศูนย์บาทถ้วน';

    const [integerPart, decimalPart = '00'] = amount.toFixed(2).split('.');
    
    function convertGroup(numStr: string): string {
      let result = '';
      const len = numStr.length;
      for (let i = 0; i < len; i++) {
        const digit = parseInt(numStr[i], 10);
        const unit = units[len - i - 1];
        if (digit !== 0) {
          if (unit === 'สิบ' && digit === 1) {
            result += 'สิบ';
          } else if (unit === 'สิบ' && digit === 2) {
            result += 'ยี่สิบ';
          } else if (unit === '' && digit === 1 && len > 1 && numStr[len - 2] !== '0') {
            result += 'เอ็ด';
          } else {
            result += numbers[digit] + unit;
          }
        }
      }
      return result;
    }

    let text = convertGroup(integerPart) + 'บาท';
    const dec = parseInt(decimalPart, 10);
    if (dec === 0) {
      text += 'ถ้วน';
    } else {
      text += convertGroup(decimalPart) + 'สตางค์';
    }

    return text;
  }
}
