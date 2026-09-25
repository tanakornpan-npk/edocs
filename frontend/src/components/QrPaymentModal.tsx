import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api.js';
import { QrCode, CheckCircle2, Clock, X, Printer, Copy, Check, Building2, ShieldCheck } from 'lucide-react';

interface QrPaymentModalProps {
  isOpen: boolean;
  orderNo: string;
  amount: number;
  thaiBahtText?: string;
  qrDataUrl?: string;
  billerId?: string;
  merchantName?: string;
  serviceNameTh?: string;
  ref1?: string;
  ref2?: string;
  onClose: () => void;
  onPaymentSuccess: (orderNo: string) => void;
  onViewReceipt: (orderNo: string) => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  isOpen,
  orderNo,
  amount,
  thaiBahtText: initialThaiBahtText,
  qrDataUrl: initialQrDataUrl,
  billerId: initialBillerId,
  merchantName: initialMerchantName,
  serviceNameTh: initialServiceNameTh,
  ref1: initialRef1,
  ref2: initialRef2,
  onClose,
  onPaymentSuccess,
  onViewReceipt,
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins countdown
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dynamic state loaded if not provided initially
  const [currentQrUrl, setCurrentQrUrl] = useState<string>(initialQrDataUrl || '');
  const [currentAmount, setCurrentAmount] = useState<number>(amount || 0);
  const [currentThaiBahtText, setCurrentThaiBahtText] = useState<string>(initialThaiBahtText || '');
  const [currentBillerId, setCurrentBillerId] = useState<string>(initialBillerId || '099400063727601');
  const [currentMerchantName, setCurrentMerchantName] = useState<string>(initialMerchantName || 'KASETSART UNIVERSITY CSC');
  const [currentServiceNameTh, setCurrentServiceNameTh] = useState<string>(initialServiceNameTh || 'มหาวิทยาลัยเกษตรศาสตร์ ว.เฉลิมพระเกียรติฯ');
  const [currentRef1, setCurrentRef1] = useState<string>(initialRef1 || orderNo);
  const [currentRef2, setCurrentRef2] = useState<string>(initialRef2 || '300');

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(15 * 60);
    setIsSuccess(false);

    // Sync from props
    if (initialQrDataUrl) setCurrentQrUrl(initialQrDataUrl);
    if (amount) setCurrentAmount(amount);
    if (initialThaiBahtText) setCurrentThaiBahtText(initialThaiBahtText);
    if (initialBillerId) setCurrentBillerId(initialBillerId);
    if (initialMerchantName) setCurrentMerchantName(initialMerchantName);
    if (initialServiceNameTh) setCurrentServiceNameTh(initialServiceNameTh);
    if (initialRef1) setCurrentRef1(initialRef1);
    if (initialRef2) setCurrentRef2(initialRef2);

    // If QR URL or biller details are missing, fetch fresh request details from backend
    if ((!initialQrDataUrl || !initialBillerId) && orderNo) {
      ApiClient.getRequestDetail(orderNo)
        .then((res: any) => {
          if (res.data) {
            const data = res.data;
            if (data.total_amount) setCurrentAmount(parseFloat(data.total_amount));
            if (data.amount_thai_text) setCurrentThaiBahtText(data.amount_thai_text);
            if (data.payment) {
              if (data.payment.qr_data_url) setCurrentQrUrl(data.payment.qr_data_url);
              if (data.payment.biller_id) setCurrentBillerId(data.payment.biller_id);
              if (data.payment.ref1) setCurrentRef1(data.payment.ref1);
              if (data.payment.ref2) setCurrentRef2(data.payment.ref2);
            }
          }
        })
        .catch((err) => console.warn('Could not load detailed payment data:', err));
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Auto-poll status in case Central KU QR service / bank Webhook confirms payment
    const pollInterval = setInterval(() => {
      if (orderNo) {
        ApiClient.getRequestDetail(orderNo)
          .then((res: any) => {
            const req = res.data;
            if (
              req?.status === 'processing' ||
              req?.status === 'paid' ||
              req?.status === 'completed' ||
              req?.payment?.status === 'success'
            ) {
              setIsSuccess(true);
              onPaymentSuccess(orderNo);
            }
          })
          .catch(() => {});
      }
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [isOpen, orderNo, initialQrDataUrl, amount, initialBillerId, initialRef1, initialRef2]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Thai QR Bill Payment</h3>
              <p className="text-[11px] text-emerald-200">บริการชำระเงินข้ามธนาคาร (Cross-Bank)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-700/60 rounded-xl text-emerald-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSuccess ? (
            <div>
              {/* Order Info & Amount */}
              <div className="text-xs text-slate-500 mb-1">
                หมายเลขคำร้อง: <span className="font-mono font-bold text-slate-800">{orderNo}</span>
              </div>
              <div className="text-3xl font-black text-emerald-950 mb-0.5">
                ฿{parseFloat(String(currentAmount)).toFixed(2)}
              </div>
              {currentThaiBahtText && (
                <div className="text-[11px] font-medium text-slate-500 mb-4">
                  ({currentThaiBahtText})
                </div>
              )}

              {/* QR Image Box */}
              <div className="relative p-3.5 bg-slate-50 rounded-2xl border-2 border-emerald-400 inline-block shadow-inner mb-3">
                {currentQrUrl ? (
                  <img
                    src={currentQrUrl}
                    alt="Thai QR Payment"
                    className="w-52 h-52 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                    <QrCode className="w-8 h-8 animate-pulse text-emerald-600" />
                    <span>กำลังสร้าง QR Code...</span>
                  </div>
                )}
                <div className="text-[10px] font-bold text-emerald-900 tracking-wider mt-1.5 flex items-center justify-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>THAI QR PAYMENT (PROMPTPAY BILL PAYMENT)</span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-800 bg-amber-50 py-1.5 px-3.5 rounded-full mb-3 w-max mx-auto border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>QR หมดอายุใน: </span>
                <span className="font-mono font-bold">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>

              {/* Official Bill Payment Details Box */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs mb-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-[#006633]" />
                    <span>ผู้รับชำระ:</span>
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]" title={currentServiceNameTh}>
                    {currentServiceNameTh}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Biller ID */}
                  <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] text-slate-400">Biller ID</div>
                      <div className="font-mono font-bold text-slate-800">{currentBillerId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentBillerId, 'biller')}
                      className="p-1 text-slate-400 hover:text-emerald-700"
                      title="คัดลอก Biller ID"
                    >
                      {copiedKey === 'biller' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Ref 1 */}
                  <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] text-slate-400">Ref 1 (รหัสนิสิต)</div>
                      <div className="font-mono font-bold text-slate-800">{currentRef1}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentRef1, 'ref1')}
                      className="p-1 text-slate-400 hover:text-emerald-700"
                      title="คัดลอก Ref 1"
                    >
                      {copiedKey === 'ref1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Ref 2 */}
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80 text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-400">Ref 2 (รหัสประเภทบริการ)</div>
                    <div className="font-mono font-bold text-emerald-800">
                      {currentRef2} {currentRef2 === '300' ? '(ค่าเอกสารสำคัญทางการศึกษา)' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentRef2, 'ref2')}
                    className="p-1 text-slate-400 hover:text-emerald-700"
                    title="คัดลอก Ref 2"
                  >
                    {copiedKey === 'ref2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                เปิดแอปธนาคารใดก็ได้ในประเทศไทย เลือกเมนู <strong>สแกน / สแกนจ่าย</strong><br />
                ระบบจะตรวจสอบและปรับปรุงสถานะคำร้องอัตโนมัติ
              </div>

              {/* Simulated Pay Action for Testing/POS */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleSimulatePayment}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-emerald-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
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
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-lg text-slate-800 mb-1">ชำระเงินสำเร็จแล้ว!</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                ระบบได้รับยอดเงินเรียบร้อยแล้ว และกำลังส่งต่องานไปยังเจ้าหน้าที่ทะเบียนเพื่อจัดทำเอกสารตามลำดับ
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    onViewReceipt(orderNo);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
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