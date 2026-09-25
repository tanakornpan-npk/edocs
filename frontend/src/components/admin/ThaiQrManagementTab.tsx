import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api.js';
import {
  BillerConfig,
  PaymentType,
  PaymentCategory,
  CreditLimit,
  Ref2Config,
} from '../../types/index.js';
import {
  QrCode,
  Building2,
  Tag,
  FolderTree,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Check,
  X,
  Play,
  FileSpreadsheet,
  Globe,
  Server,
  Send,
  Terminal,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const ThaiQrManagementTab: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<
    'ref2' | 'biller' | 'types' | 'categories' | 'limits' | 'simulator'
  >('ref2');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data states
  const [billerConfigs, setBillerConfigs] = useState<BillerConfig[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [categories, setCategories] = useState<PaymentCategory[]>([]);
  const [creditLimits, setCreditLimits] = useState<CreditLimit[]>([]);
  const [ref2List, setRef2List] = useState<Ref2Config[]>([]);

  // Filtering for REF2
  const [ref2Search, setRef2Search] = useState('');
  const [ref2CatFilter, setRef2CatFilter] = useState('all');
  const [ref2TypeFilter, setRef2TypeFilter] = useState('all');
  const [ref2LimitFilter, setRef2LimitFilter] = useState('all');

  // Modals
  const [isRef2ModalOpen, setIsRef2ModalOpen] = useState(false);
  const [ref2Form, setRef2Form] = useState<{
    id?: string;
    ref2_code: string;
    name: string;
    category_id: string;
    credit_limit_id: string;
    payment_type_id: string;
    is_active: boolean;
  }>({
    ref2_code: '',
    name: '',
    category_id: '',
    credit_limit_id: '',
    payment_type_id: '',
    is_active: true,
  });

  // Biller Form
  const [billerForm, setBillerForm] = useState<{
    id?: string;
    biller_id: string;
    merchant_name: string;
    service_name_th: string;
    use_central_service?: boolean;
    soap_url?: string;
    biller_suffix?: string;
    app_code?: string;
    callback_url?: string;
  }>({
    biller_id: '099400063727601',
    merchant_name: 'KASETSART UNIVERSITY CSC',
    service_name_th: 'มหาวิทยาลัยเกษตรศาสตร์ ว.เฉลิมพระเกียรติฯ',
    use_central_service: false,
    soap_url: 'https://fin.ku.ac.th/qr/service',
    biller_suffix: '01',
    app_code: '06',
    callback_url: 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback',
  });

  // Central SOAP Testing State
  const [isTestingSoap, setIsTestingSoap] = useState(false);
  const [soapTestResult, setSoapTestResult] = useState<any>(null);
  const [showSoapDetails, setShowSoapDetails] = useState(false);

  // Type Modal
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState<{ id?: string; code: string; name: string; description: string }>({
    code: '',
    name: '',
    description: '',
  });

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState<{ id?: string; code: string; name: string }>({
    code: '',
    name: '',
  });

  // Limit Modal
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitForm, setLimitForm] = useState<{ id?: string; code: string; name: string }>({
    code: '',
    name: '',
  });

  // Simulator
  const [simAmount, setSimAmount] = useState<number>(50);
  const [simRef1, setSimRef1] = useState<string>('6540201234');
  const [simRef2, setSimRef2] = useState<string>('300');
  const [simQrResult, setSimQrResult] = useState<any>(null);
  const [isSimLoading, setIsSimLoading] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Load all master data
  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [billerRes, typesRes, catsRes, limitsRes, ref2Res] = await Promise.all([
        ApiClient.getBillerConfigs(),
        ApiClient.getPaymentTypes(),
        ApiClient.getPaymentCategories(),
        ApiClient.getCreditLimits(),
        ApiClient.getRef2Configs(),
      ]);

      if (billerRes.data) {
        setBillerConfigs(billerRes.data);
        const activeBiller = billerRes.data.find((b: any) => b.is_active) || billerRes.data[0];
        if (activeBiller) {
          setBillerForm({
            id: activeBiller.id,
            biller_id: activeBiller.biller_id,
            merchant_name: activeBiller.merchant_name,
            service_name_th: activeBiller.service_name_th,
            use_central_service: !!activeBiller.use_central_service,
            soap_url: activeBiller.soap_url || 'https://fin.ku.ac.th/qr/service',
            biller_suffix: activeBiller.biller_suffix || '01',
            app_code: activeBiller.app_code || '06',
            callback_url: activeBiller.callback_url || 'https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback',
          });
        }
      }
      if (typesRes.data) setPaymentTypes(typesRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      if (limitsRes.data) setCreditLimits(limitsRes.data);
      if (ref2Res.data) setRef2List(ref2Res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // --- Handlers: Biller ---
  const handleSaveBiller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.saveBillerConfig({
        id: billerForm.id,
        biller_id: billerForm.biller_id,
        merchant_name: billerForm.merchant_name,
        service_name_th: billerForm.service_name_th,
        is_active: true,
        use_central_service: billerForm.use_central_service,
        soap_url: billerForm.soap_url,
        biller_suffix: billerForm.biller_suffix,
        app_code: billerForm.app_code,
        callback_url: billerForm.callback_url,
      });
      showNotification('บันทึกข้อมูล Biller ID สำเร็จ');
      loadAllData();
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleTestSoapConnection = async () => {
    setIsTestingSoap(true);
    setSoapTestResult(null);
    try {
      const res = await ApiClient.testKuCentralSoap({
        soap_url: billerForm.soap_url,
        app_code: billerForm.app_code,
        biller_suffix: billerForm.biller_suffix,
        callback_url: billerForm.callback_url,
        amount: 1.0,
        student_id: '6540201234',
        ref2_code: '300',
      });
      setSoapTestResult(res.data);
      if (res.data?.success) {
        showNotification('เชื่อมต่อระบบกลาง มก. สำเร็จ!');
      }
    } catch (err: any) {
      setSoapTestResult({
        success: false,
        error: err.message,
      });
    } finally {
      setIsTestingSoap(false);
    }
  };

  // --- Handlers: REF2 ---
  const handleOpenAddRef2 = () => {
    setRef2Form({
      ref2_code: '',
      name: '',
      category_id: categories[0]?.id || '',
      credit_limit_id: creditLimits[0]?.id || '',
      payment_type_id: paymentTypes[0]?.id || '',
      is_active: true,
    });
    setIsRef2ModalOpen(true);
  };

  const handleOpenEditRef2 = (item: Ref2Config) => {
    setRef2Form({
      id: item.id,
      ref2_code: item.ref2_code,
      name: item.name,
      category_id: item.category_id || '',
      credit_limit_id: item.credit_limit_id || '',
      payment_type_id: item.payment_type_id || '',
      is_active: item.is_active,
    });
    setIsRef2ModalOpen(true);
  };

  const handleSaveRef2 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.saveRef2Config(ref2Form);
      setIsRef2ModalOpen(false);
      showNotification('บันทึกรหัส REF2 เรียบร้อยแล้ว');
      loadAllData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDeleteRef2 = async (id: string, code: string) => {
    if (!window.confirm(`ยืนยันการลบรหัส REF2 "${code}" ใช่หรือไม่?`)) return;
    try {
      await ApiClient.deleteRef2Config(id);
      showNotification(`ลบรหัส REF2 "${code}" เรียบร้อยแล้ว`);
      loadAllData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(
        'คุณต้องการนำเข้า/รีเซ็ตข้อมูลตั้งต้น 36 รายการตามตาราง Excel หรือไม่? (ข้อมูลที่ตรงกันจะถูกอัปเดต)'
      )
    )
      return;
    try {
      setIsLoading(true);
      const res = await ApiClient.seedDefaultRef2();
      showNotification(res.message);
      await loadAllData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers: Simulator ---
  const handleRunSimulator = async () => {
    setIsSimLoading(true);
    try {
      const res = await ApiClient.testGenerateQr({
        amount: Number(simAmount),
        ref1: simRef1,
        ref2: simRef2,
        biller_id: billerForm.biller_id,
      });
      setSimQrResult(res.data);
    } catch (err: any) {
      alert('สร้าง QR จำลองไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSimLoading(false);
    }
  };

  // Filtered REF2 items
  const filteredRef2 = ref2List.filter((item) => {
    const q = ref2Search.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.ref2_code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q);

    const matchCat =
      ref2CatFilter === 'all' || item.category_id === ref2CatFilter;
    const matchType =
      ref2TypeFilter === 'all' || item.payment_type_id === ref2TypeFilter;
    const matchLimit =
      ref2LimitFilter === 'all' || item.credit_limit_id === ref2LimitFilter;

    return matchQuery && matchCat && matchType && matchLimit;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveSubSection('ref2')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubSection === 'ref2'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#006633] hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ตาราง REF2 & การเชื่อมโยง ({ref2List.length})</span>
        </button>

        <button
          onClick={() => setActiveSubSection('biller')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubSection === 'biller'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#006633] hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Biller ID & ข้อมูลผู้รับชำระ</span>
        </button>

        <button
          onClick={() => setActiveSubSection('types')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubSection === 'types'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#006633] hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>ประเภทการชำระเงิน (map_App code) ({paymentTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubSection('categories')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubSection === 'categories'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#006633] hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>หมวด / กลุ่ม ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubSection('limits')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubSection === 'limits'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#006633] hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>วงเงิน ({creditLimits.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubSection('simulator');
            if (!simQrResult) handleRunSimulator();
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubSection === 'simulator'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>ทดสอบสร้าง QR (Simulator)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: REF2 Master Table & Mapping                                     */}
      {/* ========================================================================= */}
      {activeSubSection === 'ref2' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#006633]" />
                <span>ตารางข้อมูลรหัส REF2 และการเชื่อมโยงระบบการเงิน (REF2 Mapping Table)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดรหัส Reference 2 สำหรับการออก Thai QR Code Cross-Bank Bill Payment (มาตรฐาน Tag 30)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSeedDefaults}
                disabled={isLoading}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                title="โหลดข้อมูลชุดเริ่มต้น 36 รายการตามตาราง Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>นำเข้าข้อมูลเริ่มต้น (36 รายการ)</span>
              </button>

              <button
                onClick={handleOpenAddRef2}
                className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรหัส REF2 ใหม่</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={ref2Search}
                onChange={(e) => setRef2Search(e.target.value)}
                placeholder="ค้นหารหัส REF2 หรือชื่อ..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={ref2CatFilter}
                onChange={(e) => setRef2CatFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
              >
                <option value="all">ทุกหมวด / กลุ่ม</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={ref2TypeFilter}
                onChange={(e) => setRef2TypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
              >
                <option value="all">ทุกประเภท (map_App code)</option>
                {paymentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={ref2LimitFilter}
                onChange={(e) => setRef2LimitFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
              >
                <option value="all">ทุกระดับวงเงิน</option>
                {creditLimits.map((l) => (
                  <option key={l.id} value={l.id}>
                    วงเงิน {l.code}: {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">รหัส REF2</th>
                  <th className="py-3 px-4">ชื่อ / ความหมาย</th>
                  <th className="py-3 px-4">หมวด / กลุ่ม</th>
                  <th className="py-3 px-4 text-center">วงเงิน</th>
                  <th className="py-3 px-4 text-center">map_App code</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRef2.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลรหัส REF2 ที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredRef2.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-emerald-50/30 transition ${
                        item.ref2_code === '300' ? 'bg-emerald-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                          {item.ref2_code}
                        </span>
                        {item.ref2_code === '300' && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#006633] text-white">
                            หลัก (e-Doc)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.category_name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {item.category_name}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.credit_limit_code ? (
                          <span className="font-bold text-slate-700 px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[11px]">
                            {item.credit_limit_code}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.payment_type_code ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {item.payment_type_code}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.is_active ? 'เปิดใช้งาน' : 'ปิด'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditRef2(item)}
                          className="p-1 text-slate-500 hover:text-[#006633] hover:bg-slate-100 rounded-lg transition"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRef2(item.id, item.ref2_code)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="ลบ"
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
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: Biller ID & Organization Config                                */}
      {/* ========================================================================= */}
      {activeSubSection === 'biller' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2 mb-1">
              <Building2 className="w-4 h-4 text-[#006633]" />
              <span>การตั้งค่า Biller ID & ข้อมูลผู้รับชำระของมหาวิทยาลัย</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              ระบุรหัส Biller ID 13 - 15 หลักตามที่ได้รับอนุมัติจากธนาคารแห่งประเทศไทย/ธนาคารผู้ให้บริการ เพื่อใช้ฝังใน EMVCo Tag 30
            </p>

            <form onSubmit={handleSaveBiller} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biller ID (รหัสผู้รับชำระ 13–15 หลัก) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={billerForm.biller_id}
                  onChange={(e) => setBillerForm({ ...billerForm, biller_id: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  placeholder="เช่น 099400063727601"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  หมายเลขประจำตัวผู้เสียภาษี 13 หลัก + รหัสบริการ 2 หลัก
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Merchant Name (ชื่อบัญชีผู้รับชำระภาษาอังกฤษ Tag 59) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={billerForm.merchant_name}
                  onChange={(e) => setBillerForm({ ...billerForm, merchant_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  placeholder="เช่น KASETSART UNIVERSITY CSC"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ความยาวไม่เกิน 25 ตัวอักษรตามมาตรฐาน EMVCo Tag 59
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อหน่วยงานภาษาไทย (สำหรับแสดงผลบนหน้าจอและใบเสร็จ)
                </label>
                <input
                  type="text"
                  value={billerForm.service_name_th}
                  onChange={(e) => setBillerForm({ ...billerForm, service_name_th: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  placeholder="เช่น มหาวิทยาลัยเกษตรศาสตร์ ว.เฉลิมพระเกียรติฯ"
                />
              </div>

              {/* KU Central QR Service Integration */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                  <div className="flex items-start space-x-2.5">
                    <Server className="w-5 h-5 text-[#006633] mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        เชื่อมต่อระบบสร้าง QR ส่วนกลาง มก. (KU Central QR Web Service)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        เชื่อมต่อไปยังระบบ สบศ./กองคลัง มก. เพื่อคำนวณ SCB Check Digit และรับผลชำระเงินอัตโนมัติ (Webhook)
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billerForm.use_central_service || false}
                      onChange={(e) => setBillerForm({ ...billerForm, use_central_service: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006633]"></div>
                  </label>
                </div>

                {billerForm.use_central_service && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mb-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        SOAP Web Service Endpoint URL
                      </label>
                      <input
                        type="url"
                        value={billerForm.soap_url || ''}
                        onChange={(e) => setBillerForm({ ...billerForm, soap_url: e.target.value })}
                        placeholder="https://fin.ku.ac.th/qr/service"
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ระบบผลิตจริง (Production): https://fin.ku.ac.th/qr/service
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          App Code (รหัสระบบ)
                        </label>
                        <input
                          type="text"
                          value={billerForm.app_code || ''}
                          onChange={(e) => setBillerForm({ ...billerForm, app_code: e.target.value })}
                          placeholder="06"
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          06: ค่าเอกสารสำคัญทางการศึกษา
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Biller Suffix (2 หลักท้าย)
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          value={billerForm.biller_suffix || ''}
                          onChange={(e) => setBillerForm({ ...billerForm, biller_suffix: e.target.value })}
                          placeholder="01"
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          เช่น 01 หรือรหัสเฉพาะของ วข.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Callback Webhook URL (สำหรับรับผลการชำระเงินจากระบบกลาง)
                      </label>
                      <input
                        type="url"
                        value={billerForm.callback_url || ''}
                        onChange={(e) => setBillerForm({ ...billerForm, callback_url: e.target.value })}
                        placeholder="https://service.csc.ku.ac.th/edocs/api/payment/ku-qr-callback"
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ระบบจะตัดชำระเงินอัตโนมัติเมื่อธนาคารยิง Callback มาที่ URL นี้
                      </p>
                    </div>

                    {/* Test Button & Results */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleTestSoapConnection}
                        disabled={isTestingSoap}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                      >
                        {isTestingSoap ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังทดสอบเชื่อมต่อ...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>ทดสอบยิงคำขอ SOAP ไปยังระบบกลาง</span>
                          </>
                        )}
                      </button>

                      {soapTestResult && (
                        <button
                          type="button"
                          onClick={() => setShowSoapDetails(!showSoapDetails)}
                          className="text-xs text-slate-600 hover:text-slate-800 font-semibold underline flex items-center space-x-1"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>{showSoapDetails ? 'ซ่อนรายละเอียด XML' : 'ดูรายละเอียด XML / Response'}</span>
                        </button>
                      )}
                    </div>

                    {/* Test Result Display */}
                    {soapTestResult && (
                      <div className={`p-3 rounded-xl border text-xs ${soapTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        <div className="flex items-center space-x-2 font-bold mb-1">
                          {soapTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                          <span>{soapTestResult.success ? 'เชื่อมต่อและสร้าง QR จากระบบกลาง มก. สำเร็จ!' : 'การเชื่อมต่อระบบกลางไม่สำเร็จ'}</span>
                          {soapTestResult.durationMs && <span className="text-[10px] font-mono text-slate-400">({soapTestResult.durationMs}ms)</span>}
                        </div>
                        {soapTestResult.error && (
                          <p className="text-[11px] text-amber-700 font-mono mt-1 bg-white/60 p-2 rounded">
                            {soapTestResult.error}
                          </p>
                        )}

                        {soapTestResult.qrDataUrl && (
                          <div className="mt-3 flex items-center space-x-4 bg-white p-3 rounded-lg border border-emerald-200">
                            <img src={soapTestResult.qrDataUrl} alt="SOAP Test QR" className="w-24 h-24 rounded border border-slate-200" />
                            <div>
                              <div className="font-bold text-slate-800">QR ID: {soapTestResult.qrId || '-'}</div>
                              <div className="text-[11px] text-slate-500">App ID: {soapTestResult.appId || '-'} | App Code: {soapTestResult.appCode}</div>
                              <div className="text-[11px] text-slate-500">Ref1: {soapTestResult.ref1Prefix}</div>
                              <div className="text-[11px] text-slate-500">Ref2: {soapTestResult.ref2Prefix}</div>
                            </div>
                          </div>
                        )}

                        {showSoapDetails && (
                          <div className="mt-3 space-y-2">
                            {soapTestResult.rawXmlRequest && (
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">SOAP XML Request ที่ส่งไป:</div>
                                <pre className="text-[10px] font-mono p-2 bg-slate-900 text-slate-200 rounded max-h-36 overflow-y-auto whitespace-pre-wrap">
                                  {soapTestResult.rawXmlRequest}
                                </pre>
                              </div>
                            )}
                            {soapTestResult.rawXmlResponse && (
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">SOAP XML Response ที่ได้รับ:</div>
                                <pre className="text-[10px] font-mono p-2 bg-slate-900 text-slate-200 rounded max-h-36 overflow-y-auto whitespace-pre-wrap">
                                  {soapTestResult.rawXmlResponse}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า Biller ID</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-4">
                <QrCode className="w-5 h-5" />
                <span className="font-bold text-xs uppercase tracking-wider">Thai QR Bill Payment Preview</span>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-3 backdrop-blur-sm">
                <div>
                  <div className="text-[10px] text-emerald-200">ชื่อผู้รับชำระ (Merchant Name)</div>
                  <div className="font-mono font-bold text-sm text-white">
                    {billerForm.merchant_name || 'KASETSART UNIVERSITY CSC'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-emerald-200">ชื่อหน่วยงานภาษาไทย</div>
                  <div className="font-semibold text-xs text-white">
                    {billerForm.service_name_th || 'มหาวิทยาลัยเกษตรศาสตร์ ว.เฉลิมพระเกียรติฯ'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-emerald-200">Biller ID</div>
                    <div className="font-mono font-bold text-xs text-amber-300">
                      {billerForm.biller_id || '099400063727601'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-200">AID มาตรฐาน</div>
                    <div className="font-mono text-[10px] text-emerald-100">
                      A000000677010112
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[10px] text-emerald-200">โหมดการสร้าง QR:</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${billerForm.use_central_service ? 'bg-amber-400 text-emerald-950' : 'bg-white/20 text-white'}`}>
                    {billerForm.use_central_service ? '⚡ KU Central SOAP' : '🛡️ BOT Tag 30 Standalone'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-emerald-300/80 mt-6 leading-relaxed">
              * ข้อมูลชุดนี้จะถูกดึงไปใช้สร้าง QR Code การชำระเงินทุกครั้งที่มีการยื่นคำร้องในระบบ e-Doc
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: Payment Types (map_App code)                                   */}
      {/* ========================================================================= */}
      {activeSubSection === 'types' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-[#006633]" />
                <span>ประเภทการชำระเงิน (map_App code)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดรหัสประเภทการชำระเงิน เช่น 01 (ค่าสมัคร), 06 (ค่าธรรมเนียมการศึกษา)
              </p>
            </div>
            <button
              onClick={() => {
                setTypeForm({ code: '', name: '', description: '' });
                setIsTypeModalOpen(true);
              }}
              className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มประเภทใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                  <th className="py-3 px-4 w-28">รหัส (Code)</th>
                  <th className="py-3 px-4">ชื่อประเภทการชำระเงิน</th>
                  <th className="py-3 px-4">รายละเอียด</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paymentTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        {t.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.name}</td>
                    <td className="py-3 px-4 text-slate-500">{t.description || '-'}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setTypeForm({ id: t.id, code: t.code, name: t.name, description: t.description || '' });
                          setIsTypeModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-[#006633] hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`ลบประเภท ${t.code} หรือไม่?`)) {
                            await ApiClient.deletePaymentType(t.id);
                            loadAllData();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: Categories (หมวด/กลุ่ม)                                         */}
      {/* ========================================================================= */}
      {activeSubSection === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-[#006633]" />
                <span>หมวด / กลุ่ม (Payment Categories)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เช่น ค่าธรรมเนียมการศึกษา, ค่าธรรมเนียมพัฒนาวิชาการและอื่นๆ, ค่าหอพัก
              </p>
            </div>
            <button
              onClick={() => {
                setCatForm({ code: '', name: '' });
                setIsCatModalOpen(true);
              }}
              className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหมวดใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                  <th className="py-3 px-4 w-36">รหัสหมวด (Code)</th>
                  <th className="py-3 px-4">ชื่อหมวด / กลุ่ม</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setCatForm({ id: c.id, code: c.code, name: c.name });
                          setIsCatModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-[#006633] hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`ลบหมวด ${c.name} หรือไม่?`)) {
                            await ApiClient.deletePaymentCategory(c.id);
                            loadAllData();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: Credit Limits (วงเงิน)                                          */}
      {/* ========================================================================= */}
      {activeSubSection === 'limits' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-[#006633]" />
                <span>ระดับวงเงิน (Credit Limits / Budget Group)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดรหัสวงเงิน เช่น 1 (วงเงินปกติ ระดับ 1), 3 (วงเงินภาคพิเศษ ระดับ 3)
              </p>
            </div>
            <button
              onClick={() => {
                setLimitForm({ code: '', name: '' });
                setIsLimitModalOpen(true);
              }}
              className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวงเงินใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                  <th className="py-3 px-4 w-28">รหัสวงเงิน</th>
                  <th className="py-3 px-4">ชื่อระดับวงเงิน</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {creditLimits.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        {l.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.name}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setLimitForm({ id: l.id, code: l.code, name: l.name });
                          setIsLimitModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-[#006633] hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`ลบวงเงิน ${l.code} หรือไม่?`)) {
                            await ApiClient.deleteCreditLimit(l.id);
                            loadAllData();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: QR Code Simulator                                              */}
      {/* ========================================================================= */}
      {activeSubSection === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <Play className="w-4 h-4 text-amber-600" />
              <span>เครื่องมือจำลองสร้าง Thai QR Bill Payment (Live Test)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ทดสอบสร้าง QR Code ตามมาตรฐาน EMVCo Tag 30 พร้อมถอดรหัสค่า Tag ต่างๆ ตรวจสอบความถูกต้อง
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={simAmount}
                  onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold text-[#006633] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference 1 (รหัสนิสิต หรือ Order No)
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={simRef1}
                  onChange={(e) => setSimRef1(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference 2 (เลือกรหัส REF2 จากระบบ)
                </label>
                <select
                  value={simRef2}
                  onChange={(e) => setSimRef2(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                >
                  {ref2List.map((r) => (
                    <option key={r.id} value={r.ref2_code}>
                      {r.ref2_code} : {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSimLoading}
                  onClick={handleRunSimulator}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${isSimLoading ? 'animate-spin' : ''}`} />
                  <span>{isSimLoading ? 'กำลังสร้าง...' : 'สร้างและคำนวณ QR Code'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            {simQrResult ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Image */}
                  <div className="p-3 bg-slate-50 border-2 border-emerald-300 rounded-2xl shadow-inner text-center shrink-0">
                    <img
                      src={simQrResult.qrDataUrl}
                      alt="Thai QR Preview"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                    <div className="text-[10px] font-bold text-emerald-900 mt-1">
                      THAI QR BILL PAYMENT
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="space-y-2 text-xs w-full">
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                      <div className="text-[11px] text-slate-500">ยอดชำระ:</div>
                      <div className="text-xl font-black text-emerald-950">
                        ฿{parseFloat(String(simQrResult.amount)).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ({simQrResult.amountThaiText})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Biller ID:</span>
                        <span className="font-mono font-bold text-slate-800">{simQrResult.billerId}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">REF1:</span>
                        <span className="font-mono font-bold text-slate-800">{simQrResult.ref1}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">REF2:</span>
                        <span className="font-mono font-bold text-emerald-800">{simQrResult.ref2}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">ผู้รับชำระ:</span>
                        <span className="font-bold text-slate-700 truncate block">{simQrResult.merchantName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EMVCo Payload Raw */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-bold">EMVCo Raw Payload (Tag-Length-Value):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(simQrResult.payload);
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 2000);
                      }}
                      className="text-emerald-700 hover:underline flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedPayload ? 'คัดลอกแล้ว!' : 'คัดลอกสตริง'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] break-all select-all shadow-inner leading-relaxed">
                    {simQrResult.payload}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                กดปุ่ม "สร้างและคำนวณ QR Code" เพื่อทดสอบการทำงาน
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add/Edit REF2                                                      */}
      {/* ========================================================================= */}
      {isRef2ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-[#006633] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-300" />
                <span>{ref2Form.id ? 'แก้ไขรหัส REF2' : 'เพิ่มรหัส REF2 ใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsRef2ModalOpen(false)}
                className="p-1 hover:bg-emerald-800 rounded text-emerald-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRef2} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัส REF2 (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ref2Form.ref2_code}
                  onChange={(e) => setRef2Form({ ...ref2Form, ref2_code: e.target.value.trim() })}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  placeholder="เช่น 300, 309, 271, C3100/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ / ความหมายของรายการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ref2Form.name}
                  onChange={(e) => setRef2Form({ ...ref2Form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  placeholder="เช่น ค่าเอกสารสำคัญทางการศึกษา"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวด / กลุ่ม</label>
                  <select
                    value={ref2Form.category_id}
                    onChange={(e) => setRef2Form({ ...ref2Form, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วงเงิน</label>
                  <select
                    value={ref2Form.credit_limit_id}
                    onChange={(e) => setRef2Form({ ...ref2Form, credit_limit_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {creditLimits.map((l) => (
                      <option key={l.id} value={l.id}>
                        วงเงิน {l.code} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเภทการชำระเงิน (map_App code)
                </label>
                <select
                  value={ref2Form.payment_type_id}
                  onChange={(e) => setRef2Form({ ...ref2Form, payment_type_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:outline-none"
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {paymentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} : {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="ref2Active"
                  checked={ref2Form.is_active}
                  onChange={(e) => setRef2Form({ ...ref2Form, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#006633] rounded focus:ring-0"
                />
                <label htmlFor="ref2Active" className="text-xs font-medium text-slate-700">
                  เปิดใช้งานรหัส REF2 นี้ในระบบ
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRef2ModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006633] hover:bg-[#004d26] text-white text-xs font-bold rounded-xl shadow transition"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add/Edit Payment Type                                              */}
      {/* ========================================================================= */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#006633] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">ประเภทการชำระเงิน</h3>
              <button onClick={() => setIsTypeModalOpen(false)}>
                <X className="w-4 h-4 text-emerald-200" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await ApiClient.savePaymentType(typeForm);
                setIsTypeModalOpen(false);
                loadAllData();
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัส (เช่น 06)</label>
                <input
                  type="text"
                  required
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อประเภท</label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                  rows={2}
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#006633] text-white text-xs font-bold rounded-xl"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add/Edit Category                                                  */}
      {/* ========================================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#006633] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">หมวด / กลุ่ม</h3>
              <button onClick={() => setIsCatModalOpen(false)}>
                <X className="w-4 h-4 text-emerald-200" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await ApiClient.savePaymentCategory(catForm);
                setIsCatModalOpen(false);
                loadAllData();
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสหมวด (เช่น EDU_FEE)</label>
                <input
                  type="text"
                  required
                  value={catForm.code}
                  onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อหมวด / กลุ่ม</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#006633] text-white text-xs font-bold rounded-xl"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add/Edit Credit Limit                                              */}
      {/* ========================================================================= */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#006633] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">ระดับวงเงิน</h3>
              <button onClick={() => setIsLimitModalOpen(false)}>
                <X className="w-4 h-4 text-emerald-200" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await ApiClient.saveCreditLimit(limitForm);
                setIsLimitModalOpen(false);
                loadAllData();
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสวงเงิน (เช่น 1, 3)</label>
                <input
                  type="text"
                  required
                  value={limitForm.code}
                  onChange={(e) => setLimitForm({ ...limitForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อระดับวงเงิน</label>
                <input
                  type="text"
                  required
                  value={limitForm.name}
                  onChange={(e) => setLimitForm({ ...limitForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLimitModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#006633] text-white text-xs font-bold rounded-xl"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
