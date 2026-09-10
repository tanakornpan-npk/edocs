import React, { useState } from 'react';
import { ApiClient } from '../services/api.js';
import { ShieldCheck, AlertCircle, CheckCircle2, Award, ChevronRight, Loader2 } from 'lucide-react';

interface JitVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export const JitVerifyModal: React.FC<JitVerifyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [citizenId, setCitizenId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [requireSelection, setRequireSelection] = useState(false);

  if (!isOpen) return null;

  const formatCitizenId = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 13);
    let formatted = '';
    for (let i = 0; i < raw.length; i++) {
      if (i === 1 || i === 5 || i === 10 || i === 12) formatted += '-';
      formatted += raw[i];
    }
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCitizenId(e.target.value);
    setCitizenId(formatted);
    setErrorMsg('');
  };

  const handleVerify = async (selectedStudentId?: string) => {
    const rawId = citizenId.replace(/[-\s]/g, '');
    if (rawId.length !== 13) {
      setErrorMsg('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await ApiClient.verifyCitizenId(rawId, selectedStudentId);

      if (res.require_selection && res.records) {
        // พบหลายหลักสูตร (เช่น ป.ตรี และ ป.โท)
        setRecords(res.records);
        setRequireSelection(true);
        setIsLoading(false);
        return;
      }

      if (res.token) {
        ApiClient.setToken(res.token);
      }

      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถยืนยันข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">ยืนยันตัวตนนิสิตเก่า (Verify Alumni)</h3>
              <p className="text-xs text-emerald-200">ระบบดึงประวัติการศึกษาจาก api.csc.ku.ac.th</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!requireSelection ? (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900 leading-relaxed flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  เนื่องจากท่านเข้าสู่ระบบด้วยบัญชีทั่วไป/Google เพื่อให้ระบบสามารถดึงประวัติการศึกษาและสิทธิ์การขอเอกสารที่ถูกต้องได้ กรุณาระบุ <strong>เลขประจำตัวประชาชน 13 หลัก</strong> ของท่าน
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขประจำตัวประชาชน 13 หลัก
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="x-xxxx-xxxxx-xx-x"
                    value={citizenId}
                    onChange={handleInputChange}
                    maxLength={17}
                    className="w-full text-center tracking-widest text-lg font-mono font-bold text-emerald-950 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    *ข้อมูลนี้จะใช้ตรวจสอบกับระบบทะเบียน มก.ฉกส. และจะถูกบันทึกเพื่อความสะดวกรวดเร็วในครั้งถัดไป
                  </p>
                </div>

                {errorMsg && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {errorMsg}
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={isLoading || citizenId.replace(/\D/g, '').length !== 13}
                    onClick={() => handleVerify()}
                    className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังตรวจสอบ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ตรวจสอบข้อมูล</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Multi-degree selector */
            <div>
              <p className="text-xs text-slate-600 mb-3 font-medium">
                พบประวัติการศึกษาของท่านในระบบ <strong>{records.length} ระดับการศึกษา</strong> กรุณาเลือกระดับที่ต้องการขอเอกสารในครั้งนี้:
              </p>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {records.map((rec) => (
                  <button
                    key={rec.student_id}
                    onClick={() => handleVerify(rec.student_id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 transition group flex items-center justify-between"
                  >
                    <div className="flex items-start space-x-2">
                      <Award className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-emerald-950">
                          {rec.degree_name_th} ({rec.degree_level})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          รหัส: {rec.student_id} • {rec.faculty_name_th}
                        </div>
                        <div className="text-[10px] text-amber-700">
                          ปีที่สำเร็จการศึกษา: {rec.graduation_year || '-'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRequireSelection(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                ย้อนกลับ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};