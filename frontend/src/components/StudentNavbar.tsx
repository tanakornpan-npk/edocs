import React, { useState } from 'react';
import { User } from '../types/index.js';
import { KuLogo } from './KuLogo.js';
import {
  GraduationCap,
  Package,
  Clock,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Search,
  Building2,
  Sparkles,
} from 'lucide-react';

interface StudentNavbarProps {
  user: User | null;
  activeSection: 'catalog' | 'packages' | 'tracking';
  onSelectSection: (section: 'catalog' | 'packages' | 'tracking') => void;
  cartCount: number;
  onOpenCart: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  user,
  activeSection,
  onSelectSection,
  cartCount,
  onOpenCart,
  onLogout,
  onOpenLogin,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getStudentBadge = () => {
    if (!user) return null;
    if (user.status_code === 'G') {
      return {
        label: 'นิสิตเก่า (G)',
        badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300',
      };
    }
    if (user.status_code === 'D') {
      return {
        label: 'นิสิตลาพัก (D)',
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
      };
    }
    return {
      label: 'นิสิตปัจจุบัน (S)',
      badgeClass: 'bg-[#E8F5E9] text-[#006633] border border-[#A5D6A7]',
    };
  };

  const badgeInfo = getStudentBadge();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200 select-none">
      {/* 1. Top Mini Utility Bar (KU Official Style) */}
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
          onClick={() => onSelectSection('catalog')}
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

        {/* Center/Right Decorative Ribbon */}
        <div className="hidden xl:flex items-center space-x-3 bg-[#F4F8F5] border border-[#C8E6C9] rounded-2xl px-4 py-2">
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

        {/* Right Tools: Cart, Profile / Login */}
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

          {/* User Profile / Status / Logout */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800">
                  {user.first_name_th} {user.last_name_th}
                </div>
                {badgeInfo && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeInfo.badgeClass}`}>
                    {badgeInfo.label}
                  </span>
                )}
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
              className="bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <span>เข้าสู่ระบบนิสิต</span>
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

      {/* 3. Student-Only Navigation Menu Bar (NO Staff, NO Admin, NO Exec) */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden md:flex items-center space-x-2 h-12">
            <button
              onClick={() => onSelectSection('catalog')}
              className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                activeSection === 'catalog'
                  ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                  : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#006633]" />
              <span>ขอเอกสารเดี่ยว (Catalog)</span>
            </button>

            <button
              onClick={() => onSelectSection('packages')}
              className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                activeSection === 'packages'
                  ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                  : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
              }`}
            >
              <Package className="w-4 h-4 text-[#E5A823]" />
              <span>แพ็กเกจรวมสุดคุ้ม (Bundle)</span>
            </button>

            <button
              onClick={() => onSelectSection('tracking')}
              className={`flex items-center space-x-2 px-4 h-full text-xs sm:text-sm transition border-b-[3px] ${
                activeSection === 'tracking'
                  ? 'border-[#006633] text-[#006633] bg-[#F4F8F5] font-black'
                  : 'border-transparent text-slate-700 hover:text-[#006633] hover:bg-slate-50 font-medium'
              }`}
            >
              <Clock className="w-4 h-4 text-[#006633]" />
              <span>ติดตามสถานะคำร้อง & ใบเสร็จ</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="md:hidden bg-slate-50 border-t border-slate-200 px-4 py-3 space-y-1">
          <button
            onClick={() => {
              onSelectSection('catalog');
              setShowMobileMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'catalog' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎓 ขอเอกสารเดี่ยว (Catalog)
          </button>

          <button
            onClick={() => {
              onSelectSection('packages');
              setShowMobileMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'packages' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            ⭐ แพ็กเกจรวมสุดคุ้ม (Bundle)
          </button>

          <button
            onClick={() => {
              onSelectSection('tracking');
              setShowMobileMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'tracking' ? 'bg-[#E8F5E9] text-[#006633]' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            📋 ติดตามสถานะคำร้อง & ใบเสร็จ
          </button>
        </div>
      )}
    </header>
  );
};
