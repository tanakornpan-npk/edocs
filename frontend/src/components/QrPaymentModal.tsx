import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api.js';
import { QrCode, CheckCircle2, Clock, X, AlertCircle, Printer } from 'lucide-react';

interface QrPaymentModalProps {
  isOpen: boolean;
  orderNo: string;
  amount: number;
  thaiBahtText: string;
  qrDataUrl: string;
  onClose: () => void;
  onPaymentSuccess: (orderNo: string) => void;
  onViewReceipt: (orderNo: string) => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  isOpen,
  orderNo,
  amount,
  thaiBahtText,
  qrDataUrl,
  onClose,
  onPaymentSuccess,
  onViewReceipt,
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins countdown
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(15 * 60);
    setIsSuccess(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleSimulatePayment = async () => {
    setIsConfirming(true);
    try {
      await ApiClient.confirmPayment(orderNo);
      setIsSuccess(true);
      onPaymentSuccess(orderNo);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการยืนยันชำระเงิน: ' + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">ชำระเงินด้วย Thai QR Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-700/60 rounded-lg text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSuccess ? (
            <div>
              {/* Order Info */}
              <div className="text-xs text-slate-500 mb-1">หมายเลขคำร้อง: <span className="font-mono font-bold text-slate-800">{orderNo}</span></div>
              <div className="text-2xl font-black text-emerald-950 mb-0.5">
                ฿{parseFloat(String(amount)).toFixed(2)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mb-4">
                ({thaiBahtText})
              </div>

              {/* QR Image Box */}
              <div className="relative p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-300 inline-block shadow-inner mb-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Thai QR Payment" className="w-52 h-52 object-contain mx-auto" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                    กำลังสร้าง QR Code...
                  </div>
                )}
                <div className="text-[10px] font-bold text-emerald-900 tracking-wider mt-1">
                  THAI QR PAYMENT (PROMPTPAY)
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center space-x-1 text-xs text-amber-700 bg-amber-50 py-1.5 px-3 rounded-full mb-4 w-max mx-auto border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>QR หมดอายุใน: </span>
                <span className="font-mono font-bold">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                สแกนผ่านแอปพลิเคชันธนาคารทุกแห่งในประเทศไทย<br />ระบบจะตรวจสอบยอดเงินเข้าอัตโนมัติทันที
              </div>

              {/* Simulated Pay Action for Testing/POS */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleSimulatePayment}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-emerald-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isConfirming ? 'กำลังบันทึกการชำระเงิน...' : 'จำลอง: ชำระเงินสำเร็จ (Simulate Pay)'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ปิดหน้าต่างนี้ (ชำระภายหลัง)
                </button>
              </div>
            </div>
          ) : (
            /* Success View */
            <div className="py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-slate-800 mb-1">ชำระเงินสำเร็จแล้ว!</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                ระบบได้รับยอดเงินเรียบร้อยแล้ว และกำลังส่งต่องานไปยังเจ้าหน้าที่เพื่อจัดทำเอกสารตามลำดับ
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    onViewReceipt(orderNo);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>ดูและพิมพ์ใบเสร็จรับเงิน</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};