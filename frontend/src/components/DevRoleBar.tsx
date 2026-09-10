import React, { useState } from 'react';
import { User } from '../types/index.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ChevronUp, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';

interface DevRoleBarProps {
  user: User | null;
  onSwitchRole: (role: string) => Promise<void>;
}

export const DevRoleBar: React.FC<DevRoleBarProps> = ({ user, onSwitchRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSelect = async (roleType: string, path: string) => {
    await onSwitchRole(roleType);
    navigate(path);
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      {/* Minimized Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-2xl border border-slate-700 backdrop-blur-md transition transform hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-[#FFC72C] animate-pulse"></span>
          <span>🧪 โหมดทดสอบระบบ (Dev Switcher)</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Expanded Dev Drawer */
        <div className="bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 max-w-sm w-80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-1.5 text-xs font-black text-[#FFC72C]">
              <Sparkles className="w-4 h-4" />
              <span>สลับบทบาทและพอร์ทัลทดสอบ</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status */}
          <div className="text-[11px] text-slate-400 mb-3 bg-slate-800/80 p-2 rounded-xl">
            <div>
              ผู้ใช้ปัจจุบัน: <span className="font-bold text-white">{user?.first_name_th || 'ไม่ได้ล็อกอิน'}</span>
            </div>
            <div>
              บทบาท: <span className="font-bold text-[#FFC72C]">{user?.role || 'Guest'}</span>
              {user?.status_code && ` (${user.status_code})`} • เส้นทาง: <span className="text-emerald-400 font-mono">{location.pathname}</span>
            </div>
          </div>

          {/* 4 Role Selector Buttons */}
          <div className="space-y-1.5 text-xs">
            <button
              onClick={() => handleRoleSelect('student_s', '/')}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-[#006633] text-slate-200 hover:text-white flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold">นิสิตปัจจุบัน (S)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">/ (Student)</span>
            </button>

            <button
              onClick={() => handleRoleSelect('alumni_g', '/')}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-blue-700 text-slate-200 hover:text-white flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="font-semibold">นิสิตเก่า (G - JIT Verify)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">/ (Alumni)</span>
            </button>

            <button
              onClick={() => handleRoleSelect('staff', '/staff')}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-amber-600 text-slate-200 hover:text-white flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="font-semibold">เจ้าหน้าที่เคาน์เตอร์ (Staff)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">/staff</span>
            </button>

            <button
              onClick={() => handleRoleSelect('admin', '/admin')}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-red-700 text-slate-200 hover:text-white flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="font-semibold">ผู้ดูแลระบบ (Admin)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">/admin</span>
            </button>

            <button
              onClick={() => handleRoleSelect('exec', '/executive')}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-purple-700 text-slate-200 hover:text-white flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <span className="font-semibold">ผู้บริหาร (Executive)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">/executive</span>
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
            <span>KU CSC e-Doc Multi-Portal</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="hover:underline text-slate-400"
            >
              ย่อแถบนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
