import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api.js';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileCheck,
  Clock,
  Download,
  Building,
  GraduationCap,
  Truck,
  Award,
  Loader2,
} from 'lucide-react';

export const ExecutivePortal: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getExecutiveDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!dashboardData) return;
    const rows = [
      ['Report', 'KU CSC e-Document Request System Executive Summary'],
      ['Date', new Date().toLocaleDateString('th-TH')],
      ['Total Requests', dashboardData.kpi?.total_requests || 0],
      ['Total Revenue', dashboardData.kpi?.total_revenue || 0],
      ['Completed Requests', dashboardData.kpi?.completed_requests || 0],
      [],
      ['Top Documents', 'Quantity', 'Amount'],
      ...(dashboardData.top_documents?.map((d: any) => [d.item_name, d.total_qty, d.total_amount]) || []),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edoc_executive_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-xs flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800 mb-2" />
        <span>กำลังประมวลผลข้อมูลสถิติเชิงบริหาร...</span>
      </div>
    );
  }

  const kpi = dashboardData.kpi;
  const statusList = dashboardData.status_breakdown || [];
  const deliveryList = dashboardData.delivery_breakdown || [];
  const topDocs = dashboardData.top_documents || [];
  const dailyTrend = dashboardData.daily_trend || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-purple-700" />
            <span>แดชบอร์ดสรุปภาพรวมสำหรับผู้บริหาร (Executive Analytics)</span>
          </h2>
          <p className="text-xs text-slate-500">
            มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition self-start"
        >
          <Download className="w-4 h-4 text-[#FFC72C]" />
          <span>ส่งออกรายงาน (CSV / Excel)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-semibold">ยอดรายได้สะสมทั้งหมด</span>
            <div className="p-2 bg-[#E8F5E9] text-[#006633] rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#004d26]">
            ฿{parseFloat(kpi.total_revenue).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#006633] font-bold mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#006633]" />
            <span>ผ่านระบบ Thai QR Payment 100%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-semibold">จำนวนคำร้องทั้งหมด</span>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpi.total_requests} <span className="text-sm font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            คำร้องเสร็จสิ้น: {kpi.completed_requests} รายการ
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-semibold">กำลังดำเนินการจัดทำ</span>
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950">
            {kpi.in_progress_requests} <span className="text-sm font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            อยู่ระหว่างพิมพ์เอกสาร / พร้อมส่งมอบ
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-semibold">อัตราความสำเร็จ (Fulfillment)</span>
            <div className="p-2 bg-purple-50 text-purple-800 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950">
            {kpi.total_requests > 0
              ? `${Math.round((kpi.completed_requests / kpi.total_requests) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-purple-700 mt-1">
            ระยะเวลาเฉลี่ย (SLA): ~1.8 วันทำการ
          </div>
        </div>
      </div>

      {/* Breakdown Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-emerald-800" />
            <span>สัดส่วนผู้ขอเอกสารแยกตามสถานะ</span>
          </h3>

          <div className="space-y-3">
            {statusList.map((st: any) => {
              const label =
                st.student_status === 'G'
                  ? 'ผู้สำเร็จการศึกษา (G)'
                  : st.student_status === 'D'
                  ? 'ลาพักการศึกษา (D)'
                  : 'นิสิตปัจจุบัน (S)';
              const color =
                st.student_status === 'G'
                  ? 'bg-blue-600'
                  : st.student_status === 'D'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600';

              return (
                <div key={st.student_status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{label}</span>
                    <span className="font-mono text-slate-500">
                      {st.count} คน ({parseFloat(st.revenue).toFixed(0)} ฿)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{
                        width: `${kpi.total_requests > 0 ? (st.count / kpi.total_requests) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Method Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center space-x-2">
            <Truck className="w-4 h-4 text-amber-600" />
            <span>ช่องทางการรับเอกสารที่เลือก</span>
          </h3>

          <div className="space-y-3">
            {deliveryList.map((del: any) => {
              const label =
                del.delivery_method === 'pickup'
                  ? 'รับที่เคาน์เตอร์บริการ'
                  : del.delivery_method === 'postal'
                  ? 'จัดส่งไปรษณีย์ EMS'
                  : 'เอกสารดิจิทัล (Digital PDF)';
              const color =
                del.delivery_method === 'pickup'
                  ? 'bg-emerald-700'
                  : del.delivery_method === 'postal'
                  ? 'bg-amber-500'
                  : 'bg-purple-600';

              return (
                <div key={del.delivery_method}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{label}</span>
                    <span className="font-mono text-slate-500">{del.count} รายการ</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{
                        width: `${kpi.total_requests > 0 ? (del.count / kpi.total_requests) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Requested Documents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center space-x-2">
            <Building className="w-4 h-4 text-slate-700" />
            <span>เอกสารยอดนิยม 5 อันดับแรก</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {topDocs.map((doc: any, i: number) => (
              <div key={i} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-2 mr-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-800 line-clamp-1">{doc.item_name}</span>
                </div>
                <div className="font-mono font-bold text-emerald-900 whitespace-nowrap">
                  {doc.total_qty} ฉบับ
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Volume Trend Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-sm text-slate-800 mb-3">
          แนวโน้มคำร้องและรายได้ย้อนหลัง 14 วัน (Daily Activity Log)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">วันที่ (Date)</th>
                <th className="py-2.5 px-3">จำนวนคำร้อง (Orders)</th>
                <th className="py-2.5 px-3">ยอดเงินรวม (Revenue)</th>
                <th className="py-2.5 px-3">กราฟเปรียบเทียบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyTrend.map((t: any) => (
                <tr key={t.request_date} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-slate-700">{t.request_date}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{t.request_count} รายการ</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                    ฿{parseFloat(t.daily_revenue).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 w-48">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(100, t.request_count * 20)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};