import React, { useState } from 'react';
import { ApiClient } from '../services/api.js';
import { KuLogo } from './KuLogo.js';
import { LogIn, GraduationCap, Globe, Mail, ShieldAlert, CheckCircle2, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [authTab, setAuthTab] = useState<'ku' | 'alumni'>('ku');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alumniEmail, setAlumniEmail] = useState('');
  const [alumniName, setAlumniName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleKuLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await ApiClient.kuLogin(username.trim());
      ApiClient.setToken(res.token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlumniLogin = async (provider: string, mockEmail?: string) => {
    setIsLoading(true);
    setErrorMsg('');
    const emailToUse = mockEmail || alumniEmail || 'alumni.graduate@gmail.com';
    const nameToUse = alumniName || 'บัณฑิต มก.ฉกส.';

    try {
      const res = await ApiClient.socialLogin(provider, emailToUse, nameToUse);
      ApiClient.setToken(res.token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg">เข้าสู่ระบบ edoc</span>
              <span className="text-[10px] bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full font-black">
                มก.ฉกส.
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">ระบบขอเอกสารทางการศึกษาออนไลน์</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-700/60 rounded-lg text-emerald-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setAuthTab('ku')}
            className={`flex-1 py-3 text-center transition flex items-center justify-center space-x-1.5 ${
              authTab === 'ku'
                ? 'border-b-2 border-emerald-800 text-emerald-900 bg-emerald-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>นิสิตปัจจุบัน & บุคลากร (KU All-login)</span>
          </button>

          <button
            onClick={() => setAuthTab('alumni')}
            className={`flex-1 py-3 text-center transition flex items-center justify-center space-x-1.5 ${
              authTab === 'alumni'
                ? 'border-b-2 border-emerald-800 text-emerald-900 bg-emerald-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>นิสิตเก่าสำเร็จการศึกษา (G)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs mb-4">
              {errorMsg}
            </div>
          )}

          {authTab === 'ku' ? (
            <div className="space-y-4">
              {/* Official Single Sign-On Button */}
              <a
                href={ApiClient.getKuOAuthRedirectUrl(window.location.href)}
                className="w-full py-3 px-4 bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2.5 no-underline cursor-pointer border border-emerald-700 active:scale-[0.99]"
              >
                <div className="bg-white rounded-md p-0.5 flex items-center justify-center shadow-sm">
                  <KuLogo size={20} />
                </div>
                <span className="text-xs sm:text-sm">เข้าสู่ระบบด้วย KU All-login (SSO)</span>
              </a>

              <div className="relative my-3 text-center">
                <span className="bg-white px-2 text-[10px] text-slate-400 relative z-10">
                  หรือ เข้าสู่ระบบด้วยบัญชีทดสอบในระบบ (Dev Login)
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
              </div>

              <form onSubmit={handleKuLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บัญชีผู้ใช้ KU All-login หรือ รหัสนิสิต
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 6540201234, admin.edoc, staff.counter"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">รหัสผ่าน (Password)</label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">
                      โหมดทดสอบ: ใช้ 123456 หรืออะไรก็ได้
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="เช่น 123456 (หรือพิมพ์รหัสผ่านใดก็ได้)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>เข้าสู่ระบบด้วยบัญชีทดสอบ</span>}
                </button>

                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  *สำหรับนิสิตสถานะกำลังศึกษา (S), ลาพัก (D), เจ้าหน้าที่ และผู้บริหาร
                </p>
              </form>
            </div>
          ) : (
            /* Alumni Social Login Tab */
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
                สำหรับผู้สำเร็จการศึกษา (G) ท่านสามารถลงทะเบียนหรือเข้าสู่ระบบได้สะดวกรวดเร็วด้วย Google หรือ LINE
              </div>

              {/* 1-Click Google Login Button */}
              <button
                type="button"
                onClick={() => handleAlumniLogin('google', 'somwang.graduate@gmail.com')}
                className="w-full py-2.5 px-4 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>เข้าสู่ระบบด้วยบัญชี Google (1-Click)</span>
              </button>

              {/* 1-Click LINE Login Button */}
              <button
                type="button"
                onClick={() => handleAlumniLogin('line', 'alumni.line@line.me')}
                className="w-full py-2.5 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
              >
                <span className="font-extrabold text-sm">LINE</span>
                <span>เข้าสู่ระบบด้วย LINE</span>
              </button>

              <div className="relative my-3 text-center">
                <span className="bg-white px-2 text-[10px] text-slate-400 relative z-10">
                  หรือใช้อีเมลทั่วไป
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
              </div>

              <div>
                <input
                  type="email"
                  placeholder="อีเมลของคุณ เช่น yourname@gmail.com"
                  value={alumniEmail}
                  onChange={(e) => setAlumniEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mb-2"
                />
                <button
                  type="button"
                  disabled={!alumniEmail.trim()}
                  onClick={() => handleAlumniLogin('email')}
                  className="w-full py-2 bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  ดำเนินการต่อด้วยอีเมล
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};