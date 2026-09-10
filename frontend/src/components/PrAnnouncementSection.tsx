import React, { useState, useEffect } from 'react';
import { Announcement } from '../types/index.js';
import { ApiClient } from '../services/api.js';
import {
  Megaphone,
  Bell,
  Calendar,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
  BookOpen,
  Info,
  CheckCircle2,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
  Printer,
  Building2,
  Send,
  CreditCard,
  GraduationCap,
} from 'lucide-react';

interface PrAnnouncementSectionProps {
  onOpenQuickLink?: (link: string) => void;
}

export const PrAnnouncementSection: React.FC<PrAnnouncementSectionProps> = ({ onOpenQuickLink }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalItem, setActiveModalItem] = useState<Announcement | null>(null);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);
  const [isTickerDismissed, setIsTickerDismissed] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [selectedCategory]);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getAnnouncements(selectedCategory);
      if (res.data && res.data.length > 0) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch announcements from API, using fallback data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Find top urgent or pinned item for ticker
  const topPinnedItem = announcements.find((a) => a.is_pinned || a.category === 'urgent') || announcements[0];

  // Featured Item for Left Card
  const featuredItem = announcements.find((a) => a.is_pinned) || announcements[0];

  // Secondary Items for Right Grid
  const secondaryItems = announcements.filter((a) => a.id !== featuredItem?.id).slice(0, 4);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'urgent':
        return {
          label: 'ประกาศด่วน',
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          icon: Bell,
        };
      case 'academic':
        return {
          label: 'การศึกษา & จบ',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: GraduationCap,
        };
      case 'guide':
        return {
          label: 'คู่มือ & บริการ',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: BookOpen,
        };
      default:
        return {
          label: 'ข่าวประชาสัมพันธ์',
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500',
          icon: Info,
        };
    }
  };

  const formatDateThai = (dateStr?: string) => {
    if (!dateStr) return 'ล่าสุด';
    try {
      const date = new Date(dateStr);
      const months = [
        'ม.ค.',
        'ก.พ.',
        'มี.ค.',
        'เม.ย.',
        'พ.ค.',
        'มิ.ย.',
        'ก.ค.',
        'ส.ค.',
        'ก.ย.',
        'ต.ค.',
        'พ.ย.',
        'ธ.ค.',
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 mb-8">
      {/* 1. URGENT ANNOUNCEMENT TICKER / ALERT RIBBON */}
      {!isTickerDismissed && topPinnedItem && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-600/10 to-amber-500/15 border-2 border-[#FFC72C]/70 rounded-2xl p-3 sm:px-4 shadow-sm backdrop-blur-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FFC72C] to-amber-300 text-emerald-950 flex items-center justify-center font-black shrink-0 shadow-sm ring-2 ring-white">
              <Megaphone className="w-4 h-4 text-[#004d26]" />
            </div>

            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#006633] text-[#FFC72C] text-[10px] font-black uppercase tracking-wider shrink-0 self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFC72C] animate-ping" />
                <span>ประกาศสำคัญ</span>
              </span>

              <p className="text-xs font-bold text-slate-900 truncate">
                {topPinnedItem.title}
              </p>

              {topPinnedItem.summary && (
                <span className="text-xs text-slate-600 hidden md:inline truncate">
                  — {topPinnedItem.summary}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveModalItem(topPinnedItem)}
              className="px-3 py-1.5 bg-[#006633] hover:bg-[#004d26] text-white text-[11px] font-bold rounded-xl shadow transition flex items-center space-x-1"
            >
              <span>ดูประกาศ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsTickerDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
              title="ซ่อนแถบแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN PR & ANNOUNCEMENT SHOWCASE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition">
        {/* Header with Title, Category Filter & Collapse Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1.5 rounded-xl bg-emerald-100 text-[#006633]">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#006633] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                KU CSC PR & ANNOUNCEMENTS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ข่าวสารและประชาสัมพันธ์ งานบริการการศึกษา
            </h3>
            <p className="text-xs text-slate-500">
              ประกาศสำคัญ กำหนดการ และแนวปฏิบัติการขอเอกสารทางการศึกษา มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จ.สกลนคร
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'urgent', label: '🔥 ประกาศด่วน' },
                { id: 'academic', label: '🎓 สำเร็จการศึกษา' },
                { id: 'guide', label: '💡 คู่มือ & e-Doc' },
                { id: 'general', label: '🏛️ ข้อมูลทั่วไป' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition ${
                    selectedCategory === tab.id
                      ? 'bg-[#006633] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Collapse/Expand toggle */}
            <button
              onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1 text-xs font-semibold shrink-0"
              title={isSectionCollapsed ? 'ขยายข่าวสาร' : 'ย่อข่าวสาร'}
            >
              {isSectionCollapsed ? (
                <>
                  <span className="hidden sm:inline">แสดง</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">ย่อ</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Section (Expandable) */}
        {!isSectionCollapsed && (
          <div className="pt-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT COLUMN: Featured Hero Announcement Card */}
              {featuredItem && (
                <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-[#004d26] via-[#006633] to-[#003d1e] text-white shadow-md relative overflow-hidden group">
                  {/* Subtle Background Accent Pattern */}
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                    <GraduationCap className="w-64 h-64 text-[#FFC72C]" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#FFC72C] text-[#004d26] text-xs font-black shadow uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#004d26]" />
                        <span>{featuredItem.badge_text || 'ข่าวเด่นประจำสัปดาห์'}</span>
                      </span>

                      <span className="text-[11px] text-emerald-200 font-mono flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateThai(featuredItem.publish_date || featuredItem.created_at)}</span>
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-white mb-2.5 leading-snug group-hover:text-amber-300 transition">
                      {featuredItem.title}
                    </h4>

                    <p className="text-xs text-emerald-100 leading-relaxed mb-6 line-clamp-3">
                      {featuredItem.summary || featuredItem.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-200">
                      โดย: งานบริการการศึกษา มก.ฉกส.
                    </span>

                    <button
                      onClick={() => setActiveModalItem(featuredItem)}
                      className="px-4 py-2 bg-[#FFC72C] hover:bg-amber-400 active:scale-95 text-[#004d26] font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition"
                    >
                      <span>อ่านประกาศฉบับเต็ม</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* RIGHT COLUMN: Grid of Secondary Announcements */}
              <div className="lg:col-span-6 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {secondaryItems.map((item) => {
                  const badge = getCategoryBadge(item.category);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveModalItem(item)}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-[#006633] bg-slate-50/50 hover:bg-white transition cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{item.badge_text || badge.label}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateThai(item.publish_date || item.created_at)}</span>
                          </span>
                        </div>

                        <h5 className="font-bold text-xs text-slate-900 mb-1.5 line-clamp-2 group-hover:text-[#006633] transition">
                          {item.title}
                        </h5>

                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
                          {item.summary || item.content}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">ดูรายละเอียด</span>
                        <span className="font-bold text-[#006633] group-hover:translate-x-0.5 transition flex items-center">
                          อ่านต่อ <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. ANNOUNCEMENT DETAIL MODAL */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#004d26] to-[#006633] text-white flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFC72C] text-[#004d26] text-[11px] font-black">
                    {activeModalItem.badge_text || getCategoryBadge(activeModalItem.category).label}
                  </span>
                  <span className="text-xs text-emerald-200 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>เผยแพร่เมื่อ: {formatDateThai(activeModalItem.publish_date || activeModalItem.created_at)}</span>
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg leading-snug">
                  {activeModalItem.title}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">
                  มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
                </p>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-xl transition shrink-0 ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeModalItem.summary && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-emerald-950 font-medium">
                  {activeModalItem.summary}
                </div>
              )}

              <div className="space-y-3 whitespace-pre-line text-slate-800 leading-relaxed font-sans">
                {activeModalItem.content}
              </div>

              {/* Official Contact Card */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 block">
                  ช่องทางติดต่อสอบถามข้อมูลเพิ่มเติม:
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-slate-600">
                  <span className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#006633]" />
                    <span>งานบริการการศึกษา อาคาร 14 (บริหาร)</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span>📞 โทรศัพท์: 042-725-000 ต่อ 5000</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span>✉️ อีเมล: csc_service@ku.th</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ระบบขอเอกสารทางการศึกษาออนไลน์ (KU CSC e-Doc)
              </span>

              <button
                onClick={() => setActiveModalItem(null)}
                className="px-5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
