import React from 'react';
import { KuLogo } from './KuLogo.js';
import {
  FileText,
  GraduationCap,
  Package,
  Clock,
  QrCode,
  Printer,
  Sparkles,
  Building2,
  CheckCircle2,
  Send,
  Award,
} from 'lucide-react';

interface HeroBannerProps {
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSelectCategory, activeCategory }) => {
  const quickAccessButtons = [
    {
      id: 'transcript',
      label: 'ทรานสคริปต์',
      sublabel: 'Transcript',
      icon: FileText,
      color: 'text-[#006633]',
      borderColor: 'border-[#006633]/60',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'status_cert',
      label: 'รับรองสถานภาพ',
      sublabel: 'Student Status',
      icon: GraduationCap,
      color: 'text-emerald-700',
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'grad_cert',
      label: 'รับรองสำเร็จการศึกษา',
      sublabel: 'Graduation',
      icon: Award,
      color: 'text-teal-700',
      borderColor: 'border-teal-500',
      bgColor: 'bg-teal-50',
    },
    {
      id: 'packages',
      label: 'แพ็กเกจสุดคุ้ม',
      sublabel: 'Packages Bundle',
      icon: Package,
      color: 'text-[#004d26]',
      borderColor: 'border-[#FFC72C] ring-4 ring-[#FFDF80]/60',
      bgColor: 'bg-[#FFC72C]',
      isCenter: true,
    },
    {
      id: 'tracking',
      label: 'ติดตามคำร้อง',
      sublabel: 'Track Status',
      icon: Clock,
      color: 'text-[#006633]',
      borderColor: 'border-[#006633]/60',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'payment',
      label: 'ชำระเงิน QR',
      sublabel: 'Thai QR Pay',
      icon: QrCode,
      color: 'text-emerald-800',
      borderColor: 'border-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'receipt',
      label: 'ใบเสร็จรับเงิน',
      sublabel: 'Official Receipt',
      icon: Printer,
      color: 'text-[#006633]',
      borderColor: 'border-[#006633]/60',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'counter',
      label: 'เคาน์เตอร์บริการ',
      sublabel: 'Counter POS',
      icon: Building2,
      color: 'text-slate-700',
      borderColor: 'border-slate-400',
      bgColor: 'bg-slate-100',
    },
  ];

  return (
    <div className="relative mb-14 select-none">
      {/* Hero Visual Area with Authentic KU CSC Curves & Colors */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#004d26] via-[#006633] to-[#004d26] text-white pt-8 pb-20 px-4 sm:px-6 lg:px-8 shadow-xl">
        {/* Dynamic Graphic Wave Background matching reference */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
            <path
              d="M0,192L60,186.7C120,181,240,171,360,186.7C480,203,600,245,720,245.3C840,245,960,203,1080,181.3C1200,160,1320,160,1380,160L1440,160L1440,400L1380,400C1320,400,1200,400,1080,400C960,400,840,400,720,400C600,400,480,400,360,400C240,400,120,400,60,400L0,400Z"
              fill="#FFC72C"
            />
            <path
              d="M0,128L60,149.3C120,171,240,213,360,208C480,203,600,149,720,138.7C840,128,960,160,1080,176C1200,192,1320,192,1380,192L1440,192L1440,400L1380,400C1320,400,1200,400,1080,400C960,400,840,400,720,400C600,400,480,400,360,400C240,400,120,400,60,400L0,400Z"
              fill="#008744"
              fillOpacity="0.5"
            />
          </svg>
        </div>

        {/* Halftone Dot Pattern Accents (as seen in the KU reference image) */}
        <div className="absolute left-3 bottom-3 w-44 h-44 opacity-20 pointer-events-none bg-[radial-gradient(#FFC72C_2.5px,transparent_2.5px)] [background-size:14px_14px]"></div>
        <div className="absolute right-6 top-3 w-48 h-48 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_2.5px,transparent_2.5px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Academic & Future Highlights */}
            <div className="lg:col-span-4 space-y-3">
              <div className="inline-flex items-center space-x-1.5 bg-[#FFC72C] text-[#004d26] px-3 py-1 rounded-full text-xs font-black shadow uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#004d26]" />
                <span>ด้านการศึกษาและเอกสารดิจิทัล</span>
              </div>

              <div className="space-y-2">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 hover:bg-white/15 transition flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFC72C] text-[#004d26] flex items-center justify-center font-bold flex-shrink-0 shadow">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">ขอเอกสารสะดวกรวดเร็ว</h4>
                    <p className="text-[11px] text-emerald-100">Transcript / หนังสือรับรอง ยื่นออนไลน์ 24 ชม.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 hover:bg-white/15 transition flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#008744] text-white flex items-center justify-center font-bold flex-shrink-0 shadow">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">ชำระเงินผ่าน Thai QR Payment</h4>
                    <p className="text-[11px] text-emerald-100">สแกนจ่ายผ่าน Mobile Banking ได้ทุกธนาคาร</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: Main Title & Identity */}
            <div className="lg:col-span-4 text-center py-2">
              <div className="inline-block p-2.5 bg-white rounded-2xl shadow-2xl border-2 border-[#FFC72C] mb-2">
                <KuLogo size={70} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1 drop-shadow-sm">
                ระบบขอเอกสารทางการศึกษาออนไลน์
              </h1>
              <h2 className="text-xs sm:text-sm font-bold text-[#FFC72C] mb-2">
                มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
              </h2>
              <p className="text-xs text-emerald-100 max-w-sm mx-auto leading-relaxed">
                บริการขอเอกสารสำคัญทางการศึกษาสำหรับนิสิตปัจจุบัน นิสิตลาพัก และผู้สำเร็จการศึกษา สะดวก รวดเร็ว ตรวจสอบได้
              </p>
            </div>

            {/* Right Column: Campus Life & Delivery Highlights */}
            <div className="lg:col-span-4 space-y-3">
              <div className="inline-flex items-center space-x-1.5 bg-[#008744] text-white px-3 py-1 rounded-full text-xs font-black shadow uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FFC72C]" />
                <span>ช่องทางการรับเอกสารครบครัน</span>
              </div>

              <div className="space-y-2">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 hover:bg-white/15 transition flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFC72C] text-[#004d26] flex items-center justify-center font-bold flex-shrink-0 shadow">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">รับด้วยตนเองที่วิทยาเขต</h4>
                    <p className="text-[11px] text-emerald-100">เคาน์เตอร์บริการงานบริการการศึกษา มก.ฉกส.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 hover:bg-white/15 transition flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#008744] text-white flex items-center justify-center font-bold flex-shrink-0 shadow">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">จัดส่งไปรษณีย์ด่วนพิเศษ (EMS)</h4>
                    <p className="text-[11px] text-emerald-100">ส่งตรงถึงบ้าน พร้อมเลข Tracking ติดตามพัสดุ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Quick Access Buttons (Overlapping bottom edge like the KU CSC template) */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="flex items-end justify-center gap-2 sm:gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
          {quickAccessButtons.map((btn) => {
            const Icon = btn.icon;
            const isCenter = btn.isCenter;
            const isActive = activeCategory === btn.id;

            return (
              <button
                key={btn.id}
                onClick={() => onSelectCategory(btn.id)}
                className="flex flex-col items-center group flex-shrink-0 focus:outline-none"
              >
                <div
                  className={`relative rounded-full flex items-center justify-center shadow-lg transition duration-200 transform group-hover:-translate-y-1.5 group-active:scale-95 ${
                    isCenter
                      ? 'w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#FFC72C] to-[#FFE885] text-[#004d26] border-4 border-white ring-4 ring-[#FFC72C]/70 shadow-xl'
                      : `w-12 h-12 sm:w-15 sm:h-15 bg-white ${btn.color} border-2 ${btn.borderColor} hover:shadow-xl`
                  } ${isActive ? 'ring-4 ring-[#006633] scale-105' : ''}`}
                >
                  <Icon className={isCenter ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-5 h-5 sm:w-6 sm:h-6'} />
                  {isCenter && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006633] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-[#006633] border border-white"></span>
                    </span>
                  )}
                </div>

                <span
                  className={`mt-2 text-[11px] sm:text-xs font-bold text-center tracking-tight transition line-clamp-1 ${
                    isActive || isCenter ? 'text-[#004d26] font-black' : 'text-slate-700 group-hover:text-[#006633]'
                  }`}
                >
                  {btn.label}
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:block">
                  {btn.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};