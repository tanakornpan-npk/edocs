import { config } from '../config/index.js';

export interface KuCentralQrRequestOptions {
  amount: number;
  transactionId: string;
  studentId?: string;
  ref2Code?: string;
  appCode?: string;
  billerSuffix?: string;
  expireDate?: string; // ddMMyy
  soapUrl?: string;
  callbackUrl?: string;
  timeoutMs?: number;
}

export interface KuCentralQrResponse {
  success: boolean;
  qrDataUrl?: string;
  qrId?: string;
  appId?: number;
  appCode?: string;
  transactionId?: string;
  ref1Prefix?: string;
  ref2Prefix?: string;
  billerSuffix?: string;
  durationMs?: number;
  rawXmlRequest?: string;
  rawXmlResponse?: string;
  error?: string;
  errorCode?: string;
  errorStackTrace?: string;
}

export class KuCentralQrService {
  /**
   * สร้าง Ref1 Prefix ขนาด 17 หลักตามโครงสร้างคู่มือ มก. ข้อ 6.2 (หน้า 7)
   * โครงสร้าง 17 หลัก:
   * - หลัก 1-10 : รหัสนิสิต (10 หลัก)
   * - หลัก 11   : วงเงิน เช่น '1' (1 หลัก)
   * - หลัก 12-13: ปี พ.ศ. 2 หลัก เช่น '68' (2 หลัก)
   * - หลัก 14   : ภาคเรียน เช่น '1' (1 หลัก)
   * - หลัก 15-17: ส่วนหัว ERP / รหัสอ้างอิงย่อย (3 หลัก)
   * *ระบบกลาง มก. จะนำไปคำนวณ Check Digit SCB 3 หลักสุดท้าย (หลัก 18-20) ให้อัตโนมัติ
   */
  public static buildRef1Prefix(
    studentId?: string,
    creditLimit = '1',
    academicYear?: string,
    term = '1',
    erpSub = '000'
  ): string {
    const cleanStudentId = (studentId || '').replace(/[^0-9]/g, '');
    let paddedStudentId = cleanStudentId;
    if (paddedStudentId.length < 10) {
      paddedStudentId = paddedStudentId.padStart(10, '0');
    } else if (paddedStudentId.length > 10) {
      paddedStudentId = paddedStudentId.slice(0, 10);
    }

    const cleanLimit = (creditLimit || '1').replace(/[^0-9]/g, '').slice(0, 1) || '1';
    
    let year2Digits = (academicYear || '').replace(/[^0-9]/g, '').slice(-2);
    if (!year2Digits) {
      // Default to current Thai Buddhist year (e.g. 2568 -> '68')
      const currentBE = new Date().getFullYear() + 543;
      year2Digits = currentBE.toString().slice(-2);
    }

    const cleanTerm = (term || '1').replace(/[^0-9]/g, '').slice(0, 1) || '1';
    const cleanErp = (erpSub || '000').replace(/[^0-9]/g, '').padStart(3, '0').slice(0, 3);

    const full17 = `${paddedStudentId}${cleanLimit}${year2Digits}${cleanTerm}${cleanErp}`;
    return full17.slice(0, 17).padEnd(17, '0');
  }

  /**
   * สร้าง Ref2 Prefix ขนาด 6 หลักตามโครงสร้างคู่มือ มก. ข้อ 6.2 (หน้า 7)
   * เช่น รหัส Ref2 '300' -> '000300'
   * *ระบบกลาง มก. จะนำไปต่อท้ายด้วย appCode (2 หลัก) + QR ID (6 หลัก) + วันหมดอายุ ddMMyy (6 หลัก) รวมเป็น 20 หลัก
   */
  public static buildRef2Prefix(ref2Code = '300'): string {
    const cleanCode = (ref2Code || '300').replace(/[^0-9]/g, '');
    return cleanCode.slice(0, 6).padStart(6, '0');
  }

  /**
   * แปลงวันที่เป็นรูปแบบ ddMMyy (ปี ค.ศ. เช่น 301126 = 30 Nov 2026)
   */
  public static formatExpireDate(date?: Date): string {
    const target = date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // Default 15 days
    const dd = target.getDate().toString().padStart(2, '0');
    const MM = (target.getMonth() + 1).toString().padStart(2, '0');
    const yy = (target.getFullYear() % 100).toString().padStart(2, '0');
    return `${dd}${MM}${yy}`;
  }

  /**
   * สร้าง SOAP 1.1 XML Request สำหรับเรียก Operation `getOeaQr`
   */
  public static buildSoapEnvelope(options: {
    expireDate: string;
    appCode: string;
    transactionId: string;
    amount: number;
    ref1Prefix: string;
    ref2Prefix: string;
    billerSuffix: string;
    callbackUrl?: string;
  }): string {
    const formattedAmount = Number(options.amount).toFixed(2);
    const callbackTag = options.callbackUrl
      ? `<type:callbackUrl>${options.callbackUrl}</type:callbackUrl>`
      : '';

    return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:type="http://registrar.ku.ac.th/qr/type">
  <soapenv:Header/>
  <soapenv:Body>
    <type:getOeaQrRequest>
      <type:expireDate>${options.expireDate}</type:expireDate>
      <type:appCode>${options.appCode}</type:appCode>
      <type:transactionId>${options.transactionId}</type:transactionId>
      <type:amount>${formattedAmount}</type:amount>
      <type:ref1Prefix>${options.ref1Prefix}</type:ref1Prefix>
      <type:ref2Prefix>${options.ref2Prefix}</type:ref2Prefix>
      <type:billerSuffix>${options.billerSuffix}</type:billerSuffix>
      ${callbackTag}
    </type:getOeaQrRequest>
  </soapenv:Body>
</soapenv:Envelope>`.trim();
  }

  /**
   * ล้าง XML entities (เช่น &#xd;, &#xa;), whitespace, และขึ้นบรรทัดใหม่ออกจาก Base64 Data URL
   * เพื่อให้ browser สามารถ decode และ render เป็นรูปภาพ <img> ได้อย่างสมบูรณ์
   */
  public static cleanDataUrl(raw?: string): string | undefined {
    if (!raw) return undefined;
    // 1. ถอด XML character entities เช่น &#xd;, &#xa;, &#x0d;, &#x0a;, &#13;, &#10;
    const strippedEntities = raw
      .replace(/&#x[0-9a-fA-F]+;/gi, '')
      .replace(/&#\d+;/g, '');

    // 2. แยก mime type กับ base64
    let base64Part = strippedEntities;
    let mime = 'image/png';
    if (strippedEntities.includes('base64,')) {
      const parts = strippedEntities.split('base64,');
      const prefixMatch = parts[0].match(/data:(image\/[a-zA-Z0-9+.-]+);/i);
      if (prefixMatch && prefixMatch[1]) {
        mime = prefixMatch[1];
      }
      base64Part = parts[1];
    }

    // 3. กรองเฉพาะตัวอักษร Base64 ที่ถูกต้องเท่านั้น ([A-Za-z0-9+/=])
    const cleanBase64 = base64Part.replace(/[^A-Za-z0-9+/=]/g, '');
    if (!cleanBase64) return undefined;

    return `data:${mime};base64,${cleanBase64}`;
  }

  /**
   * เรียก Web Service กลางของ มก. (SOAP getOeaQr)
   */
  public static async requestOeaQr(
    options: KuCentralQrRequestOptions
  ): Promise<KuCentralQrResponse> {
    const soapUrl = options.soapUrl || process.env.KU_QR_SOAP_URL || 'https://fin.ku.th/qr/service';
    const appCode = options.appCode || process.env.KU_QR_APP_CODE || '06'; // 06: ค่าเอกสารสำคัญทางการศึกษา
    const billerSuffix = options.billerSuffix || process.env.KU_QR_BILLER_SUFFIX || '01';
    const expireDate = options.expireDate || this.formatExpireDate();
    const ref1Prefix = this.buildRef1Prefix(options.studentId);
    const ref2Prefix = this.buildRef2Prefix(options.ref2Code);
    const callbackUrl = options.callbackUrl || process.env.KU_QR_CALLBACK_URL || 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback';
    const timeoutMs = options.timeoutMs || 8000;

    const xmlRequest = this.buildSoapEnvelope({
      expireDate,
      appCode,
      transactionId: options.transactionId,
      amount: options.amount,
      ref1Prefix,
      ref2Prefix,
      billerSuffix,
      callbackUrl,
    });

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(soapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://registrar.ku.ac.th/qr/service/getOeaQr',
          'User-Agent': 'KU-CSC-eDocs-Service/1.0',
        },
        body: xmlRequest,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      const xmlResponse = await response.text();

      // ตรวจสอบ HTTP Status
      if (!response.ok) {
        return {
          success: false,
          rawXmlRequest: xmlRequest,
          rawXmlResponse: xmlResponse,
          error: `HTTP Error ${response.status} ${response.statusText}`,
          durationMs,
          ref1Prefix,
          ref2Prefix,
          appCode,
          billerSuffix,
          transactionId: options.transactionId,
        };
      }

      // ดึง <success>...</success>
      const successMatch = xmlResponse.match(/<(?:\w+:)?success>(.*?)<\/(?:\w+:)?success>/i);
      const isSuccess = successMatch ? successMatch[1].trim().toLowerCase() === 'true' : false;

      // ดึง Base64 Data URL พร้อมทำความสะอาด XML entities (&#xd;) และ whitespace
      const contentMatch = xmlResponse.match(/<(?:\w+:)?content>([\s\S]*?)<\/(?:\w+:)?content>/i);
      const qrDataUrl = contentMatch ? this.cleanDataUrl(contentMatch[1]) : undefined;

      // ดึง ID
      const qrIdMatch = xmlResponse.match(/<(?:\w+:)?id>(.*?)<\/(?:\w+:)?id>/i);
      const qrId = qrIdMatch ? qrIdMatch[1].trim() : undefined;

      const appIdMatch = xmlResponse.match(/<(?:\w+:)?appId>(.*?)<\/(?:\w+:)?appId>/i);
      const appId = appIdMatch ? parseInt(appIdMatch[1].trim(), 10) : undefined;

      // ดึง Error Info (ถ้ามี)
      const errCodeMatch = xmlResponse.match(/<(?:\w+:)?code>(.*?)<\/(?:\w+:)?code>/i);
      const errMsgMatch = xmlResponse.match(/<(?:\w+:)?message>(.*?)<\/(?:\w+:)?message>/i);
      const errStackMatch = xmlResponse.match(/<(?:\w+:)?stackTrace>([\s\S]*?)<\/(?:\w+:)?stackTrace>/i);

      return {
        success: isSuccess && !!qrDataUrl,
        qrDataUrl,
        qrId,
        appId,
        appCode,
        billerSuffix,
        transactionId: options.transactionId,
        ref1Prefix,
        ref2Prefix,
        durationMs,
        rawXmlRequest: xmlRequest,
        rawXmlResponse: xmlResponse,
        error: isSuccess ? undefined : (errMsgMatch ? errMsgMatch[1].trim() : 'Central service returned failure'),
        errorCode: errCodeMatch ? errCodeMatch[1].trim() : undefined,
        errorStackTrace: errStackMatch ? errStackMatch[1].trim() : undefined,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const isAbort = err.name === 'AbortError';
      return {
        success: false,
        rawXmlRequest: xmlRequest,
        error: isAbort ? `Connection Timeout (${timeoutMs}ms)` : err.message,
        durationMs,
        ref1Prefix,
        ref2Prefix,
        appCode,
        billerSuffix,
        transactionId: options.transactionId,
      };
    }
  }
}
