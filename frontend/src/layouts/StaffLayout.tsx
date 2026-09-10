import React from 'react';
import { User } from '../types/index.js';
import { KuLogo } from '../components/KuLogo.js';
import { CounterPortal } from '../pages/CounterPortal.js';
import { Building2, LogOut, ArrowLeft, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StaffLayoutProps {
  user: User | null;
  onLogout: () => void;
  onViewReceipt: (orderNo: string) => void;
  onOpenQrModal: (data: any) => void;
  onOpenLogin: () => void;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({
  user,
  onLogout,
  onViewReceipt,
  onOpenQrModal,
  onOpenLogin,
}) => {
  const navigate = useNavigate();

  // Guard check: If not logged in as staff/admin, display prompt
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-800">
            ระบบจุดบริการหน้าเคาน์เตอร์ (Staff POS)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            หน้านี้สงวนสิทธิ์เฉพาะเจ้าหน้าที่งานบริการการศึกษา มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onOpenLogin}
              className="w-full py-2.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow transition"
            >
              เข้าสู่ระบบเจ้าหน้าที่ (KU All-login)
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              กลับสู่หน้านิสิต
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Dedicated Counter Staff Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          {/* Left: Branding & Staff Desk Identification */}
          <div className="flex items-center space-x-3">
            <KuLogo size={44} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black text-[#006633] tracking-tight">
                  ระบบจุดบริการหน้าเคาน์เตอร์ (Staff POS)
                </span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  งานบริการการศึกษา
                </span>
              </div>
              <div className="text-xs text-slate-500">
                มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จ.สกลนคร
              </div>
            </div>
          </div>

          {/* Right: Officer Profile, Return to Student, and Logout */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              title="กลับสู่หน้าพอร์ทัลนิสิต"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้านิสิต</span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800">
                  {user.first_name_th} {user.last_name_th}
                </div>
                <div className="text-[10px] text-amber-700 font-semibold flex items-center justify-end space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>เจ้าหน้าที่เคาน์เตอร์บริการ</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="ออกจากระบบเจ้าหน้าที่"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Staff POS Workspace */}
      <main className="flex-1">
        <CounterPortal
          user={user}
          onViewReceipt={onViewReceipt}
          onOpenQrModal={onOpenQrModal}
        />
      </main>

      {/* Staff Workspace Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            🏢 โต๊ะบริการงานทะเบียนและเอกสารทางการศึกษา • อาคาร 1 มก.ฉกส.
          </div>
          <div className="text-slate-400">
            ระบบบันทึกข้อมูลและออกหลักฐานทางการศึกษาตามระเบียบ มหาวิทยาลัยเกษตรศาสตร์
          </div>
        </div>
      </footer>
    </div>
  );
};
