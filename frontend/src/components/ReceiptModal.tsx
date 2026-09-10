import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api.js';
import { KuLogo } from './KuLogo.js';
import { Printer, X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface ReceiptModalProps {
  orderNo: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ orderNo, isOpen, onClose }) => {
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopy, setIsCopy] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderNo) return;
    setIsLoading(true);

    // Check if printed before to display "สำเนา / COPY"
    const printedHistory = localStorage.getItem(`printed_${orderNo}`);
    if (printedHistory) {
      setIsCopy(true);
    } else {
      setIsCopy(false);
    }

    ApiClient.getReceipt(orderNo)
      .then((res) => {
        setReceiptData(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, orderNo]);

  if (!isOpen || !orderNo) return null;

  const handlePrint = () => {
    localStorage.setItem(`printed_${orderNo}`, 'true');
    setIsCopy(true);
    window.print();
  };

  const formatDateThai = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls (Hidden when printing) */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ใบเสร็จรับเงินอิเล็กทรอนิกส์ (Official Receipt)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบเสร็จ (Print)</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
            <span className="text-xs text-slate-500 font-medium">กำลังจัดเตรียมข้อมูลใบเสร็จรับเงิน...</span>
          </div>
        ) : receiptData ? (
          <div id="printable-receipt" className="relative p-8 md:p-10 bg-white text-slate-900 select-text font-serif">
            {/* Watermark for Copy */}
            {isCopy && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] rotate-[-25deg] select-none z-0">
                <span className="text-8xl font-black tracking-widest text-slate-900 border-8 border-slate-900 px-8 py-2 rounded-3xl">
                  สำเนา / COPY
                </span>
              </div>
            )}

            {/* University Header */}
            <div className="text-center relative z-10 mb-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <KuLogo size={56} />
                <div className="text-left font-sans">
                  <h2 className="text-base font-bold text-emerald-950 tracking-tight">
                    มหาวิทยาลัยเกษตรศาสตร์
                  </h2>
                  <h3 className="text-xs font-semibold text-emerald-800">
                    วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    59 หมู่ 1 ต.เชียงเครือ อ.เมือง จ.สกลนคร 47000 • โทร. 042-725000
                  </p>
                </div>
              </div>

              <div className="border-b-2 border-emerald-900 my-3"></div>

              <div className="flex items-center justify-between font-sans text-xs mt-2">
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 tracking-wide">
                    ใบเสร็จรับเงิน / RECEIPT
                  </h1>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    {isCopy ? '[ สำเนา / COPY ]' : '[ ต้นฉบับ / ORIGINAL ]'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">
                    เลขที่: {receiptData.receipt_no || '-'}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    วันที่: {formatDateThai(receiptData.paid_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Student & Order Information */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 font-sans text-xs grid grid-cols-2 gap-y-2 relative z-10">
              <div>
                <span className="text-slate-500">ได้รับเงินจาก: </span>
                <span className="font-bold text-slate-900">{receiptData.student_name}</span>
              </div>
              <div>
                <span className="text-slate-500">รหัสนิสิต: </span>
                <span className="font-mono font-bold text-slate-900">{receiptData.student_id}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">สังกัด: </span>
                <span className="text-slate-800">{receiptData.faculty_name || 'วิทยาเขตเฉลิมพระเกียรติ จ.สกลนคร'}</span>
              </div>
              <div>
                <span className="text-slate-500">อ้างอิงคำร้อง: </span>
                <span className="font-mono text-slate-700">{receiptData.order_no}</span>
              </div>
              <div>
                <span className="text-slate-500">ช่องทางชำระเงิน: </span>
                <span className="font-semibold text-emerald-800">
                  {receiptData.payment_method === 'thai_qr' ? 'Thai QR Payment (PromptPay)' : 'เงินสด'}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-xs font-sans mb-4 border-collapse relative z-10">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700">
                  <th className="py-2 text-left w-10">ลำดับ</th>
                  <th className="py-2 text-left">รายการเอกสาร</th>
                  <th className="py-2 text-center w-16">จำนวน</th>
                  <th className="py-2 text-right w-24">ราคา/หน่วย</th>
                  <th className="py-2 text-right w-24">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receiptData.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-2 font-medium text-slate-800">{item.item_name}</td>
                    <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-2 text-right font-mono text-slate-600">
                      {parseFloat(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-800">
                      {parseFloat(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Shipping Fee if any */}
                {parseFloat(receiptData.shipping_fee) > 0 && (
                  <tr>
                    <td className="py-2 text-slate-400 text-center">-</td>
                    <td className="py-2 text-slate-700 italic">ค่าจัดส่งทางไปรษณีย์ด่วนพิเศษ (EMS)</td>
                    <td className="py-2 text-center text-slate-600">1</td>
                    <td className="py-2 text-right font-mono text-slate-600">
                      {parseFloat(receiptData.shipping_fee).toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-800">
                      {parseFloat(receiptData.shipping_fee).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-400">
                  <td colSpan={3} className="py-3 text-left font-bold text-slate-800 bg-slate-50 px-2 rounded-l-lg">
                    ( {receiptData.thai_baht_text} )
                  </td>
                  <td className="py-3 text-right font-bold text-slate-700 bg-slate-50">
                    ยอดรวมสุทธิ:
                  </td>
                  <td className="py-3 text-right font-mono text-base font-black text-emerald-950 bg-slate-50 px-2 rounded-r-lg">
                    ฿{parseFloat(receiptData.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Footer & Signature Section */}
            <div className="pt-8 font-sans grid grid-cols-2 text-xs relative z-10">
              <div className="text-slate-400 text-[10px] space-y-1">
                <p>• ใบเสร็จรับเงินนี้ออกโดยระบบอัตโนมัติของ มหาวิทยาลัยเกษตรศาสตร์ วข.ฉกส.</p>
                <p>• เอกสารนี้มีผลสมบูรณ์ตาม พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544</p>
                <div className="flex items-center space-x-1 text-emerald-800 font-medium mt-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ระบบบันทึกความปลอดภัยด้วย Digital Audit Log</span>
                </div>
              </div>

              <div className="text-center">
                <div className="border-b border-dashed border-slate-400 w-48 mx-auto mb-1 h-8 flex items-end justify-center">
                  <span className="font-serif italic text-emerald-900 text-sm font-bold opacity-80 select-none">
                    สำนักบริการวิชาการ
                  </span>
                </div>
                <div className="font-semibold text-slate-800 text-xs">
                  ( เจ้าหน้าที่รับเงิน / Registrar Officer )
                </div>
                <div className="text-[10px] text-slate-500">
                  งานบริการการศึกษา มหาวิทยาลัยเกษตรศาสตร์ วข.ฉกส.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-red-500">
            ไม่พบข้อมูลใบเสร็จรับเงิน หรือคำร้องนี้ยังไม่ได้ชำระเงิน
          </div>
        )}
      </div>
    </div>
  );
};