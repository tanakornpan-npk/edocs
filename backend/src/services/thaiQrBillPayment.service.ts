import QRCode from 'qrcode';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { KuCentralQrService } from './kuCentralQr.service.js';

export interface ThaiQrBillPaymentOptions {
  amount: number;
  ref1: string; // Typically Student ID (10 digits) or Order No
  ref2?: string; // REF2 code, e.g. '300'
  billerId?: string; // 13 - 15 digits
  merchantName?: string; // Max 25 chars
  transactionId?: string; // Unique transaction/order ID
}

export interface ThaiQrBillPaymentResult {
  payload: string;
  qrDataUrl: string;
  billerId: string;
  merchantName: string;
  serviceNameTh: string;
  ref1: string;
  ref2: string;
  amount: number;
  amountThaiText: string;
  expiredAt: Date;
  isCentralService?: boolean;
  qrId?: string;
}

export class ThaiQrBillPaymentService {
  /**
   * Helper function to format EMVCo TLV (Tag-Length-Value)
   */
  private static formatTlv(tag: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${tag}${len}${value}`;
  }

  /**
   * Standard EMVCo CRC-16 (CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflect, no final xor)
   */
  public static calculateCrc16(data: string): string {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Retrieve active Biller Configuration from database or fallback to config
   */
  public static async getActiveBillerConfig(): Promise<{
    billerId: string;
    merchantName: string;
    serviceNameTh: string;
    useCentralService?: boolean;
    soapUrl?: string;
    billerSuffix?: string;
    appCode?: string;
    callbackUrl?: string;
  }> {
    try {
      const res = await db.query(
        `SELECT biller_id, merchant_name, service_name_th, use_central_service, soap_url, biller_suffix, app_code, callback_url
         FROM biller_configs WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          billerId: row.biller_id,
          merchantName: row.merchant_name,
          serviceNameTh: row.service_name_th,
          useCentralService: !!row.use_central_service,
          soapUrl: row.soap_url || process.env.KU_QR_SOAP_URL || 'https://fin.ku.ac.th/qr/service',
          billerSuffix: row.biller_suffix || process.env.KU_QR_BILLER_SUFFIX || '01',
          appCode: row.app_code || process.env.KU_QR_APP_CODE || '06',
          callbackUrl: row.callback_url || process.env.KU_QR_CALLBACK_URL || 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback',
        };
      }
    } catch (err: any) {
      console.warn('[ThaiQR] Failed to fetch biller config from DB, using fallback:', err.message);
    }

    return {
      billerId: config.thaiQr.billerId || '099400063727601',
      merchantName: 'KASETSART UNIVERSITY CSC',
      serviceNameTh: 'มหาวิทยาลัยเกษตรศาสตร์ ว.เฉลิมพระเกียรติฯ',
      useCentralService: false,
      soapUrl: process.env.KU_QR_SOAP_URL || 'https://fin.ku.ac.th/qr/service',
      billerSuffix: process.env.KU_QR_BILLER_SUFFIX || '01',
      appCode: process.env.KU_QR_APP_CODE || '06',
      callbackUrl: process.env.KU_QR_CALLBACK_URL || 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback',
    };
  }

  /**
   * Generate official Bank of Thailand EMVCo Tag 30 Bill Payment Payload
   * Standards:
   * - Tag 00: 01 (Version)
   * - Tag 01: 12 (Dynamic QR)
   * - Tag 30: Merchant Account Information (AID: A000000677010112)
   *   - Subtag 00: A000000677010112
   *   - Subtag 01: Biller ID (13-15 chars)
   *   - Subtag 02: Ref 1 (Alphanumeric, up to 20 chars)
   *   - Subtag 03: Ref 2 (Alphanumeric, up to 20 chars, optional)
   * - Tag 53: 764 (THB)
   * - Tag 54: Amount (2 decimal places)
   * - Tag 58: TH (Country code)
   * - Tag 59: Merchant Name
   * - Tag 63: CRC-16 Checksum
   */
  public static generateTag30Payload(options: {
    billerId: string;
    ref1: string;
    ref2?: string;
    amount: number;
    merchantName?: string;
  }): string {
    const { billerId, ref1, ref2, amount, merchantName = 'KASETSART UNIV CSC' } = options;

    // Clean and validate inputs
    const cleanBillerId = billerId.replace(/[^0-9]/g, '').slice(0, 15);
    const cleanRef1 = ref1.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    const cleanRef2 = ref2 ? ref2.replace(/[^a-zA-Z0-9\/]/g, '').slice(0, 20) : '';
    const cleanMerchant = merchantName.slice(0, 25);
    const formattedAmount = Number(amount).toFixed(2);

    // Build Tag 30 Value
    let tag30Value = '';
    tag30Value += this.formatTlv('00', 'A000000677010112'); // Bill Payment AID
    tag30Value += this.formatTlv('01', cleanBillerId); // Biller ID
    tag30Value += this.formatTlv('02', cleanRef1); // Reference 1
    if (cleanRef2) {
      tag30Value += this.formatTlv('03', cleanRef2); // Reference 2
    }

    // Build Top-level EMVCo string
    let payload = '';
    payload += this.formatTlv('00', '01'); // Format Indicator
    payload += this.formatTlv('01', '12'); // Point of Initiation Method: 12 (Dynamic)
    payload += this.formatTlv('30', tag30Value); // Tag 30 Bill Payment
    payload += this.formatTlv('53', '764'); // Transaction Currency (THB)
    payload += this.formatTlv('54', formattedAmount); // Transaction Amount
    payload += this.formatTlv('58', 'TH'); // Country Code
    payload += this.formatTlv('59', cleanMerchant); // Merchant Name

    // Append Tag 63 and compute CRC16
    const payloadWithCrcTag = payload + '6304';
    const crc = this.calculateCrc16(payloadWithCrcTag);

    return payloadWithCrcTag + crc;
  }

  /**
   * Generate Full Thai QR Bill Payment result including Base64 QR Image and metadata
   */
  public static async generateBillPaymentQr(
    options: ThaiQrBillPaymentOptions
  ): Promise<ThaiQrBillPaymentResult> {
    const billerConfig = await this.getActiveBillerConfig();
    const billerId = options.billerId || billerConfig.billerId;
    const merchantName = options.merchantName || billerConfig.merchantName;
    const ref2 = options.ref2 || '300'; // Default 300: ค่าเอกสารสำคัญทางการศึกษา

    // 15-minute expiration window
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

    // If Central KU Service is active, try calling it first!
    if (billerConfig.useCentralService) {
      try {
        console.log(`[ThaiQR] Attempting KU Central QR Service (appCode=${billerConfig.appCode}, ref2=${ref2})...`);
        const centralRes = await KuCentralQrService.requestOeaQr({
          amount: options.amount,
          transactionId: options.transactionId || options.ref1,
          studentId: options.ref1,
          ref2Code: ref2,
          appCode: billerConfig.appCode,
          billerSuffix: billerConfig.billerSuffix,
          soapUrl: billerConfig.soapUrl,
          callbackUrl: billerConfig.callbackUrl,
          timeoutMs: 5000,
        });

        if (centralRes.success && centralRes.qrDataUrl) {
          console.log(`[ThaiQR] ✅ Successfully generated QR from KU Central Service (qrId: ${centralRes.qrId})`);
          return {
            payload: centralRes.rawXmlResponse || '',
            qrDataUrl: centralRes.qrDataUrl,
            billerId,
            merchantName,
            serviceNameTh: billerConfig.serviceNameTh,
            ref1: centralRes.ref1Prefix || options.ref1,
            ref2: centralRes.ref2Prefix || ref2,
            amount: options.amount,
            amountThaiText: this.thaiBahtText(options.amount),
            expiredAt,
            isCentralService: true,
            qrId: centralRes.qrId,
          };
        } else {
          console.warn(`[ThaiQR] KU Central Service returned failure: ${centralRes.error}. Falling back to Standalone EMVCo Tag 30.`);
        }
      } catch (centralErr: any) {
        console.warn(`[ThaiQR] KU Central Service exception: ${centralErr.message}. Falling back to Standalone EMVCo Tag 30.`);
      }
    }

    const payload = this.generateTag30Payload({
      billerId,
      ref1: options.ref1,
      ref2,
      amount: options.amount,
      merchantName,
    });

    // Render high quality QR code image in KU non-tri dark green
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 340,
      color: {
        dark: '#004d26', // KU Green
        light: '#ffffff',
      },
    });

    return {
      payload,
      qrDataUrl,
      billerId,
      merchantName,
      serviceNameTh: billerConfig.serviceNameTh,
      ref1: options.ref1,
      ref2,
      amount: options.amount,
      amountThaiText: this.thaiBahtText(options.amount),
      expiredAt,
      isCentralService: false,
    };
  }

  /**
   * Convert amount number into formal Thai Baht text (e.g. 150.00 -> หนึ่งร้อยห้าสิบบาทถ้วน)
   */
  public static thaiBahtText(amount: number): string {
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
