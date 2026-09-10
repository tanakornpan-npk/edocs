import React from 'react';
import { KuLogo } from './KuLogo.js';
import { MapPin, Phone, Mail, Globe, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#004D26] text-white select-none relative overflow-hidden border-t-4 border-[#FFC72C] mt-16">
      {/* Background Graphic Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#FFC72C_1.5px,transparent_1.5px)] [background-size:20px_20px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Identity & About */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white rounded-xl shadow">
                <KuLogo size={42} />
              </div>
              <div>
                <div className="font-black text-sm text-white tracking-wide">
                  มหาวิทยาลัยเกษตรศาสตร์
                </div>
                <div className="text-xs font-bold text-[#FFC72C]">
                  วิทยาเขตเฉลิมพระเกียรติ จ.สกลนคร
                </div>
              </div>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              ระบบขอเอกสารทางการศึกษาออนไลน์ งานบริการการศึกษา
              ให้บริการขอหนังสือรับรอง ทรานสคริปต์ และเอกสารสำคัญทางการศึกษา 24 ชั่วโมง
            </p>
          </div>

          {/* Col 2: Contact Address */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#FFC72C] uppercase tracking-wider">
              สถานที่ติดต่อ
            </h4>
            <div className="flex items-start space-x-2 text-xs text-emerald-100/90 leading-relaxed">
              <MapPin className="w-4 h-4 text-[#FFC72C] flex-shrink-0 mt-0.5" />
              <span>
                อาคาร 1 ชั้น 1 งานบริการการศึกษา มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร 59/4 หมู่ 1 ถ.วปรอ 366 ต.เชียงเครือ อ.เมือง จ.สกลนคร 47000
              </span>
            </div>
          </div>

          {/* Col 3: Phone & Channels */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#FFC72C] uppercase tracking-wider">
              ช่องทางการติดต่อ
            </h4>
            <div className="space-y-1.5 text-xs text-emerald-100/90">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#FFC72C]" />
                <span>โทรศัพท์: 0-4272-5000, 0-4272-5036</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#FFC72C]" />
                <span>อีเมล: edoc.csc@ku.ac.th</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-[#FFC72C]" />
                <span>เว็บไซต์: https://app.csc.ku.ac.th/edoc</span>
              </div>
            </div>
          </div>

          {/* Col 4: Service Standards & Security */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#FFC72C] uppercase tracking-wider">
              มาตรฐานและความปลอดภัย
            </h4>
            <div className="bg-[#00381B] p-3 rounded-xl border border-[#006633] space-y-1.5 text-xs text-emerald-100/90">
              <div className="flex items-center space-x-1.5 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#FFC72C]" />
                <span>เชื่อมต่อระบบ KU All-login & CSC API</span>
              </div>
              <p className="text-[11px] text-emerald-200/70">
                รองรับมาตรฐานการชำระเงิน EMVCo Thai QR Payment และระบบตรวจสอบเอกสารปลอดภัย
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-8 pt-4 border-t border-[#006633] flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-200/70 gap-2">
          <div>
            © 2026 มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร. สงวนลิขสิทธิ์.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#FFC72C] font-semibold">ระบบสำหรับเจ้าหน้าที่:</span>
            <a href="/staff" className="hover:text-white hover:underline text-emerald-100">
              เคาน์เตอร์บริการ (Staff)
            </a>
            <span className="text-emerald-500">•</span>
            <a href="/admin" className="hover:text-white hover:underline text-emerald-100">
              ผู้ดูแลระบบ (Admin)
            </a>
            <span className="text-emerald-500">•</span>
            <a href="/executive" className="hover:text-white hover:underline text-emerald-100">
              รายงานผู้บริหาร (Executive)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
