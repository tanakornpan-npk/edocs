import React, { useState, useEffect } from 'react';
import { DocumentType, DocumentPackage, DocumentRequest } from '../types/index.js';
import { ApiClient } from '../services/api.js';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileCheck,
  Clock,
  Download,
  GraduationCap,
  Truck,
  Award,
  FileText,
  Package,
  Upload,
  UserPlus,
  Trash2,
  UserCheck,
  Plus,
  Edit2,
  FileSpreadsheet,
  Users,
  Loader2,
  Filter,
  Search,
  Check,
  Layers,
  ClipboardList,
  Eye,
  Printer,
  X,
  AlertCircle,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Calendar,
  Send,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface AdminPortalProps {
  onViewReceipt?: (orderNo: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onViewReceipt }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'requests' | 'docs' | 'packages' | 'rules' | 'staff'>('dashboard');
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [packages, setPackages] = useState<DocumentPackage[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Requests Management State
  const [orders, setOrders] = useState<DocumentRequest[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderStudentTypeFilter, setOrderStudentTypeFilter] = useState<'all' | 'S' | 'D' | 'G'>('all');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState<'all' | 'pickup' | 'postal' | 'digital'>('all');

  // Status Update Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<DocumentRequest | null>(null);
  const [statusModalNewStatus, setStatusModalNewStatus] = useState<string>('processing');
  const [statusModalTrackingNo, setStatusModalTrackingNo] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<DocumentRequest | null>(null);

  // Filter & Search
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState<'all' | 'S' | 'D' | 'G'>('all');

  // Edit/Add Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState<any>({
    id: '',
    code: '',
    name_th: '',
    name_en: '',
    description: '',
    price: 50,
    processing_days: 2,
    format: 'both',
    allowed_statuses: ['S', 'D', 'G'],
  });

  // Edit/Add Package Modal
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState<any>({
    id: '',
    code: '',
    name_th: '',
    description: '',
    package_price: 150,
    is_restricted_whitelist: false,
    allowed_statuses: ['G'],
    items: [],
  });

  // Excel Whitelist Upload Modal
  const [selectedPkgForUpload, setSelectedPkgForUpload] = useState<DocumentPackage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [whitelistMembers, setWhitelistMembers] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Add Staff / Executive Form
  const [staffUsername, setStaffUsername] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<'staff' | 'executive' | 'admin'>('staff');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'staff' | 'executive' | 'admin'>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [orderStatusFilter]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [docs, pkgs, staff, dash, ords] = await Promise.all([
        ApiClient.getDocuments(),
        ApiClient.getPackages(),
        ApiClient.getStaffList(),
        ApiClient.getExecutiveDashboard().catch(() => ({ data: null })),
        ApiClient.getCounterOrders().catch(() => ({ data: [] })),
      ]);
      setDocuments(docs.data || []);
      setPackages(pkgs.data || []);
      setStaffList(staff.data || []);
      if (dash && dash.data) {
        setDashboardData(dash.data);
      }
      if (ords && ords.data) {
        setOrders(ords.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const res = await ApiClient.getCounterOrders({
        status: orderStatusFilter === 'all' ? undefined : orderStatusFilter,
        search: orderSearch || undefined,
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderNo: string, newStatus: string, trackingNo?: string) => {
    setIsUpdatingStatus(true);
    try {
      await ApiClient.updateOrderStatus(orderNo, newStatus, trackingNo);
      await Promise.all([loadOrders(), loadAllData()]);
      setIsStatusModalOpen(false);
      setSelectedOrderForStatus(null);
    } catch (err: any) {
      alert('ไม่สามารถอัปเดตสถานะคำร้องได้: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenStatusModal = (order: DocumentRequest) => {
    setSelectedOrderForStatus(order);
    setStatusModalNewStatus(order.status);
    setStatusModalTrackingNo(order.postal_tracking_no || '');
    setIsStatusModalOpen(true);
  };

  const handleOpenDetailModal = (order: DocumentRequest) => {
    setSelectedOrderForDetail(order);
    setIsDetailModalOpen(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.allowed_statuses || docForm.allowed_statuses.length === 0) {
      alert('กรุณาเลือกประเภทผู้ขอเอกสารอย่างน้อย 1 สถานะ (S, D หรือ G)');
      return;
    }
    try {
      await ApiClient.saveDocument(docForm);
      setIsDocModalOpen(false);
      loadAllData();
      alert(docForm.id ? 'แก้ไขข้อมูลเอกสารสำเร็จ' : 'เพิ่มประเภทเอกสารใหม่สำเร็จ');
    } catch (err: any) {
      alert('บันทึกเอกสารไม่สำเร็จ: ' + err.message);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgForm.allowed_statuses || pkgForm.allowed_statuses.length === 0) {
      alert('กรุณาเลือกประเภทผู้ขอเอกสารอย่างน้อย 1 สถานะ');
      return;
    }
    if (!pkgForm.items || pkgForm.items.length === 0) {
      alert('กรุณาเลือกรายการเอกสารจากแคตตาล็อกอย่างน้อย 1 รายการสำหรับแพ็กเกจนี้');
      return;
    }
    try {
      await ApiClient.savePackage(pkgForm);
      setIsPkgModalOpen(false);
      loadAllData();
      alert(pkgForm.id ? 'แก้ไขแพ็กเกจสำเร็จ' : 'สร้างแพ็กเกจเหมาจ่ายใหม่สำเร็จ');
    } catch (err: any) {
      alert('บันทึกแพ็กเกจไม่สำเร็จ: ' + err.message);
    }
  };

  const handleUploadWhitelist = async () => {
    if (!selectedPkgForUpload || !selectedFile) return;
    setIsUploading(true);
    setUploadStatus('กำลังอัปโหลดและประมวลผลไฟล์ Excel...');
    try {
      const res = await ApiClient.uploadWhitelist(selectedPkgForUpload.id, selectedFile);
      setUploadStatus(`สำเร็จ! นำเข้ารายชื่อทั้งหมด ${res.count} คน เรียบร้อย`);
      loadWhitelistMembers(selectedPkgForUpload.id);
      loadAllData();
    } catch (err: any) {
      setUploadStatus('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadWhitelistMembers = async (pkgId: string) => {
    try {
      const res = await ApiClient.getWhitelist(pkgId);
      setWhitelistMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername.trim()) return;
    const defaultTitle =
      staffRole === 'executive'
        ? 'ผู้บริหาร'
        : staffRole === 'admin'
        ? 'ผู้ดูแลระบบ'
        : 'เจ้าหน้าที่เคาน์เตอร์';

    try {
      const res = await ApiClient.addStaff({
        username: staffUsername.trim(),
        first_name_th: staffName.trim() || defaultTitle,
        phone_number: staffPhone.trim() || '',
        role: staffRole,
      });
      setStaffUsername('');
      setStaffName('');
      setStaffPhone('');
      loadAllData();
      alert(res.message || 'บันทึกและมอบหมายสิทธิ์สำเร็จ');
    } catch (err: any) {
      alert('เพิ่ม/มอบหมายสิทธิ์ไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteStaff = async (id: string, username: string, role: string) => {
    const roleName =
      role === 'executive'
        ? 'ผู้บริหาร (Executive)'
        : role === 'admin'
        ? 'ผู้ดูแลระบบ (Admin)'
        : 'เจ้าหน้าที่เคาน์เตอร์ (Staff)';

    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกสิทธิ์ของ '${username}' (${roleName})?`)) {
      return;
    }

    try {
      const res = await ApiClient.deleteStaff(id);
      loadAllData();
      alert(res.message || 'ยกเลิกสิทธิ์เรียบร้อย');
    } catch (err: any) {
      alert('ไม่สามารถยกเลิกสิทธิ์ได้: ' + err.message);
    }
  };

  const handleExportCsv = () => {
    if (!dashboardData) return;
    const rows = [
      ['รายงานสรุปภาพรวมสำหรับผู้ดูแลระบบ (Admin & Executive Report)'],
      ['วันที่พิมพ์รายงาน', new Date().toLocaleDateString('th-TH')],
      ['จำนวนคำร้องขอเอกสารรวม', dashboardData.kpi?.total_requests || 0],
      ['รายได้ค่าธรรมเนียมรวม (บาท)', dashboardData.kpi?.total_revenue || 0],
      ['คำร้องที่ดำเนินการเสร็จสิ้น', dashboardData.kpi?.completed_requests || 0],
      [],
      ['รายการเอกสารยอดนิยม', 'จำนวนที่ขอ (ฉบับ)', 'ยอดเงินรวม (บาท)'],
      ...(dashboardData.top_documents?.map((d: any) => [d.item_name, d.total_qty, d.total_amount]) || []),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edoc_admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      doc.code.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.name_th.toLowerCase().includes(docSearch.toLowerCase()) ||
      (doc.name_en && doc.name_en.toLowerCase().includes(docSearch.toLowerCase()));
    const matchStatus = docStatusFilter === 'all' || doc.allowed_statuses.includes(docStatusFilter);
    return matchSearch && matchStatus;
  });

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const q = orderSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      order.order_no.toLowerCase().includes(q) ||
      order.student_id.toLowerCase().includes(q) ||
      order.student_name.toLowerCase().includes(q) ||
      (order.postal_tracking_no && order.postal_tracking_no.toLowerCase().includes(q));

    const matchStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    const matchStudentType = orderStudentTypeFilter === 'all' || order.student_status === orderStudentTypeFilter;
    const matchDelivery = orderDeliveryFilter === 'all' || order.delivery_method === orderDeliveryFilter;

    return matchQuery && matchStatus && matchStudentType && matchDelivery;
  });

  // Filtered staff & executive users
  const filteredStaff = staffList.filter((s) => {
    if (staffRoleFilter === 'all') return true;
    return s.role === staffRoleFilter;
  });

  const handleExportOrdersCsv = () => {
    const rows = [
      ['รายงานข้อมูลคำร้องขอเอกสารทางการศึกษา (KU CSC e-Doc Requests)'],
      ['วันที่ส่งออกข้อมูล', new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH')],
      ['จำนวนคำร้องทั้งหมดที่ส่งออก', filteredOrders.length],
      [],
      ['หมายเลขคำร้อง', 'วันที่ยื่น', 'รหัสนิสิต', 'ชื่อผู้ส่งคำร้อง', 'ประเภทผู้ขอ', 'คณะ/สาขา', 'ช่องทางการรับ', 'ที่อยู่จัดส่ง', 'เลขพัสดุ EMS', 'ยอดเงินรวม (บาท)', 'สถานะคำร้อง', 'รายการเอกสาร'],
      ...filteredOrders.map((o) => [
        o.order_no,
        new Date(o.created_at).toLocaleString('th-TH'),
        o.student_id,
        o.student_name,
        o.student_status === 'S' ? 'นิสิตปัจจุบัน (S)' : o.student_status === 'D' ? 'ลาพักการศึกษา (D)' : 'ผู้สำเร็จการศึกษา (G)',
        `${o.faculty_name || '-'} / ${o.department_name || '-'}`,
        o.delivery_method === 'pickup' ? 'รับที่เคาน์เตอร์' : o.delivery_method === 'postal' ? 'ไปรษณีย์ด่วนพิเศษ EMS' : 'ดิจิทัล PDF',
        o.shipping_address ? `"${o.shipping_address.replace(/"/g, '""')}"` : '-',
        o.postal_tracking_no || '-',
        parseFloat(String(o.total_amount)).toFixed(2),
        o.status,
        o.items?.map((it) => `${it.item_name} (x${it.quantity})`).join('; ') || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edoc_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">สำเร็จแล้ว</span>;
      case 'ready_for_pickup':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">พร้อมรับที่เคาน์เตอร์</span>;
      case 'shipped':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">จัดส่งไปรษณีย์แล้ว</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">กำลังจัดทำเอกสาร</span>;
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">ชำระเงินแล้ว</span>;
      case 'pending_payment':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">รอชำระเงิน</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">ยกเลิกคำร้อง</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getStudentTypeBadge = (status: string) => {
    switch (status) {
      case 'S':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">นิสิต (S)</span>;
      case 'D':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">ลาพัก (D)</span>;
      case 'G':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">บัณฑิต (G)</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Sub-tab Navigation (Full Width Row) */}
      <div className="w-full bg-slate-100/90 p-1.5 rounded-2xl shadow-inner border border-slate-200/60 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl transition text-xs sm:text-sm font-bold ${
              activeSubTab === 'dashboard'
                ? 'bg-[#006633] text-white shadow-md'
                : 'text-slate-600 hover:text-[#006633] hover:bg-white/70'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="truncate">แดชบอร์ด & รายงาน</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl transition text-xs sm:text-sm font-bold ${
              activeSubTab === 'requests'
                ? 'bg-[#006633] text-white shadow-md'
                : 'text-slate-600 hover:text-[#006633] hover:bg-white/70'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="truncate">คำร้องขอเอกสาร ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('docs')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl transition text-xs sm:text-sm font-bold ${
              activeSubTab === 'docs'
                ? 'bg-[#006633] text-white shadow-md'
                : 'text-slate-600 hover:text-[#006633] hover:bg-white/70'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">แคตตาล็อก & ราคา ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('packages')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl transition text-xs sm:text-sm font-bold ${
              activeSubTab === 'packages'
                ? 'bg-[#006633] text-white shadow-md'
                : 'text-slate-600 hover:text-[#006633] hover:bg-white/70'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span className="truncate">แพ็กเกจ ({packages.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl transition text-xs sm:text-sm font-bold ${
              activeSubTab === 'rules'
                ? 'bg-[#006633] text-white shadow-md'
                : 'text-slate-600 hover:text-[#006633] hover:bg-white/70'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate">สิทธิ์ผู้ขอ (S/D/G)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('staff')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl transition text-xs sm:text-sm font-bold ${
              activeSubTab === 'staff'
                ? 'bg-[#006633] text-white shadow-md'
                : 'text-slate-600 hover:text-[#006633] hover:bg-white/70'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">เจ้าหน้าที่ & ผู้บริหาร ({staffList.length})</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Interactive Dashboard & Reports */}
      {activeSubTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* Header Action */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#006633]" />
                <span>รายงานภาพรวมคำร้องและสถิติทางการเงิน (Interactive Analytics)</span>
              </h3>
              <p className="text-xs text-slate-500">ข้อมูลสถิติตามเวลาจริงจากฐานข้อมูล PostgreSQL</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-[#FFC72C]" />
              <span>ส่งออกรายงาน (CSV / Excel)</span>
            </button>
          </div>

          {/* 4 Core KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-500">จำนวนคำร้องรวม</span>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {dashboardData.kpi?.total_requests || 0}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                สำเร็จแล้ว {dashboardData.kpi?.completed_requests || 0} รายการ
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-500">รายได้สะสมทั้งหมด</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#006633]">
                ฿{parseFloat(String(dashboardData.kpi?.total_revenue || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ชำระผ่าน PromptPay / QR</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-500">อัตราความสำเร็จ</span>
                <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-900">
                {dashboardData.kpi?.fulfillment_rate || 100}%
              </div>
              <p className="text-[11px] text-blue-700 mt-1">Fulfillment Rate</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-500">ระยะเวลาจัดทำเฉลี่ย</span>
                <div className="p-2 bg-purple-50 text-purple-800 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-900">
                {dashboardData.kpi?.avg_processing_days || 1.8} วัน
              </div>
              <p className="text-[11px] text-purple-700 mt-1">ตามกรอบ SLA ของวิทยาเขต</p>
            </div>
          </div>

          {/* Breakdown: Applicant Types (S / D / G) & Delivery Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Types Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-[#006633]" />
                <span>สัดส่วนผู้ยื่นคำร้องจำแนกตามประเภทนิสิต (S / D / G)</span>
              </h4>
              <div className="space-y-3">
                {dashboardData.status_breakdown?.map((st: any) => {
                  const label =
                    st.student_status === 'S'
                      ? 'นิสิตปัจจุบัน (Status S - กำลังศึกษา)'
                      : st.student_status === 'D'
                      ? 'นิสิตลาพักการศึกษา (Status D - Drop)'
                      : 'ผู้สำเร็จการศึกษา / นิสิตเก่า (Status G - Graduated)';
                  const color =
                    st.student_status === 'S'
                      ? 'bg-emerald-600'
                      : st.student_status === 'D'
                      ? 'bg-amber-500'
                      : 'bg-blue-600';

                  return (
                    <div key={st.student_status}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{label}</span>
                        <span>{st.count} คำร้อง ({st.percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${st.percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Methods Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-emerald-800" />
                <span>สัดส่วนช่องทางการรับเอกสาร</span>
              </h4>
              <div className="space-y-3">
                {dashboardData.delivery_breakdown?.map((del: any) => {
                  const label =
                    del.delivery_method === 'counter'
                      ? 'รับด้วยตนเอง ณ จุดบริการเคาน์เตอร์'
                      : del.delivery_method === 'postal'
                      ? 'จัดส่งไปรษณีย์ด่วนพิเศษ (EMS)'
                      : 'เอกสารดิจิทัล (e-Document PDF)';

                  return (
                    <div key={del.delivery_method}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{label}</span>
                        <span>{del.count} รายการ ({del.percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-700 rounded-full" style={{ width: `${del.percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Documents Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>5 อันดับรายการเอกสารที่มีการขอสูงสุด</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ชื่อรายการเอกสาร</th>
                    <th className="py-2.5 px-3 text-right">จำนวนฉบับ</th>
                    <th className="py-2.5 px-3 text-right">ยอดเงินรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.top_documents?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-800">{item.item_name}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{item.total_qty} ฉบับ</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-[#006633]">
                        ฿{parseFloat(String(item.total_amount || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders in Dashboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                <ClipboardList className="w-4 h-4 text-[#006633]" />
                <span>รายการคำร้องขอล่าสุดจากนิสิต/บัณฑิต (Recent Requests)</span>
              </h4>
              <button
                onClick={() => setActiveSubTab('requests')}
                className="text-xs font-bold text-[#006633] hover:underline flex items-center space-x-1"
              >
                <span>ดูคำร้องทั้งหมด ({orders.length} รายการ)</span>
                <span>&rarr;</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">หมายเลขคำร้อง</th>
                    <th className="py-2.5 px-3">ผู้ยื่นคำร้อง</th>
                    <th className="py-2.5 px-3 text-right">ยอดเงิน</th>
                    <th className="py-2.5 px-3">ช่องทางรับ</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                    <th className="py-2.5 px-3 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                        ยังไม่มีคำร้องในระบบ
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {order.order_no}
                          <div className="text-[10px] text-slate-400 font-sans">
                            {new Date(order.created_at).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                            <span>{order.student_name}</span>
                            {getStudentTypeBadge(order.student_status)}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">{order.student_id}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-[#006633]">
                          ฿{parseFloat(String(order.total_amount)).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {order.delivery_method === 'pickup'
                            ? 'เคาน์เตอร์'
                            : order.delivery_method === 'postal'
                            ? 'ไปรษณีย์ EMS'
                            : 'ดิจิทัล'}
                        </td>
                        <td className="py-2.5 px-3 text-center">{getStatusBadge(order.status)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setActiveSubTab('requests');
                              handleOpenStatusModal(order);
                            }}
                            className="px-2 py-1 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-[10px] rounded shadow-sm"
                          >
                            อัปเดตสถานะ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: Document Requests & Status Management */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Header Action & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-[#006633]" />
                <span>รายชื่อผู้ส่งคำร้องขอเอกสาร & จัดการสถานะ (Requests & Fulfillment)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบรายชื่อผู้ยื่นคำร้อง ติดตามสถานะเอกสาร บันทึกเลขพัสดุ EMS และพิมพ์ใบเสร็จรับเงิน
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadOrders}
                disabled={isOrdersLoading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-sm"
                title="รีเฟรชข้อมูลคำร้อง"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOrdersLoading ? 'animate-spin text-[#006633]' : ''}`} />
                <span>รีเฟรช</span>
              </button>
              <button
                onClick={handleExportOrdersCsv}
                className="px-3.5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#FFC72C]" />
                <span>ส่งออก CSV ({filteredOrders.length})</span>
              </button>
            </div>
          </div>

          {/* Quick KPI Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setOrderStatusFilter('all')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                orderStatusFilter === 'all'
                  ? 'bg-[#006633] text-white border-[#006633] shadow'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`text-[11px] ${orderStatusFilter === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>คำร้องทั้งหมด</div>
              <div className="text-xl font-black mt-0.5">{orders.length}</div>
            </div>

            <div
              onClick={() => setOrderStatusFilter('processing')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                orderStatusFilter === 'processing'
                  ? 'bg-blue-700 text-white border-blue-700 shadow'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className={`text-[11px] ${orderStatusFilter === 'processing' ? 'text-blue-100' : 'text-blue-600'}`}>กำลังจัดทำ</div>
              <div className="text-xl font-black mt-0.5 text-blue-900">
                {orders.filter((o) => o.status === 'processing').length}
              </div>
            </div>

            <div
              onClick={() => setOrderStatusFilter('ready_for_pickup')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                orderStatusFilter === 'ready_for_pickup'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className={`text-[11px] ${orderStatusFilter === 'ready_for_pickup' ? 'text-emerald-100' : 'text-emerald-600'}`}>พร้อมรับที่เคาน์เตอร์</div>
              <div className="text-xl font-black mt-0.5 text-emerald-900">
                {orders.filter((o) => o.status === 'ready_for_pickup').length}
              </div>
            </div>

            <div
              onClick={() => setOrderStatusFilter('shipped')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                orderStatusFilter === 'shipped'
                  ? 'bg-purple-700 text-white border-purple-700 shadow'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className={`text-[11px] ${orderStatusFilter === 'shipped' ? 'text-purple-100' : 'text-purple-600'}`}>จัดส่งไปรษณีย์</div>
              <div className="text-xl font-black mt-0.5 text-purple-900">
                {orders.filter((o) => o.status === 'shipped').length}
              </div>
            </div>

            <div
              onClick={() => setOrderStatusFilter('completed')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                orderStatusFilter === 'completed'
                  ? 'bg-slate-800 text-white border-slate-800 shadow'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`text-[11px] ${orderStatusFilter === 'completed' ? 'text-slate-200' : 'text-slate-600'}`}>สำเร็จแล้ว</div>
              <div className="text-xl font-black mt-0.5 text-slate-900">
                {orders.filter((o) => o.status === 'completed').length}
              </div>
            </div>

            <div
              onClick={() => setOrderStatusFilter('pending_payment')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                orderStatusFilter === 'pending_payment'
                  ? 'bg-amber-600 text-white border-amber-600 shadow'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className={`text-[11px] ${orderStatusFilter === 'pending_payment' ? 'text-amber-100' : 'text-amber-600'}`}>รอชำระเงิน</div>
              <div className="text-xl font-black mt-0.5 text-amber-900">
                {orders.filter((o) => o.status === 'pending_payment').length}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่คำร้อง (EDOC-...), รหัสนิสิต, ชื่อผู้ยื่น, หรือเลขพัสดุ EMS..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#006633] focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Student Type */}
                <select
                  value={orderStudentTypeFilter}
                  onChange={(e: any) => setOrderStudentTypeFilter(e.target.value)}
                  className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-[#006633] focus:outline-none"
                >
                  <option value="all">ประเภทผู้ขอ: ทั้งหมด</option>
                  <option value="S">นิสิตปัจจุบัน (S)</option>
                  <option value="D">ลาพักการศึกษา (D)</option>
                  <option value="G">สำเร็จการศึกษา (G)</option>
                </select>

                {/* Delivery Method */}
                <select
                  value={orderDeliveryFilter}
                  onChange={(e: any) => setOrderDeliveryFilter(e.target.value)}
                  className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-[#006633] focus:outline-none"
                >
                  <option value="all">ช่องทางรับ: ทั้งหมด</option>
                  <option value="pickup">รับที่เคาน์เตอร์</option>
                  <option value="postal">ไปรษณีย์ด่วนพิเศษ EMS</option>
                  <option value="digital">เอกสารดิจิทัล PDF</option>
                </select>
              </div>
            </div>

            {/* Status Quick Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>สถานะ:</span>
              </span>
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'processing', label: 'กำลังจัดทำ' },
                { id: 'ready_for_pickup', label: 'พร้อมรับ' },
                { id: 'shipped', label: 'จัดส่งแล้ว' },
                { id: 'completed', label: 'สำเร็จแล้ว' },
                { id: 'paid', label: 'ชำระแล้ว' },
                { id: 'pending_payment', label: 'รอชำระเงิน' },
                { id: 'cancelled', label: 'ยกเลิก' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition text-[11px] ${
                    orderStatusFilter === tab.id
                      ? 'bg-[#006633] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Filter Banner when searched/filtered by applicant */}
            {orderSearch && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs text-emerald-900 mt-2">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Search className="w-3.5 h-3.5 text-[#006633]" />
                  <span>กำลังกรองคำร้องด้วยคำค้น: <strong className="font-mono text-[#006633] font-bold">"{orderSearch}"</strong> (พบ {filteredOrders.length} รายการ)</span>
                </span>
                <button
                  onClick={() => setOrderSearch('')}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1 border border-emerald-300"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรอง</span>
                </button>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4">หมายเลขคำร้อง / วันที่</th>
                    <th className="py-3 px-4">ผู้ส่งคำร้องขอเอกสาร</th>
                    <th className="py-3 px-4">รายการเอกสารที่ขอ</th>
                    <th className="py-3 px-4 text-right">ยอดเงิน</th>
                    <th className="py-3 px-4">ช่องทางการรับ</th>
                    <th className="py-3 px-4 text-center">สถานะเอกสาร</th>
                    <th className="py-3 px-4 text-center">จัดการสถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isOrdersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#006633]" />
                        <span>กำลังโหลดรายชื่อผู้ส่งคำร้อง...</span>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <div className="font-semibold text-slate-600">ไม่พบข้อมูลคำร้องที่ตรงกับเงื่อนไข</div>
                        <div className="text-[11px] text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        {/* Order No & Date */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono font-bold text-slate-900 text-[13px]">{order.order_no}</div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(order.created_at).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })}{' '}
                              {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                          </div>
                        </td>

                        {/* Applicant Info */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{order.student_name}</span>
                            {getStudentTypeBadge(order.student_status)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            รหัสนิสิต: <span className="font-semibold text-slate-700">{order.student_id}</span>
                          </div>
                          {order.faculty_name && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                              {order.faculty_name}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1 max-w-xs">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item: any, idx: number) => (
                                <div key={idx} className="text-[11px] text-slate-700 flex items-start space-x-1">
                                  <span className="text-[#006633] font-bold">•</span>
                                  <span className="truncate">{item.item_name}</span>
                                  <span className="text-slate-400 font-mono shrink-0">(x{item.quantity})</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">เอกสารทางการศึกษา</span>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 align-top text-right font-mono">
                          <div className="font-black text-[#006633] text-sm">
                            ฿{parseFloat(String(order.total_amount)).toFixed(2)}
                          </div>
                          {order.shipping_fee && parseFloat(String(order.shipping_fee)) > 0 ? (
                            <div className="text-[10px] text-slate-400 font-sans">
                              (รวม EMS ฿{parseFloat(String(order.shipping_fee)).toFixed(0)})
                            </div>
                          ) : null}
                        </td>

                        {/* Delivery Method */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center space-x-1 font-semibold text-slate-700">
                            {order.delivery_method === 'pickup' ? (
                              <>
                                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>รับที่เคาน์เตอร์</span>
                              </>
                            ) : order.delivery_method === 'postal' ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-purple-700" />
                                <span>ไปรษณีย์ EMS</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5 text-blue-700" />
                                <span>ดิจิทัล PDF</span>
                              </>
                            )}
                          </div>

                          {order.postal_tracking_no ? (
                            <div className="mt-1 font-mono text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                              EMS: {order.postal_tracking_no}
                            </div>
                          ) : order.delivery_method === 'postal' ? (
                            <div className="text-[10px] text-amber-600 mt-1">ยังไม่ระบุเลขพัสดุ</div>
                          ) : null}

                          {order.shipping_address && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5" title={order.shipping_address}>
                              {order.shipping_address}
                            </div>
                          )}
                        </td>

                        {/* Current Status */}
                        <td className="py-3.5 px-4 align-top text-center">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Status Actions */}
                        <td className="py-3.5 px-4 align-top text-center">
                          <div className="flex flex-col items-center gap-1.5 min-w-[130px]">
                            {/* Primary: Open Status Modal */}
                            <button
                              onClick={() => handleOpenStatusModal(order)}
                              className="w-full px-2.5 py-1.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center justify-center space-x-1 transition"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>อัปเดตสถานะ</span>
                            </button>

                            {/* Secondary Actions Row */}
                            <div className="flex items-center space-x-1 w-full">
                              {/* View Receipt */}
                              {onViewReceipt && (
                                <button
                                  onClick={() => onViewReceipt(order.order_no)}
                                  className="flex-1 px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded transition flex items-center justify-center space-x-0.5"
                                  title="ดูใบเสร็จรับเงิน"
                                >
                                  <Printer className="w-3 h-3 text-slate-500" />
                                  <span>ใบเสร็จ</span>
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                onClick={() => handleOpenDetailModal(order)}
                                className="flex-1 px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded transition flex items-center justify-center space-x-0.5"
                                title="ดูรายละเอียดคำร้องทั้งหมด"
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                <span>รายละเอียด</span>
                              </button>
                            </div>

                            {/* Contextual Quick Actions */}
                            {order.status === 'processing' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.order_no, 'ready_for_pickup')}
                                className="w-full text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 py-0.5 rounded transition border border-emerald-200"
                              >
                                ➜ เสร็จแล้ว พร้อมรับ
                              </button>
                            )}

                            {order.status === 'ready_for_pickup' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.order_no, 'completed')}
                                className="w-full text-[10px] font-bold text-slate-700 hover:bg-slate-100 py-0.5 rounded transition border border-slate-300"
                              >
                                ➜ ปิดงาน (ส่งมอบแล้ว)
                              </button>
                            )}

                            {order.delivery_method === 'postal' && order.status !== 'shipped' && order.status !== 'completed' && (
                              <button
                                onClick={() => handleOpenStatusModal(order)}
                                className="w-full text-[10px] font-bold text-purple-700 hover:bg-purple-50 py-0.5 rounded transition border border-purple-200 flex items-center justify-center space-x-1"
                              >
                                <Truck className="w-3 h-3" />
                                <span>บันทึกเลข EMS</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Document Catalog & Pricing Management */}
      {activeSubTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">จัดการข้อมูลรายการเอกสารและกำหนดราคา (Document Catalog)</h3>
              <p className="text-xs text-slate-500">
                เพิ่ม แก้ไข กำหนดราคาต่อฉบับ รูปแบบเอกสาร และกำหนดสิทธิ์ประเภทผู้ขอ (S, D, G)
              </p>
            </div>
            <button
              onClick={() => {
                setDocForm({
                  id: '',
                  code: '',
                  name_th: '',
                  name_en: '',
                  description: '',
                  price: 50,
                  processing_days: 2,
                  format: 'both',
                  allowed_statuses: ['S', 'D', 'G'],
                });
                setIsDocModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1 self-start sm:self-auto transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มประเภทเอกสารใหม่</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเอกสาร หรือรหัส..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-semibold flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>กรองสิทธิ์:</span>
              </span>
              {(['all', 'S', 'D', 'G'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setDocStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    docStatusFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'ทั้งหมด' : `สถานะ ${st}`}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">รหัสเอกสาร</th>
                  <th className="py-2.5 px-3">ชื่อเอกสาร (ไทย / อังกฤษ)</th>
                  <th className="py-2.5 px-3 text-right">ราคาต่อฉบับ</th>
                  <th className="py-2.5 px-3">รูปแบบ</th>
                  <th className="py-2.5 px-3">ระยะเวลา (SLA)</th>
                  <th className="py-2.5 px-3">ประเภทผู้ขอที่อนุญาต</th>
                  <th className="py-2.5 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{doc.code}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{doc.name_th}</div>
                      <div className="text-[10px] text-slate-400">{doc.name_en || '-'}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#006633] text-sm">
                      ฿{parseFloat(String(doc.price)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {doc.format === 'hardcopy' ? 'ฉบับกระดาษ' : doc.format === 'digital' ? 'ไฟล์ดิจิทัล PDF' : 'ทั้งสองรูปแบบ'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{doc.processing_days} วันทำการ</td>
                    <td className="py-3 px-3">
                      <div className="flex space-x-1">
                        {doc.allowed_statuses.map((st) => (
                          <span
                            key={st}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              st === 'G'
                                ? 'bg-blue-100 text-blue-800'
                                : st === 'D'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {st === 'S' ? 'S: กำลังศึกษา' : st === 'D' ? 'D: ลาพัก' : 'G: สำเร็จ'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setDocForm(doc);
                          setIsDocModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-[#006633] hover:bg-emerald-50 rounded-lg transition border border-slate-200 inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Bundle Packages & Excel Whitelist */}
      {activeSubTab === 'packages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">แพ็กเกจเอกสารรวม (Bundle Packages)</h3>
                <p className="text-xs text-slate-500">
                  รวมเอกสารหลายรายการเข้าด้วยกันในราคาเดียว และสามารถนำเข้ารายชื่อ Whitelist จาก Excel ได้
                </p>
              </div>
              <button
                onClick={() => {
                  setPkgForm({
                    id: '',
                    code: '',
                    name_th: '',
                    description: '',
                    package_price: 150,
                    is_restricted_whitelist: false,
                    allowed_statuses: ['G'],
                    items: [],
                  });
                  setIsPkgModalOpen(true);
                }}
                className="px-3.5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1 self-start sm:self-auto transition"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างแพ็กเกจใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 flex flex-col justify-between transition shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border">
                        {pkg.code}
                      </span>
                      <span className="font-mono text-base font-black text-[#006633]">
                        ฿{parseFloat(String(pkg.package_price)).toFixed(2)}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mb-1">{pkg.name_th}</h4>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{pkg.description}</p>

                    {/* รายการเอกสารที่รวมในแพ็กเกจ */}
                    {pkg.items && pkg.items.length > 0 && (
                      <div className="bg-white rounded-xl p-2.5 mb-3 border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                          <span className="flex items-center space-x-1">
                            <Layers className="w-3.5 h-3.5 text-[#006633]" />
                            <span>เอกสารในแพ็กเกจ ({pkg.items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)} ฉบับ):</span>
                          </span>
                          {(() => {
                            const regularTotal = pkg.items.reduce((acc: number, it: any) => {
                              const doc = documents.find((d) => d.id === it.document_type_id);
                              const price = doc ? parseFloat(String(doc.price)) : parseFloat(String(it.document_price || 0));
                              return acc + (price * (it.quantity || 1));
                            }, 0);
                            const pkgPrice = parseFloat(String(pkg.package_price));
                            const saving = regularTotal - pkgPrice;
                            return saving > 0 ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                ประหยัด ฿{saving.toFixed(0)}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="space-y-1">
                          {pkg.items.map((it: any, idx: number) => {
                            const doc = documents.find((d) => d.id === it.document_type_id);
                            const name = doc?.name_th || it.document_name_th || it.name_th || 'เอกสาร';
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                                <span className="truncate flex items-center space-x-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#006633] shrink-0" />
                                  <span className="truncate text-slate-800">{name}</span>
                                </span>
                                <span className="font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                                  x{it.quantity || 1}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {pkg.allowed_statuses?.map((st) => (
                        <span
                          key={st}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"
                        >
                          {st === 'S' ? 'กำลังศึกษา (S)' : st === 'D' ? 'ลาพัก (D)' : 'สำเร็จการศึกษา (G)'}
                        </span>
                      ))}
                      {pkg.is_restricted_whitelist && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                          ⚡ เฉพาะรายชื่อใน Whitelist
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setSelectedPkgForUpload(pkg);
                        setSelectedFile(null);
                        setUploadStatus('');
                        loadWhitelistMembers(pkg.id);
                      }}
                      className="flex-1 py-1.5 bg-[#FFC72C] hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>นำเข้า Excel</span>
                    </button>
                    <button
                      onClick={() => {
                        setPkgForm({
                          ...pkg,
                          items: (pkg.items || []).map((it: any) => ({
                            document_type_id: it.document_type_id,
                            quantity: it.quantity || 1,
                          })),
                        });
                        setIsPkgModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Applicant Types & Eligibility Rules Matrix */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-sm text-slate-800 mb-1 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#006633]" />
              <span>การจำแนกประเภทผู้ขอเอกสารและเงื่อนไขสิทธิ์ (Applicant Status & Eligibility Rules)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              นิสิตแต่ละสถานะจะมองเห็นและขอได้เฉพาะเอกสารที่ได้รับอนุญาตตามระเบียบมหาวิทยาลัยเกษตรศาสตร์
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Status S */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    S
                  </span>
                  <span className="font-bold text-sm text-emerald-950">นิสิตปัจจุบัน (Studying)</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  นิสิตที่ลงทะเบียนเรียนในภาคการศึกษาปัจจุบัน ยืนยันตัวตนผ่าน KU All-login ขอเอกสารรับรองสภาพนิสิต,
                  Transcript ระหว่างศึกษา และหนังสือรับรองคาดว่าจะจบได้
                </p>
                <div className="text-[11px] font-bold text-emerald-800">
                  เอกสารที่ขอได้: {documents.filter((d) => d.allowed_statuses.includes('S')).length} รายการ
                </div>
              </div>

              {/* Status D */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                    D
                  </span>
                  <span className="font-bold text-sm text-amber-950">นิสิตลาพักการศึกษา (Drop)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  นิสิตที่ได้รับอนุมัติลาพักการศึกษา ยังคงสถานภาพนิสิต สามารถขอเอกสารประวัติการศึกษาและหนังสือรับรองตามเงื่อนไขที่กำหนด
                </p>
                <div className="text-[11px] font-bold text-amber-800">
                  เอกสารที่ขอได้: {documents.filter((d) => d.allowed_statuses.includes('D')).length} รายการ
                </div>
              </div>

              {/* Status G */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    G
                  </span>
                  <span className="font-bold text-sm text-blue-950">สำเร็จการศึกษา (Graduated)</span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  บัณฑิตที่สำเร็จการศึกษา ยืนยันตัวตนด้วยเลขประจำตัวประชาชน 13 หลัก (JIT Verification) ขอหนังสือรับรองสำเร็จการศึกษา,
                  Transcript ฉบับสมบูรณ์ และแพ็กเกจบัณฑิต
                </p>
                <div className="text-[11px] font-bold text-blue-800">
                  เอกสารที่ขอได้: {documents.filter((d) => d.allowed_statuses.includes('G')).length} รายการ
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <h4 className="font-bold text-xs text-slate-800 mb-2">ตารางสรุปสิทธิ์การขอเอกสารรายประเภท (Eligibility Matrix)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ชื่อรายการเอกสาร</th>
                    <th className="py-2.5 px-3 text-center">กำลังศึกษา (S)</th>
                    <th className="py-2.5 px-3 text-center">ลาพัก (D)</th>
                    <th className="py-2.5 px-3 text-center">สำเร็จการศึกษา (G)</th>
                    <th className="py-2.5 px-3 text-right">ราคา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{d.name_th}</td>
                      <td className="py-2.5 px-3 text-center">
                        {d.allowed_statuses.includes('S') ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {d.allowed_statuses.includes('D') ? (
                          <Check className="w-4 h-4 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {d.allowed_statuses.includes('G') ? (
                          <Check className="w-4 h-4 text-blue-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#006633]">
                        ฿{parseFloat(String(d.price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Staff & Executive Management */}
      {activeSubTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Staff / Executive Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-max">
            <h3 className="font-bold text-sm text-slate-800 mb-1 flex items-center space-x-1.5">
              <UserPlus className="w-4 h-4 text-[#006633]" />
              <span>เพิ่มเจ้าหน้าที่เคาน์เตอร์ / ผู้บริหารระบบ</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ผูกบัญชี KU All-login เพื่อมอบสิทธิ์เข้าใช้งานระบบ (เจ้าหน้าที่เคาน์เตอร์ POS, ผู้บริหาร Executive หรือผู้ดูแลระบบ Admin)
            </p>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บัญชีผู้ใช้ KU All-login <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น exec.dean หรือ staff.counter"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่ง
                </label>
                <input
                  type="text"
                  placeholder={
                    staffRole === 'executive'
                      ? 'เช่น รศ.ดร. นนทรี ผู้บริหาร มก.ฉกส.'
                      : staffRole === 'admin'
                      ? 'เช่น ผู้ดูแลระบบ ทะเบียนและประมวลผล'
                      : 'เช่น สมศรี บริการดีเลิศ'
                  }
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006633]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  placeholder="เช่น 042-725000 หรือ 081-xxxxxxx"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006633]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระดับสิทธิ์การใช้งาน <span className="text-red-500">*</span>
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006633] font-semibold text-slate-800"
                >
                  <option value="staff">🏢 เจ้าหน้าที่บริการเคาน์เตอร์ (Staff POS)</option>
                  <option value="executive">📊 ผู้บริหาร (Executive - ดูแดชบอร์ดสถิติ & รายงาน)</option>
                  <option value="admin">🛡️ ผู้ดูแลระบบ (Admin Console)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {staffRole === 'executive' && '💡 สิทธิ์ผู้บริหาร: ดูแดชบอร์ด KPI, ยอดคำร้อง, วิเคราะห์สัดส่วน และดาวน์โหลดรายงานสรุป'}
                  {staffRole === 'staff' && '💡 สิทธิ์เจ้าหน้าที่: เปิดคำร้อง Walk-in หน้าร้าน, อัปเดตสถานะเอกสาร และพิมพ์ใบเสร็จ'}
                  {staffRole === 'admin' && '💡 สิทธิ์ Admin: จัดการแคตตาล็อกเอกสาร, กำหนดราคา, แพ็กเกจ, Whitelist และผู้ใช้งานทั้งหมด'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow transition mt-3 flex items-center justify-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4 text-[#FFC72C]" />
                <span>บันทึกและมอบสิทธิ์</span>
              </button>
            </form>
          </div>

          {/* Staff & Executive List Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-[#006633]" />
                  <span>รายชื่อเจ้าหน้าที่และผู้บริหาร ({filteredStaff.length} คน)</span>
                </h3>
                <p className="text-xs text-slate-500">บัญชีที่ได้รับสิทธิ์เข้าถึงส่วนงานเจ้าหน้าที่ ผู้บริหาร และผู้ดูแลระบบ</p>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    staffRoleFilter === 'all'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({staffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('staff')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    staffRoleFilter === 'staff'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เจ้าหน้าที่ ({staffList.filter((s) => s.role === 'staff').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('executive')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    staffRoleFilter === 'executive'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ผู้บริหาร ({staffList.filter((s) => s.role === 'executive').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('admin')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    staffRoleFilter === 'admin'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin ({staffList.filter((s) => s.role === 'admin').length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">บัญชี KU All-login</th>
                    <th className="py-2.5 px-3">ชื่อ-นามสกุล / ตำแหน่ง</th>
                    <th className="py-2.5 px-3">ระดับสิทธิ์</th>
                    <th className="py-2.5 px-3">เบอร์ติดต่อ</th>
                    <th className="py-2.5 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ไม่พบบัญชีผู้ใช้งานในหมวดหมู่นี้
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {s.username}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {s.first_name_th} {s.last_name_th}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                              s.role === 'admin'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : s.role === 'executive'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <span>
                              {s.role === 'admin'
                                ? '🛡️ Admin ผู้ดูแลระบบ'
                                : s.role === 'executive'
                                ? '📊 Executive ผู้บริหาร'
                                : '🏢 Staff เคาน์เตอร์'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {s.phone_number || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(s.id, s.username, s.role)}
                            title="ยกเลิกสิทธิ์ผู้ใช้งาน"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: Document Form (Add / Edit) --- */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="font-bold text-base text-slate-900 mb-1">
              {docForm.id ? 'แก้ไขประเภทเอกสาร' : 'เพิ่มประเภทเอกสารใหม่'}
            </h4>
            <p className="text-xs text-slate-500 mb-4">กำหนดรหัส, ชื่อเอกสาร, ราคาต่อฉบับ และสิทธิ์ประเภทผู้ขอ</p>

            <form onSubmit={handleSaveDocument} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    รหัสเอกสาร (Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={docForm.code}
                    onChange={(e) => setDocForm({ ...docForm, code: e.target.value })}
                    placeholder="เช่น CERT_GRAD_2026"
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    ราคาต่อฉบับ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={docForm.price}
                    onChange={(e) => setDocForm({ ...docForm, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-[#006633] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  ชื่อเอกสารภาษาไทย <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docForm.name_th}
                  onChange={(e) => setDocForm({ ...docForm, name_th: e.target.value })}
                  placeholder="เช่น ใบแสดงผลการศึกษา (Transcript) ภาษาไทย"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">ชื่อเอกสารภาษาอังกฤษ</label>
                <input
                  type="text"
                  value={docForm.name_en}
                  onChange={(e) => setDocForm({ ...docForm, name_en: e.target.value })}
                  placeholder="e.g. Official Academic Transcript (English)"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">ระยะเวลาจัดทำ (SLA วันทำการ)</label>
                  <input
                    type="number"
                    value={docForm.processing_days}
                    onChange={(e) => setDocForm({ ...docForm, processing_days: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">รูปแบบเอกสาร</label>
                  <select
                    value={docForm.format}
                    onChange={(e) => setDocForm({ ...docForm, format: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="both">ทั้งฉบับกระดาษและดิจิทัล PDF</option>
                    <option value="hardcopy">ฉบับพิมพ์กระดาษเท่านั้น</option>
                    <option value="digital">ฉบับดิจิทัล PDF เท่านั้น</option>
                  </select>
                </div>
              </div>

              {/* Status Eligibility Checkboxes */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-800 block mb-1.5">
                  ประเภทผู้ขอเอกสารที่อนุญาต (Eligibility Rules) <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docForm.allowed_statuses?.includes('S')}
                      onChange={(e) => {
                        const cur = docForm.allowed_statuses || [];
                        const next = e.target.checked ? [...cur, 'S'] : cur.filter((s: string) => s !== 'S');
                        setDocForm({ ...docForm, allowed_statuses: next });
                      }}
                      className="rounded text-[#006633] focus:ring-emerald-700"
                    />
                    <span className="text-xs text-slate-700 font-medium">นิสิตปัจจุบัน (S - Studying)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docForm.allowed_statuses?.includes('D')}
                      onChange={(e) => {
                        const cur = docForm.allowed_statuses || [];
                        const next = e.target.checked ? [...cur, 'D'] : cur.filter((s: string) => s !== 'D');
                        setDocForm({ ...docForm, allowed_statuses: next });
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">นิสิตลาพักการศึกษา (D - Leave of Absence)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docForm.allowed_statuses?.includes('G')}
                      onChange={(e) => {
                        const cur = docForm.allowed_statuses || [];
                        const next = e.target.checked ? [...cur, 'G'] : cur.filter((s: string) => s !== 'G');
                        setDocForm({ ...docForm, allowed_statuses: next });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">ผู้สำเร็จการศึกษา / บัณฑิต (G - Graduated)</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="flex-1 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded-xl shadow transition"
                >
                  บันทึกข้อมูลเอกสาร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Package Form (Add / Edit) --- */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {pkgForm.id ? 'แก้ไขแพ็กเกจเอกสารรวม' : 'สร้างแพ็กเกจเอกสารรวมใหม่'}
                </h4>
                <p className="text-xs text-slate-500">
                  เลือกเอกสารจากแคตตาล็อก กำหนดราคาเหมาจ่าย และระบุกลุ่มผู้ขอ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPkgModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    รหัสแพ็กเกจ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pkgForm.code}
                    onChange={(e) => setPkgForm({ ...pkgForm, code: e.target.value })}
                    placeholder="เช่น PKG_GRAD_BUNDLE"
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    ราคาเหมาจ่าย (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pkgForm.package_price}
                    onChange={(e) => setPkgForm({ ...pkgForm, package_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-[#006633] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  ชื่อแพ็กเกจ (ภาษาไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pkgForm.name_th}
                  onChange={(e) => setPkgForm({ ...pkgForm, name_th: e.target.value })}
                  placeholder="เช่น ชุดแพ็กเกจผู้สำเร็จการศึกษา (Graduation Bundle)"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  คำอธิบายแพ็กเกจ
                </label>
                <textarea
                  rows={2}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  placeholder="เช่น รวม Transcript ไทยและอังกฤษ พร้อมใบรับรองสำเร็จการศึกษาในราคาพิเศษ"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Document Catalog Selector */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-[#006633]" />
                      <span>เลือกรายการเอกสารจากแคตตาล็อก <span className="text-red-500">*</span></span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      ติ๊กเลือกเอกสารและระบุจำนวนฉบับที่รวมในแพ็กเกจ
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    เลือกแล้ว {(pkgForm.items || []).length} รายการ ({(pkgForm.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)} ฉบับ)
                  </span>
                </div>

                {/* Selected Summary / Price Comparison Banner */}
                {(() => {
                  const selectedItems = pkgForm.items || [];
                  const regularSum = selectedItems.reduce((acc: number, it: any) => {
                    const doc = documents.find((d) => d.id === it.document_type_id);
                    return acc + (doc ? parseFloat(String(doc.price)) * (it.quantity || 1) : 0);
                  }, 0);
                  const pkgPrice = parseFloat(String(pkgForm.package_price)) || 0;
                  const discount = regularSum - pkgPrice;
                  const percent = regularSum > 0 ? Math.round((discount / regularSum) * 100) : 0;

                  return (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">ราคาปกติรวม</span>
                          <span className="font-mono font-bold text-slate-700">฿{regularSum.toFixed(2)}</span>
                        </div>
                        <div className="text-slate-300">➔</div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">ราคาเหมาจ่าย</span>
                          <span className="font-mono font-bold text-[#006633]">฿{pkgPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      {discount > 0 ? (
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 block font-semibold">ส่วนลดที่นิสิตได้รับ</span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ประหยัด ฿{discount.toFixed(2)} ({percent}%)
                          </span>
                        </div>
                      ) : regularSum > 0 ? (
                        <span className="text-[11px] text-amber-600">
                          (ราคาเหมาจ่ายเท่ากับหรือสูงกว่าราคาปกติ)
                        </span>
                      ) : null}
                    </div>
                  );
                })()}

                {/* Document List with checkboxes and quantity steppers */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl bg-white p-2">
                  {documents.filter(d => d.is_active !== false).length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">ไม่พบรายการเอกสารในแคตตาล็อก</p>
                  ) : (
                    documents
                      .filter((d) => d.is_active !== false)
                      .map((doc) => {
                        const selectedItem = (pkgForm.items || []).find(
                          (it: any) => it.document_type_id === doc.id
                        );
                        const isChecked = !!selectedItem;
                        const qty = selectedItem?.quantity || 1;

                        const toggleCheck = () => {
                          const currentItems = pkgForm.items || [];
                          if (isChecked) {
                            setPkgForm({
                              ...pkgForm,
                              items: currentItems.filter((it: any) => it.document_type_id !== doc.id),
                            });
                          } else {
                            setPkgForm({
                              ...pkgForm,
                              items: [...currentItems, { document_type_id: doc.id, quantity: 1 }],
                            });
                          }
                        };

                        const updateQty = (newQty: number) => {
                          if (newQty < 1) return;
                          setPkgForm({
                            ...pkgForm,
                            items: (pkgForm.items || []).map((it: any) =>
                              it.document_type_id === doc.id ? { ...it, quantity: newQty } : it
                            ),
                          });
                        };

                        return (
                          <div
                            key={doc.id}
                            className={`flex items-center justify-between p-2 rounded-lg border transition ${
                              isChecked
                                ? 'bg-emerald-50/60 border-emerald-400 shadow-xs'
                                : 'bg-slate-50/30 border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <label className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0 mr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={toggleCheck}
                                className="w-4 h-4 rounded text-[#006633] focus:ring-emerald-700 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5 truncate">
                                  <span className="font-semibold text-xs text-slate-800 truncate">
                                    {doc.name_th}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.2 rounded border shrink-0">
                                    {doc.code}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                  <span>ราคาปกติ: ฿{parseFloat(String(doc.price)).toFixed(2)}</span>
                                  <span>•</span>
                                  <span>{doc.format === 'digital' ? 'ดิจิทัล' : doc.format === 'hardcopy' ? 'กระดาษ' : 'กระดาษ/ดิจิทัล'}</span>
                                </div>
                              </div>
                            </label>

                            {isChecked && (
                              <div className="flex items-center space-x-1.5 shrink-0 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-xs">
                                <span className="text-[10px] text-slate-500 font-medium">จำนวน:</span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(qty - 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                                  disabled={qty <= 1}
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-xs text-[#006633] w-5 text-center">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(qty + 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                                >
                                  +
                                </button>
                                <span className="text-[10px] text-slate-400">ฉบับ</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Status Eligibility Checkboxes */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-800 block mb-1.5">
                  ประเภทผู้ขอที่อนุญาตให้ขอแพ็กเกจนี้ <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgForm.allowed_statuses?.includes('S')}
                      onChange={(e) => {
                        const cur = pkgForm.allowed_statuses || [];
                        const next = e.target.checked ? [...cur, 'S'] : cur.filter((s: string) => s !== 'S');
                        setPkgForm({ ...pkgForm, allowed_statuses: next });
                      }}
                      className="rounded text-[#006633]"
                    />
                    <span className="text-xs text-slate-700">กำลังศึกษา (S)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgForm.allowed_statuses?.includes('D')}
                      onChange={(e) => {
                        const cur = pkgForm.allowed_statuses || [];
                        const next = e.target.checked ? [...cur, 'D'] : cur.filter((s: string) => s !== 'D');
                        setPkgForm({ ...pkgForm, allowed_statuses: next });
                      }}
                      className="rounded text-amber-600"
                    />
                    <span className="text-xs text-slate-700">ลาพัก (D)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgForm.allowed_statuses?.includes('G')}
                      onChange={(e) => {
                        const cur = pkgForm.allowed_statuses || [];
                        const next = e.target.checked ? [...cur, 'G'] : cur.filter((s: string) => s !== 'G');
                        setPkgForm({ ...pkgForm, allowed_statuses: next });
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-xs text-slate-700">สำเร็จการศึกษา (G)</span>
                  </label>
                </div>
              </div>

              {/* Whitelist restriction toggle */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgForm.is_restricted_whitelist}
                    onChange={(e) => setPkgForm({ ...pkgForm, is_restricted_whitelist: e.target.checked })}
                    className="rounded text-purple-700"
                  />
                  <div>
                    <span className="font-bold text-xs text-purple-950 block">
                      จำกัดสิทธิ์เฉพาะนิสิตใน Whitelist (Excel Upload)
                    </span>
                    <span className="text-[11px] text-purple-800">
                      หากเปิดใช้งาน นิสิตทั่วไปจะไม่เห็นแพ็กเกจนี้ จนกว่าจะมีรหัสนิสิตอยู่ในไฟล์ Excel ที่อัปโหลด
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="flex-1 py-2 font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded-xl shadow transition"
                >
                  บันทึกแพ็กเกจ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Whitelist Excel Upload Modal --- */}
      {selectedPkgForUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">นำเข้ารายชื่อ Whitelist จากไฟล์ Excel</h4>
                <p className="text-xs text-slate-500">สำหรับแพ็กเกจ: {selectedPkgForUpload.name_th}</p>
              </div>
              <button onClick={() => setSelectedPkgForUpload(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-4 text-xs text-purple-950 leading-relaxed">
              *ไฟล์ Excel ต้องมีคอลัมน์ <strong>รหัสนิสิต 10 หลัก</strong> (เช่น 6540201234)
              ระบบจะอนุญาตให้เฉพาะนิสิตในรายชื่อนี้เท่านั้นที่มองเห็นและขอแพ็กเกจนี้ได้
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center mb-4 hover:border-emerald-600 transition bg-slate-50">
              <FileSpreadsheet className="w-10 h-10 text-[#006633] mx-auto mb-2" />
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-[#006633] hover:file:bg-emerald-200 cursor-pointer"
              />
              {selectedFile && (
                <div className="text-xs font-bold text-[#006633] mt-2">
                  ไฟล์ที่เลือก: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {uploadStatus && (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl mb-4 border border-emerald-200">
                {uploadStatus}
              </div>
            )}

            {/* Current Whitelist Members List */}
            {whitelistMembers.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-700 mb-1">
                  รายชื่อนิสิตที่ได้รับสิทธิ์ในแพ็กเกจนี้ ({whitelistMembers.length} คน):
                </div>
                <div className="max-h-36 overflow-y-auto bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1 text-[11px] font-mono">
                  {whitelistMembers.slice(0, 30).map((m, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span className="font-bold text-[#006633]">{m.student_id}</span>
                      <span className="font-sans text-slate-500">{m.full_name || '-'}</span>
                    </div>
                  ))}
                  {whitelistMembers.length > 30 && (
                    <div className="text-center text-slate-400 font-sans text-[10px] pt-1">
                      ...และอีก {whitelistMembers.length - 30} รายการ
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPkgForUpload(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
              >
                ปิด
              </button>
              <button
                disabled={!selectedFile || isUploading}
                onClick={handleUploadWhitelist}
                className="flex-1 py-2.5 bg-[#006633] hover:bg-[#004d26] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1 transition"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>นำเข้ารายชื่อ Whitelist</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Update Order Status */}
      {isStatusModalOpen && selectedOrderForStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <Edit2 className="w-5 h-5 text-[#006633]" />
                  <span>อัปเดตสถานะเอกสาร / คำร้อง</span>
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedOrderForStatus.order_no} • {selectedOrderForStatus.student_name} ({selectedOrderForStatus.student_id})
                </div>
              </div>
              <button
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedOrderForStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Order Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะปัจจุบัน:</span>
                  <span>{getStatusBadge(selectedOrderForStatus.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ช่องทางการรับ:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrderForStatus.delivery_method === 'pickup'
                      ? 'รับที่เคาน์เตอร์'
                      : selectedOrderForStatus.delivery_method === 'postal'
                      ? 'จัดส่งไปรษณีย์ด่วนพิเศษ EMS'
                      : 'เอกสารดิจิทัล PDF'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดเงินรวม:</span>
                  <span className="font-mono font-bold text-[#006633]">
                    ฿{parseFloat(String(selectedOrderForStatus.total_amount)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status Select Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  เลือกสถานะใหม่ที่ต้องการเปลี่ยน:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'processing',
                      label: 'กำลังจัดทำเอกสาร',
                      desc: 'พิมพ์ ตรวจสอบ ลงนามรับรอง',
                      color: 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
                      activeColor: 'border-blue-600 bg-blue-100 text-blue-950 ring-2 ring-blue-500',
                    },
                    {
                      id: 'ready_for_pickup',
                      label: 'พร้อมรับที่เคาน์เตอร์',
                      desc: 'จัดทำเสร็จ รอนิสิตมารับ',
                      color: 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
                      activeColor: 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500',
                    },
                    {
                      id: 'shipped',
                      label: 'จัดส่งไปรษณีย์แล้ว',
                      desc: 'ส่งมอบไปรษณีย์ พร้อมเลข EMS',
                      color: 'border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
                      activeColor: 'border-purple-600 bg-purple-100 text-purple-950 ring-2 ring-purple-500',
                    },
                    {
                      id: 'completed',
                      label: 'ส่งมอบสำเร็จ (ปิดงาน)',
                      desc: 'ผู้รับเอกสารเรียบร้อยแล้ว',
                      color: 'border-slate-300 bg-slate-100/50 hover:bg-slate-100 text-slate-900',
                      activeColor: 'border-slate-600 bg-slate-200 text-slate-950 ring-2 ring-slate-500',
                    },
                    {
                      id: 'paid',
                      label: 'ชำระเงินเรียบร้อยแล้ว',
                      desc: 'ยืนยันการรับเงินเข้าสู่ระบบ',
                      color: 'border-teal-300 bg-teal-50/50 hover:bg-teal-50 text-teal-900',
                      activeColor: 'border-teal-600 bg-teal-100 text-teal-950 ring-2 ring-teal-500',
                    },
                    {
                      id: 'pending_payment',
                      label: 'รอชำระเงิน',
                      desc: 'ยังไม่ได้รับการชำระเงิน',
                      color: 'border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
                      activeColor: 'border-amber-600 bg-amber-100 text-amber-950 ring-2 ring-amber-500',
                    },
                    {
                      id: 'cancelled',
                      label: 'ยกเลิกคำร้อง',
                      desc: 'ยกเลิกรายการคำขอนี้',
                      color: 'border-red-300 bg-red-50/50 hover:bg-red-50 text-red-900',
                      activeColor: 'border-red-600 bg-red-100 text-red-950 ring-2 ring-red-500',
                    },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatusModalNewStatus(s.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        statusModalNewStatus === s.id ? s.activeColor : s.color
                      }`}
                    >
                      <div className="font-bold text-xs">{s.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* EMS Tracking Input (Visible if status is shipped or postal) */}
              {(statusModalNewStatus === 'shipped' || selectedOrderForStatus.delivery_method === 'postal') && (
                <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                  <label className="block text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-purple-700" />
                    <span>หมายเลขพัสดุไปรษณีย์ EMS (Tracking No.)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ED123456789TH"
                    value={statusModalTrackingNo}
                    onChange={(e) => setStatusModalTrackingNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs border border-purple-300 rounded-xl font-mono uppercase bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-purple-700">
                    หมายเลขนี้จะแสดงให้นิสิตเห็นในหน้าระบบติดตามคำร้องทันที
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedOrderForStatus(null);
                }}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() =>
                  handleUpdateOrderStatus(
                    selectedOrderForStatus.order_no,
                    statusModalNewStatus,
                    statusModalTrackingNo.trim() || undefined
                  )
                }
                className="flex-1 py-2.5 bg-[#006633] hover:bg-[#004d26] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5 transition"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกสถานะใหม่</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Order Full Details */}
      {isDetailModalOpen && selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#006633]" />
                  <span>รายละเอียดคำร้องขอเอกสาร</span>
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedOrderForDetail.order_no}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedOrderForDetail(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Student Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                  <span>{selectedOrderForDetail.student_name}</span>
                  {getStudentTypeBadge(selectedOrderForDetail.student_status)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">รหัสนิสิต: </span>
                    <span className="font-mono font-bold text-slate-800">{selectedOrderForDetail.student_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">สถานะคำร้อง: </span>
                    <span>{getStatusBadge(selectedOrderForDetail.status)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">คณะ / สาขาวิชา: </span>
                    <span className="font-semibold text-slate-700">
                      {selectedOrderForDetail.faculty_name || '-'} / {selectedOrderForDetail.department_name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">วันเวลาที่ยื่น: </span>
                    <span className="text-slate-700">
                      {new Date(selectedOrderForDetail.created_at).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">ช่องทางรับ: </span>
                    <span className="font-semibold text-slate-800">
                      {selectedOrderForDetail.delivery_method === 'pickup'
                        ? 'รับที่เคาน์เตอร์'
                        : selectedOrderForDetail.delivery_method === 'postal'
                        ? 'ไปรษณีย์ EMS'
                        : 'ดิจิทัล PDF'}
                    </span>
                  </div>
                </div>

                {selectedOrderForDetail.shipping_address && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <div className="font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>ที่อยู่จัดส่งทางไปรษณีย์:</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-sans">
                      {selectedOrderForDetail.shipping_address}
                    </div>
                  </div>
                )}

                {selectedOrderForDetail.postal_tracking_no && (
                  <div className="mt-2 bg-purple-50 p-2.5 rounded-xl border border-purple-200 flex items-center justify-between">
                    <span className="text-purple-900 font-semibold flex items-center space-x-1">
                      <Truck className="w-3.5 h-3.5 text-purple-700" />
                      <span>หมายเลขพัสดุ EMS:</span>
                    </span>
                    <span className="font-mono font-bold text-purple-800 text-sm">
                      {selectedOrderForDetail.postal_tracking_no}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">รายการเอกสารที่ยื่นขอ:</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">รายการเอกสาร</th>
                        <th className="py-2.5 px-3 text-right">ราคาต่อฉบับ</th>
                        <th className="py-2.5 px-3 text-right">จำนวน</th>
                        <th className="py-2.5 px-3 text-right">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrderForDetail.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{item.item_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">฿{parseFloat(String(item.unit_price)).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#006633]">
                            ฿{parseFloat(String(item.amount || item.unit_price * item.quantity)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      {parseFloat(String(selectedOrderForDetail.shipping_fee || 0)) > 0 && (
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-right text-slate-500">ค่าจัดส่งไปรษณีย์ EMS:</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                            ฿{parseFloat(String(selectedOrderForDetail.shipping_fee)).toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-slate-800">ยอดรวมสุทธิ:</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-[#006633]">
                          ฿{parseFloat(String(selectedOrderForDetail.total_amount)).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedOrderForDetail(null);
                }}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
              {onViewReceipt && (
                <button
                  type="button"
                  onClick={() => onViewReceipt(selectedOrderForDetail.order_no)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ใบเสร็จรับเงิน</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenStatusModal(selectedOrderForDetail);
                }}
                className="flex-1 py-2.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>อัปเดตสถานะ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};