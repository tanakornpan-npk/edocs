import React, { useState, useEffect } from 'react';
import { User, DocumentRequest, DocumentType } from '../types/index.js';
import { ApiClient } from '../services/api.js';
import {
  Search,
  UserCheck,
  QrCode,
  Printer,
  CheckCircle,
  Truck,
  Building2,
  Clock,
  Filter,
  DollarSign,
  Plus,
  Loader2,
} from 'lucide-react';

interface CounterPortalProps {
  user: User | null;
  onViewReceipt: (orderNo: string) => void;
  onOpenQrModal: (paymentData: any) => void;
}

export const CounterPortal: React.FC<CounterPortalProps> = ({ onViewReceipt, onOpenQrModal }) => {
  const [orders, setOrders] = useState<DocumentRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Student Lookup & Walk-in Order Mode
  const [studentLookupId, setStudentLookupId] = useState('');
  const [lookedUpStudent, setLookedUpStudent] = useState<any>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentType[]>([]);
  const [walkinCart, setWalkinCart] = useState<any[]>([]);
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);

  // Daily Reconciliation Stats
  const [dailyStats, setDailyStats] = useState<any>(null);

  // Tracking modal input
  const [trackingModalOrder, setTrackingModalOrder] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => {
    loadOrders();
    loadDailyReconciliation();
    ApiClient.getDocuments().then((res) => setAvailableDocs(res.data)).catch(console.error);
  }, [filterStatus]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getCounterOrders({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchQuery || undefined,
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyReconciliation = async () => {
    try {
      const res = await ApiClient.getCounterReconciliation();
      setDailyStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchStudent = async () => {
    if (!studentLookupId.trim()) return;
    setIsSearchingStudent(true);
    setLookedUpStudent(null);
    try {
      const res = await ApiClient.searchStudent(studentLookupId.trim());
      setLookedUpStudent(res.student);
      setIsWalkinModalOpen(true);
    } catch (err: any) {
      alert('ไม่พบข้อมูลนิสิต: ' + err.message);
    } finally {
      setIsSearchingStudent(false);
    }
  };

  const handleUpdateStatus = async (orderNo: string, newStatus: string, trackingNo?: string) => {
    try {
      await ApiClient.updateOrderStatus(orderNo, newStatus, trackingNo);
      loadOrders();
      loadDailyReconciliation();
    } catch (err: any) {
      alert('ไม่สามารถอัปเดตสถานะได้: ' + err.message);
    }
  };

  const handleCreateWalkinOrder = async () => {
    if (!lookedUpStudent || walkinCart.length === 0) return;

    try {
      const orderPayload = {
        student_id: lookedUpStudent.student_id,
        student_name: `${lookedUpStudent.title_th || ''}${lookedUpStudent.first_name_th} ${lookedUpStudent.last_name_th}`.trim(),
        student_status: lookedUpStudent.status_code,
        faculty_name: lookedUpStudent.faculty_name_th,
        department_name: lookedUpStudent.department_name_th,
        delivery_method: 'pickup',
        items: walkinCart.map((i) => ({
          document_type_id: i.id,
          item_name: i.name_th,
          unit_price: i.price,
          quantity: i.quantity,
        })),
      };

      const res = await ApiClient.createRequest(orderPayload);
      setIsWalkinModalOpen(false);
      setWalkinCart([]);
      loadOrders();
      loadDailyReconciliation();

      // Show QR immediately on staff screen for student to scan
      onOpenQrModal({
        order_no: res.order_no,
        amount: res.payment.amount,
        thai_baht_text: res.payment.amount_thai_text,
        qr_data_url: res.payment.qr_data_url,
      });
    } catch (err: any) {
      alert('สร้างคำร้องไม่สำเร็จ: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Top Banner & Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ยอดเงินรับวันนี้ (Reconciliation)</div>
            <div className="text-xl font-black text-emerald-950">
              ฿{dailyStats ? parseFloat(dailyStats.total_revenue_today).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">กำลังจัดทำเอกสาร</div>
            <div className="text-xl font-black text-blue-950">
              {dailyStats?.processing_count || 0} รายการ
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">พร้อมรับที่เคาน์เตอร์</div>
            <div className="text-xl font-black text-amber-950">
              {dailyStats?.ready_pickup_count || 0} รายการ
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ปิดงานส่งมอบวันนี้</div>
            <div className="text-xl font-black text-slate-900">
              {dailyStats?.completed_today || 0} รายการ
            </div>
          </div>
        </div>
      </div>

      {/* POS Student Search & Walk-in Trigger */}
      <div className="bg-gradient-to-r from-[#004d26] via-[#006633] to-[#004d26] text-white rounded-2xl p-5 mb-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#006633]">
        <div>
          <h2 className="text-base font-bold flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#FFC72C]" />
            <span>บริการนิสิต Walk-in หน้าเคาน์เตอร์</span>
          </h2>
          <p className="text-xs text-emerald-100">
            ค้นหารหัสนิสิต (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก) จากฐานข้อมูล api.csc.ku.ac.th
          </p>
        </div>

        <div className="flex items-center space-x-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="รหัสนิสิต เช่น 6540201234"
              value={studentLookupId}
              onChange={(e) => setStudentLookupId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
              className="w-full pl-9 pr-3 py-2 bg-[#00381B] border border-emerald-600 rounded-xl text-xs text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
            />
            <Search className="w-4 h-4 text-emerald-300 absolute left-3 top-2.5" />
          </div>
          <button
            onClick={handleSearchStudent}
            disabled={isSearchingStudent}
            className="px-4 py-2 bg-[#FFC72C] hover:bg-[#E5A823] text-[#004d26] font-black text-xs rounded-xl shadow flex items-center space-x-1 transition flex-shrink-0"
          >
            {isSearchingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>ค้นหา & เปิดบิล</span>}
          </button>
        </div>
      </div>

      {/* Orders Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'processing', label: 'กำลังจัดทำ' },
            { id: 'ready_for_pickup', label: 'พร้อมรับ' },
            { id: 'shipped', label: 'จัดส่งแล้ว' },
            { id: 'completed', label: 'สำเร็จแล้ว' },
            { id: 'pending_payment', label: 'รอชำระเงิน' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? 'bg-emerald-800 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search within table */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="ค้นหาเลขคำร้อง / รหัสนิสิต"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Order Fulfillment Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4">หมายเลขคำร้อง</th>
                <th className="py-3 px-4">ข้อมูลนิสิต</th>
                <th className="py-3 px-4">รายการเอกสาร</th>
                <th className="py-3 px-4">ยอดเงิน</th>
                <th className="py-3 px-4">ช่องทางรับ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการคำร้อง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-800" />
                    <span>กำลังโหลดรายการคำร้อง...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบคำร้องที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.order_no}
                      <div className="text-[10px] text-slate-400 font-sans">
                        {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{order.student_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {order.student_id} • สถานะ {order.student_status}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="text-[11px] text-slate-700 truncate">
                            • {item.item_name} (x{item.quantity})
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                      ฿{parseFloat(String(order.total_amount)).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-700">
                        {order.delivery_method === 'pickup'
                          ? 'รับที่เคาน์เตอร์'
                          : order.delivery_method === 'postal'
                          ? 'ไปรษณีย์ EMS'
                          : 'ดิจิทัล PDF'}
                      </span>
                      {order.postal_tracking_no && (
                        <div className="text-[10px] font-mono text-purple-700 font-bold">
                          {order.postal_tracking_no}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : order.status === 'ready_for_pickup'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Quick action buttons based on status */}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_no, 'ready_for_pickup')}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] rounded shadow"
                            title="จัดทำเอกสารเสร็จแล้ว พร้อมส่งมอบ"
                          >
                            พร้อมรับ
                          </button>
                        )}

                        {order.delivery_method === 'postal' && order.status !== 'shipped' && order.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setTrackingModalOrder(order.order_no);
                              setTrackingInput(order.postal_tracking_no || '');
                            }}
                            className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold text-[10px] rounded shadow flex items-center space-x-0.5"
                            title="บันทึกเลขพัสดุ EMS"
                          >
                            <Truck className="w-3 h-3" />
                            <span>เลข EMS</span>
                          </button>
                        )}

                        {order.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_no, 'completed')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded shadow"
                            title="ส่งมอบเอกสารให้นิสิตเรียบร้อย"
                          >
                            ปิดงาน (ส่งมอบ)
                          </button>
                        )}

                        <button
                          onClick={() => onViewReceipt(order.order_no)}
                          className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded"
                          title="ดู/พิมพ์ใบเสร็จ"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Postal Tracking Number Input Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl">
            <h4 className="font-bold text-sm text-slate-800 mb-2">บันทึกเลขพัสดุไปรษณีย์ (EMS)</h4>
            <input
              type="text"
              placeholder="เช่น ED123456789TH"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
              className="w-full font-mono font-bold text-center text-sm px-3 py-2 border border-slate-300 rounded-xl mb-3"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(trackingModalOrder, 'shipped', trackingInput);
                  setTrackingModalOrder(null);
                }}
                className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl"
              >
                บันทึก & จัดส่ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Order Modal */}
      {isWalkinModalOpen && lookedUpStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">เปิดคำร้อง Walk-in ณ จุดบริการ</h3>
                <p className="text-xs text-slate-500">
                  {lookedUpStudent.first_name_th} {lookedUpStudent.last_name_th} ({lookedUpStudent.student_id})
                </p>
              </div>
              <button onClick={() => setIsWalkinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Document selector */}
            <div className="space-y-2 mb-4">
              <label className="block text-xs font-bold text-slate-700">เลือกรายการเอกสารที่ต้องการ:</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{doc.name_th}</div>
                      <div className="text-[10px] text-slate-400 font-mono">฿{parseFloat(String(doc.price)).toFixed(2)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWalkinCart((prev) => {
                          const exist = prev.find((x) => x.id === doc.id);
                          if (exist) {
                            return prev.map((x) => (x.id === doc.id ? { ...x, quantity: x.quantity + 1 } : x));
                          }
                          return [...prev, { ...doc, price: parseFloat(String(doc.price)), quantity: 1 }];
                        });
                      }}
                      className="px-2 py-1 bg-emerald-800 text-white rounded-lg font-bold text-[10px]"
                    >
                      + เพิ่ม
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected items in cart */}
            {walkinCart.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-700 mb-1">รายการที่เลือก ({walkinCart.length}):</div>
                {walkinCart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-[11px]">
                    <span>{item.name_th} x {item.quantity}</span>
                    <span className="font-mono font-bold text-slate-800">฿{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-emerald-950">
                  <span>ยอดรวม</span>
                  <span>฿{walkinCart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsWalkinModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                disabled={walkinCart.length === 0}
                onClick={handleCreateWalkinOrder}
                className="flex-1 py-2.5 bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow"
              >
                สร้างคำร้อง & ออก QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};