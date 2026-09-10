import React, { useState } from 'react';
import { User } from '../types/index.js';
import { KuLogo } from './KuLogo.js';
import {
  GraduationCap,
  ShieldAlert,
  UserCheck,
  BarChart3,
  LogOut,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Search,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onSwitchRole: (role: string) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  onSwitchRole,
  onLogout,
  onOpenLogin,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const roleLabels: Record<string, { label: string; badgeClass: string }> = {
    admin: {
      label: 'ผู้ดูแลระบบ (Admin)',
      badgeClass: 'bg-red-100 text-red-800 border border-red-300',
    },
    staff: {
      label: 'เจ้าหน้าที่เคาน์เตอร์',
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    },
    executive: {
      label: 'ผู้บริหาร (Executive)',
      badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300',
    },
    student: {
      label:
        user?.status_code === 'G'
          ? 'นิสิตเก่า (G)'
          : user?.status_code === 'D'
          ? 'นิสิตลาพัก (D)'
          : 'นิสิตปัจจุบัน (S)',
      badgeClass:
        user?.status_code === 'G'
          ? 'bg-blue-100 text-blue-900 border border-blue-300'
          : user?.status_code === 'D'
          ? 'bg-amber-100 text-amber-900 border border-amber-300'
          : 'bg-[#E8F5E9] text-[#006633] border border-[#A5D6A7]',
    },
  };

  const currentRoleInfo = user ? roleLabels[user.role] : null;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200 select-none">
      {/* 1. Top Mini Utility Bar (KU Official Style as shown in reference) */}
      <div className="bg-[#F8FAF8] border-b border-slate-200/80 py-1 px-4 sm:px-6 lg:px-8 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar">
            <span className="font-semibold text-[#006633]">วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</span>
            <span className="text-slate-300">|</span>
            <span className="hidden md:inline hover:text-[#006633] cursor-pointer">ผู้สนใจเข้าศึกษา ▾</span>
            <span className="hidden md:inline hover:text-[#006633] cursor-pointer">นิสิต ▾</span>
            <span className="hidden md:inline hover:text-[#006633] cursor-pointer">บุคลากร ▾</span>
            <span className="hidden md:inline hover:text-[#006633] cursor-pointer">ศิษย์เก่า ▾</span>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Language Switch */}
            <div className="flex items-center space-x-1 font-bold text-[10px]">
              <span className="text-[#006633] hover:underline cursor-pointer">🇹🇭 TH</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400 hover:text-slate-600 cursor-pointer">🇬🇧 EN</span>
            </div>
            <span className="text-slate-300">|</span>
            {/* Search icon placeholder */}
            <button className="text-slate-500 hover:text-[#006633]" title="ค้นหา">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Brand Row with Official KU Green & Gold */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: KU Logo Emblem & Title */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab('student')}
        >
          <KuLogo size={52} className="group-hover:scale-105 transition-transform" />
          <div>
            <div className="text-lg sm:text-2xl font-black text-[#006633] tracking-tight leading-tight">
              มหาวิทยาลัยเกษตรศาสตร์
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#FFC72C] sm:text-[#006633]">
              วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
            </div>
            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              ระบบขอเอกสารทางการศึกษาออนไลน์ • Online Academic Document Services
            </div>
          </div>
        </div>

        {/* Center/Right Decorative Ribbon (Matching the Gable Roof in reference image) */}
        <div className="hidden xl:flex items-center space-x-3 bg-[#F4F8F5] border border-[#C8E6C9] rounded-2xl px-4 py-2">
          {/* Gable roof stylized SVG */}
          <svg className="w-8 h-8 text-[#006633]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 22 L20 6 L36 22 M10 17 V32 H30 V17 M16 32 V23 H24 V32" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="text-[11px] font-black text-[#006633] uppercase tracking-wide">
              ระบบขอเอกสารทางการศึกษาออนไลน์
            </div>
            <div className="text-[11px] font-bold text-[#D48806] flex items-center space-x-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>เปิดบริการ 24 ชม. • จัดส่งทั่วประเทศ</span>
            </div>
          </div>
        </div>

        {/* Right Tools: Cart, Fast Role Switcher, Profile/Login */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cart Button with Golden Badge */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-slate-700 hover:text-[#006633] hover:bg-[#E8F5E9] rounded-xl transition"
            title="ตะกร้าเอกสาร"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FFC72C] text-[#004d26] font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow border border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Fast Dev Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006633] border border-[#A5D6A7] text-xs px-2.5 py-1.5 rounded-xl font-bold transition shadow-sm"
              title="คลิกเพื่อสลับบทบาททดสอบ (4 บทบาท)"
            >
              <span className="text-[#FFC72C]">●</span>
              <span className="hidden sm:inline">สลับบทบาท</span>
              <span className="sm:hidden">สลับ</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#006633]" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl py-2 z-50 text-slate-800 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>เลือกบทบาททดสอบ (4 บทบาท)</span>
                  <Sparkles className="w-3 h-3 text-[#FFC72C]" />
                </div>

                <button
                  onClick={() => {
                    onSwitchRole('student_s');
                    setActiveTab('student');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#E8F5E9] flex items-center space-x-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006633]"></span>
                  <div>
                    <div className="font-semibold text-slate-800">นิสิตปัจจุบัน (S)</div>
                    <div className="text-[10px] text-slate-500">รหัส 6540201234 (วิศวะคอมฯ)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSwitchRole('student_d');
                    setActiveTab('student');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center space-x-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <div>
                    <div className="font-semibold text-slate-800">นิสิตลาพักการศึกษา (D)</div>
                    <div className="text-[10px] text-slate-500">รหัส 6440205678 (การบัญชี)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSwitchRole('alumni_g');
                    setActiveTab('student');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center space-x-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <div>
                    <div className="font-semibold text-slate-800">นิสิตเก่าสำเร็จการศึกษา (G)</div>
                    <div className="text-[10px] text-slate-500">นายสมหวัง (พืชศาสตร์/วิศวะ ป.โท)</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100"></div>

                <button
                  onClick={() => {
                    onSwitchRole('staff');
                    setActiveTab('counter');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center space-x-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <div>
                    <div className="font-semibold text-slate-800">เจ้าหน้าที่เคาน์เตอร์บริการ</div>
                    <div className="text-[10px] text-slate-500">คุณสมศรี (บริการดีเลิศ)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSwitchRole('admin');
                    setActiveTab('admin');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center space-x-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <div>
                    <div className="font-semibold text-slate-800">ผู้ดูแลระบบ (Admin)</div>
                    <div className="text-[10px] text-slate-500">จัดการเอกสาร/แพ็กเกจ/Excel</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSwitchRole('exec');
                    setActiveTab('executive');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-center space-x-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <div>
                    <div className="font-semibold text-slate-800">ผู้บริหาร (Executive)</div>
                    <div className="text-[10px] text-slate-500">รายงานสถิติและแดชบอร์ด</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile / Status / Logout */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800">
                  {user.first_name_th} {user.last_name_th}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${currentRoleInfo?.badgeClass}`}>
                  {currentRoleInfo?.label}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition"
            >
              เข้าสู่ระบบ
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Role-Based Navigation Menu Bar (Preserving original 4 menus as requested) */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden md:flex items-center space-x-1 h-12">
            {/* 1. Student Services */}
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                activeTab === 'student'
                  ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                  : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#006633]" />
              <span>บริการนิสิต / ขอเอกสาร</span>
            </button>

            {/* 2. Counter Service Staff */}
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('counter')}
                className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                  activeTab === 'counter'
                    ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                    : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>จุดบริการหน้าเคาน์เตอร์ (Staff POS)</span>
              </button>
            )}

            {/* 3. Admin Management */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                  activeTab === 'admin'
                    ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                    : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>ผู้ดูแลระบบ (Admin)</span>
              </button>
            )}

            {/* 4. Executive Analytics */}
            {(user?.role === 'executive' || user?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('executive')}
                className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                  activeTab === 'executive'
                    ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                    : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>รายงานและแดชบอร์ดผู้บริหาร</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="md:hidden bg-slate-50 border-t border-slate-200 px-4 py-3 space-y-1">
          <button
            onClick={() => {
              setActiveTab('student');
              setShowMobileMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'student' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎓 บริการนิสิต / ขอเอกสาร
          </button>
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('counter');
                setShowMobileMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'counter' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              🏢 จุดบริการหน้าเคาน์เตอร์ (Staff POS)
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setShowMobileMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'admin' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              🛡️ ผู้ดูแลระบบ (Admin)
            </button>
          )}
          {(user?.role === 'executive' || user?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('executive');
                setShowMobileMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'executive' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              📊 รายงานและแดชบอร์ดผู้บริหาร
            </button>
          )}
        </div>
      )}
    </header>
  );
};