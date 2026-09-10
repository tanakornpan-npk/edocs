import React from 'react';
import { User } from '../types/index.js';
import { FileText, Clock, ShoppingCart, Building2, BarChart2 } from 'lucide-react';

interface BottomNavProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  user,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-1.5 px-3">
      <div className="flex items-center justify-around">
        {/* Request Docs Tab */}
        <button
          onClick={() => setActiveTab('student')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'student' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-emerald-700'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight">ขอเอกสาร</span>
        </button>

        {/* My Tracking Tab */}
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'tracking' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-emerald-700'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight">ติดตามสถานะ</span>
        </button>

        {/* Floating / Center Cart Button */}
        <button
          onClick={onOpenCart}
          className="relative -top-3 flex flex-col items-center justify-center p-3 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-full shadow-lg border-4 border-slate-50 active:scale-95 transition"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
              {cartCount}
            </span>
          )}
        </button>

        {/* Staff POS Tab (if staff or admin) */}
        {(user?.role === 'staff' || user?.role === 'admin') && (
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'counter' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">หน้าเคาน์เตอร์</span>
          </button>
        )}

        {/* Executive / Admin Tab */}
        {(user?.role === 'executive' || user?.role === 'admin') && (
          <button
            onClick={() => setActiveTab(user.role === 'admin' ? 'admin' : 'executive')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'admin' || activeTab === 'executive'
                ? 'text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <BarChart2 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">แดชบอร์ด</span>
          </button>
        )}
      </div>
    </nav>
  );
};