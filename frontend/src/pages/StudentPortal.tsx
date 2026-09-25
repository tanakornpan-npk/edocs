import React, { useState, useEffect } from 'react';
import { User, DocumentType, DocumentPackage, DocumentRequest } from '../types/index.js';
import { ApiClient } from '../services/api.js';
import { HeroBanner } from '../components/HeroBanner.js';
import {
  FileText,
  Package,
  Plus,
  Trash2,
  Clock,
  Truck,
  Building,
  Printer,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Filter,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface StudentPortalProps {
  user: User | null;
  activeSection?: 'catalog' | 'packages' | 'tracking';
  onSectionChange?: (section: 'catalog' | 'packages' | 'tracking') => void;
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  onRequestCheckout: () => void;
  onViewReceipt: (orderNo: string) => void;
  onOpenQrModal: (paymentData: any) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  activeSection,
  onSectionChange,
  cart,
  setCart,
  isCartOpen,
  setIsCartOpen,
  onRequestCheckout,
  onViewReceipt,
  onOpenQrModal,
}) => {
  const [subTab, setSubTab] = useState<'catalog' | 'packages' | 'tracking'>(activeSection || 'catalog');
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [packages, setPackages] = useState<DocumentPackage[]>([]);
  const [myRequests, setMyRequests] = useState<DocumentRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeSection && activeSection !== subTab) {
      setSubTab(activeSection);
      if (activeSection === 'tracking') {
        loadMyRequests();
      }
    }
  }, [activeSection]);

  const changeSubTab = (tab: 'catalog' | 'packages' | 'tracking') => {
    setSubTab(tab);
    onSectionChange?.(tab);
    if (tab === 'tracking') {
      loadMyRequests();
    }
  };

  // Delivery options
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'postal' | 'digital'>('pickup');
  const [recipientName, setRecipientName] = useState(
    user?.first_name_th ? `${user.first_name_th} ${user.last_name_th || ''}` : ''
  );
  const [shippingAddress, setShippingAddress] = useState('');

  useEffect(() => {
    loadCatalog();
    if (user) {
      loadMyRequests();
    }
  }, [user]);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const [docsRes, pkgsRes] = await Promise.all([
        ApiClient.getDocuments(),
        ApiClient.getPackages(),
      ]);
      setDocuments(docsRes.data);
      setPackages(pkgsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await ApiClient.getMyRequests();
      setMyRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectQuickAccess = (id: string) => {
    if (id === 'packages') {
      changeSubTab('packages');
      setSelectedCategory('all');
    } else if (id === 'tracking') {
      changeSubTab('tracking');
    } else if (id === 'receipt') {
      if (myRequests.length > 0 && myRequests[0].status !== 'pending_payment') {
        onViewReceipt(myRequests[0].order_no);
      } else {
        changeSubTab('tracking');
      }
    } else if (id === 'payment') {
      const pending = myRequests.find((r) => r.status === 'pending_payment');
      if (pending) {
        onOpenQrModal({
          order_no: pending.order_no,
          amount: pending.total_amount,
          thai_baht_text: '',
          qr_data_url: '',
        });
      } else {
        setIsCartOpen(true);
      }
    } else {
      changeSubTab('catalog');
      setSelectedCategory(id);
    }
  };

  const addToCart = (item: { id: string; name: string; price: number; isPackage?: boolean; packageId?: string; docId?: string; items?: any[] }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as any[]
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = deliveryMethod === 'postal' ? 50.0 : 0.0;
  const totalAmount = subtotal + shippingFee;

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    if (deliveryMethod === 'postal' && !shippingAddress.trim()) {
      alert('กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน');
      return;
    }

    if (user?.status_code === 'G' && !user.is_verified) {
      onRequestCheckout();
      return;
    }

    try {
      const orderPayload = {
        student_id: user?.student_id,
        student_name: `${user?.first_name_th || ''} ${user?.last_name_th || ''}`.trim(),
        student_status: user?.status_code || 'S',
        faculty_name: user?.faculty_name || '',
        delivery_method: deliveryMethod,
        recipient_name: recipientName,
        shipping_address: shippingAddress,
        items: cart.map((i) => ({
          document_type_id: i.docId || null,
          package_id: i.packageId || null,
          item_name: i.name,
          unit_price: i.price,
          quantity: i.quantity,
        })),
      };

      const res = await ApiClient.createRequest(orderPayload);
      setCart([]);
      setIsCartOpen(false);
      loadMyRequests();

      onOpenQrModal({
        order_no: res.order_no,
        amount: res.payment.amount,
        thai_baht_text: res.payment.amount_thai_text,
        qr_data_url: res.payment.qr_data_url,
        biller_id: res.payment.biller_id,
        merchant_name: res.payment.merchant_name,
        service_name_th: res.payment.service_name_th,
        ref1: res.payment.ref1,
        ref2: res.payment.ref2,
      });
    } catch (err: any) {
      alert('ไม่สามารถสร้างคำร้องได้: ' + err.message);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory === 'transcript') {
      return doc.code.includes('TRANSCRIPT');
    }
    if (selectedCategory === 'status_cert') {
      return doc.code.includes('STATUS') || doc.code.includes('EXPECTED');
    }
    if (selectedCategory === 'grad_cert') {
      return doc.code.includes('GRADUATION');
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold">รอชำระเงิน</span>;
      case 'paid':
      case 'processing':
        return <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full text-xs font-bold">กำลังจัดทำเอกสาร</span>;
      case 'ready_for_pickup':
        return <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full text-xs font-bold">พร้อมรับที่เคาน์เตอร์</span>;
      case 'shipped':
        return <span className="bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full text-xs font-bold">จัดส่งไปรษณีย์แล้ว</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-bold">เสร็จสิ้นแล้ว</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div>
      {/* 1. Authentic KU CSC Hero Banner with Circular Icons Bar */}
      <HeroBanner
        onSelectCategory={handleSelectQuickAccess}
        activeCategory={selectedCategory}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pb-24 md:pb-12">
        {/* Student Profile Ribbon Bar */}
        {user && (
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-black text-base flex items-center justify-center shadow">
                KU
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">
                    {user.first_name_th} {user.last_name_th}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      user.status_code === 'G'
                        ? 'bg-blue-100 text-blue-800'
                        : user.status_code === 'D'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {user.status_code === 'G'
                      ? 'ผู้สำเร็จการศึกษา (G)'
                      : user.status_code === 'D'
                      ? 'ลาพักการศึกษา (D)'
                      : 'นิสิตปัจจุบัน (S)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  รหัสนิสิต: <span className="font-bold text-emerald-900">{user.student_id || '-'}</span>
                  {user.faculty_name && ` • ${user.faculty_name}`}
                </div>
              </div>
            </div>

            {user.status_code === 'G' && (
              <div className="flex items-center space-x-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-600">
                  {user.is_verified ? (
                    <span className="text-emerald-700 font-semibold">ยืนยันตัวตนแล้ว (เลขบัตร {user.citizen_id})</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">ยืนยันเลขบัตร ปชช. เมื่อกดยื่นขอเอกสาร</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Catalog Tabs & Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                changeSubTab('catalog');
                setSelectedCategory('all');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                subTab === 'catalog'
                  ? 'bg-[#006633] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              รายการเอกสารเดี่ยว ({documents.length})
            </button>

            <button
              onClick={() => {
                changeSubTab('packages');
                setSelectedCategory('all');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                subTab === 'packages'
                  ? 'bg-[#FFC72C] text-[#004d26] font-black shadow-md ring-2 ring-[#FFC72C]/50'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              แพ็กเกจรวมราคาพิเศษ ({packages.length})
            </button>

            <button
              onClick={() => {
                changeSubTab('tracking');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                subTab === 'tracking'
                  ? 'bg-[#006633] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ติดตามสถานะคำร้อง ({myRequests.length})
            </button>
          </div>

          {subTab === 'catalog' && (
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 text-[11px] mr-1">หมวดหมู่:</span>
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'transcript', label: 'Transcript' },
                { id: 'status_cert', label: 'รับรองสถานภาพ' },
                { id: 'grad_cert', label: 'รับรองจบการศึกษา' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedCategory(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedCategory === f.id
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Document Cards Grid */}
        {subTab === 'catalog' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-600 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {doc.code}
                    </span>
                    <div className="flex items-center space-x-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                      <Clock className="w-3 h-3" />
                      <span>~{doc.processing_days} วันทำการ</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 group-hover:text-emerald-900 transition">
                    {doc.name_th}
                  </h3>
                  {doc.name_en && (
                    <h4 className="text-xs text-slate-400 mb-2">{doc.name_en}</h4>
                  )}
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ค่าธรรมเนียม</span>
                    <span className="text-lg font-black text-[#006633]">
                      ฿{parseFloat(String(doc.price)).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      addToCart({
                        id: doc.id,
                        docId: doc.id,
                        name: doc.name_th,
                        price: parseFloat(String(doc.price)),
                      })
                    }
                    className="px-3.5 py-2 bg-[#006633] hover:bg-[#004d26] active:scale-95 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มลงตะกร้า</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Packages Grid */}
        {subTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl p-6 border-2 border-[#FFC72C] shadow-md hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 bg-[#FFC72C] text-[#004d26] text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  PACKAGE BUNDLE
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 mb-1 pr-24">
                    {pkg.name_th}
                  </h3>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* รายการเอกสารที่รวมในแพ็กเกจ */}
                  {pkg.items && pkg.items.length > 0 && (
                    <div className="bg-slate-50/90 rounded-xl p-3 mb-3.5 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-slate-800">
                          <Layers className="w-3.5 h-3.5 text-[#006633]" />
                          <span>รายการเอกสารในแพ็กเกจ ({pkg.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0)} ฉบับ):</span>
                        </span>
                        {(() => {
                          const regularTotal = pkg.items.reduce((s: number, it: any) => {
                            const price = parseFloat(String(it.document_price || 0));
                            return s + (price * (it.quantity || 1));
                          }, 0);
                          const pkgPrice = parseFloat(String(pkg.package_price));
                          const saving = regularTotal - pkgPrice;
                          return saving > 0 ? (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              ประหยัด ฿{saving.toFixed(0)}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <ul className="space-y-1.5">
                        {pkg.items.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center justify-between text-xs text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-2xs">
                            <span className="flex items-center space-x-2 truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate font-medium text-slate-800">
                                {item.document_name_th || item.name_th}
                              </span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                              x{item.quantity || 1} ฉบับ
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pkg.is_restricted_whitelist && (
                    <div className="inline-flex items-center space-x-1.5 bg-purple-50 border border-purple-200 text-purple-800 text-[11px] px-2.5 py-1 rounded-lg mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>แพ็กเกจพิเศษเฉพาะผู้ได้รับสิทธิ์ (Whitelist Only)</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ราคาเหมาจ่ายพิเศษ</span>
                    <span className="text-2xl font-black text-[#004d26]">
                      ฿{parseFloat(String(pkg.package_price)).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      addToCart({
                        id: pkg.id,
                        packageId: pkg.id,
                        name: pkg.name_th,
                        price: parseFloat(String(pkg.package_price)),
                        isPackage: true,
                        items: pkg.items,
                      })
                    }
                    className="px-4 py-2.5 bg-gradient-to-r from-[#FFC72C] to-[#FFE885] hover:from-[#E5A823] hover:to-[#FFDF80] active:scale-95 text-[#004d26] font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition border border-[#FFC72C]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เลือกแพ็กเกจนี้</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tracking Tab */}
        {subTab === 'tracking' && (
          <div className="space-y-3">
            {myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-700 mb-1">ยังไม่มีประวัติคำร้องขอเอกสาร</h4>
                <p className="text-xs text-slate-400 mb-4">
                  ท่านสามารถเลือกเอกสารที่ต้องการเพื่อสร้างคำร้องได้ทันที
                </p>
                <button
                  onClick={() => setSubTab('catalog')}
                  className="px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  ไปหน้าเลือกเอกสาร
                </button>
              </div>
            ) : (
              myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-600 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {req.order_no}
                      </span>
                      <span className="text-xs text-slate-400">
                        ยื่นเมื่อ: {new Date(req.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>

                  <div className="space-y-1 mb-3 bg-slate-50 p-3 rounded-xl">
                    {req.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">
                          {item.item_name} x {item.quantity}
                        </span>
                        <span className="font-mono text-slate-900">
                          ฿{parseFloat(item.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between text-xs font-bold">
                      <span>ยอดรวมสุทธิ</span>
                      <span className="text-emerald-900 font-black">
                        ฿{parseFloat(String(req.total_amount)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">วิธีรับ:</span>
                      <span className="font-semibold text-slate-800">
                        {req.delivery_method === 'pickup'
                          ? 'มารับด้วยตนเองที่เคาน์เตอร์'
                          : req.delivery_method === 'postal'
                          ? `จัดส่งไปรษณีย์ EMS ${req.postal_tracking_no ? `(เลขพัสดุ: ${req.postal_tracking_no})` : '(รอจัดส่ง)'}`
                          : 'เอกสารอิเล็กทรอนิกส์ (Digital)'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {req.status === 'pending_payment' && (
                        <button
                          onClick={() =>
                            onOpenQrModal({
                              order_no: req.order_no,
                              amount: req.total_amount,
                              thai_baht_text: '',
                              qr_data_url: '',
                            })
                          }
                          className="px-3 py-1.5 bg-[#FFC72C] hover:bg-[#E5A823] text-[#004d26] font-black text-xs rounded-lg shadow"
                        >
                          ชำระเงิน QR
                        </button>
                      )}

                      {req.status !== 'pending_payment' && req.status !== 'cancelled' && (
                        <button
                          onClick={() => onViewReceipt(req.order_no)}
                          className="px-3 py-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006633] font-bold text-xs rounded-lg border border-[#A5D6A7] flex items-center space-x-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>ดูใบเสร็จ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Cart Drawer Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-5 bg-gradient-to-r from-[#004d26] to-[#006633] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-[#FFC72C]" />
                  <h3 className="font-bold text-base">ตะกร้าขอเอกสาร ({cart.length})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 hover:bg-emerald-700/60 rounded-lg text-emerald-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    ยังไม่มีเอกสารในตะกร้า
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex-1 mr-2">
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{item.name}</h4>
                        <span className="text-xs text-emerald-800 font-black font-mono">
                          ฿{item.price.toFixed(2)}
                        </span>
                        {item.isPackage && item.items && item.items.length > 0 && (
                          <div className="mt-1.5 p-1.5 bg-white/80 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                            {item.items.map((it: any, idx: number) => (
                              <div key={idx} className="truncate flex items-center space-x-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-600 shrink-0"></span>
                                <span className="truncate">{it.document_name_th || it.name_th} x{it.quantity || 1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {cart.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      เลือกวิธีการรับเอกสาร:
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          deliveryMethod === 'pickup'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Building className="w-4 h-4 mb-1 text-emerald-800" />
                        <div className="text-xs">มารับเองที่เคาน์เตอร์</div>
                        <div className="text-[10px] text-slate-400">ฟรี (วิทยาเขตสกลนคร)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('postal')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          deliveryMethod === 'postal'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Truck className="w-4 h-4 mb-1 text-amber-600" />
                        <div className="text-xs">จัดส่งไปรษณีย์ EMS</div>
                        <div className="text-[10px] text-amber-700 font-bold">+50 บาท</div>
                      </button>
                    </div>

                    {deliveryMethod === 'postal' && (
                      <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            ชื่อ-นามสกุล ผู้รับพัสดุ
                          </label>
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            ที่อยู่จัดส่งโดยละเอียด พร้อมเบอร์โทรศัพท์
                          </label>
                          <textarea
                            rows={3}
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์ และเบอร์ติดต่อ"
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>ค่าเอกสาร ({cart.reduce((a, b) => a + b.quantity, 0)} รายการ)</span>
                      <span className="font-mono">฿{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>ค่าจัดส่งไปรษณีย์</span>
                      <span className="font-mono">฿{shippingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                      <span>ยอดชำระสุทธิ</span>
                      <span className="text-[#006633] font-black text-lg font-mono">
                        ฿{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutSubmit}
                    className="w-full py-3 bg-[#006633] hover:bg-[#004d26] active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
                  >
                    <span>ยืนยันคำขอและชำระเงิน</span>
                    <ChevronRight className="w-4 h-4 text-[#FFC72C]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};