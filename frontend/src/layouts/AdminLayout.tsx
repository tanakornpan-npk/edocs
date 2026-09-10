import React from 'react';
import { User } from '../types/index.js';
import { KuLogo } from '../components/KuLogo.js';
import { AdminPortal } from '../pages/AdminPortal.js';
import { ShieldAlert, LogOut, ArrowLeft, Database, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  user: User | null;
  onLogout: () => void;
  onViewReceipt?: (orderNo: string) => void;
  onOpenLogin: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, onViewReceipt, onOpenLogin }) => {
  const navigate = useNavigate();

  // Guard check: If not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-800">
            แผงควบคุมระบบสำหรับผู้ดูแลระบบ (Admin Console)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เพื่อจัดการประเภทเอกสาร กำหนดราคา แพ็กเกจ และสิทธิ์เจ้าหน้าที่
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onOpenLogin}
              className="w-full py-2.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow transition"
            >
              เข้าสู่ระบบด้วยบัญชี Admin
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
      {/* Admin Console Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          {/* Left: Branding & Admin Identification */}
          <div className="flex items-center space-x-3">
            <KuLogo size={44} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black text-[#006633] tracking-tight">
                  ระบบบริหารจัดการข้อมูล (Admin Console)
                </span>
                <span className="text-[10px] font-black bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full">
                  System Admin
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center space-x-2">
                <span>มหาวิทยาลัยเกษตรศาสตร์ ว.สกลนคร</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center space-x-1 text-[11px] text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>PostgreSQL Connected</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Admin Profile, Return to Student, and Logout */}
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
                <div className="text-[10px] text-red-700 font-semibold flex items-center justify-end space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ผู้ดูแลระบบ</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="ออกจากระบบ Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Console Body */}
      <main className="flex-1">
        <AdminPortal onViewReceipt={onViewReceipt} />
      </main>

      {/* Admin Workspace Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            🛡️ ศูนย์บริหารจัดการระบบคำร้องขอเอกสารการศึกษาออนไลน์ (edoc admin console)
          </div>
          <div className="text-slate-400">
            ระบบทำงานสอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) และ พ.ร.บ. คอมพิวเตอร์
          </div>
        </div>
      </footer>
    </div>
  );
};
