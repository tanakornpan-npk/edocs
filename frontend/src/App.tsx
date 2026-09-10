import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types/index.js';
import { ApiClient } from './services/api.js';

// Portals & Layouts
import { StudentNavbar } from './components/StudentNavbar.js';
import { StudentPortal } from './pages/StudentPortal.js';
import { StaffLayout } from './layouts/StaffLayout.js';
import { AdminLayout } from './layouts/AdminLayout.js';
import { ExecutiveLayout } from './layouts/ExecutiveLayout.js';
import { Footer } from './components/Footer.js';
import { BottomNav } from './components/BottomNav.js';
import { DevRoleBar } from './components/DevRoleBar.js';

// Modals
import { AuthModal } from './components/AuthModal.js';
import { JitVerifyModal } from './components/JitVerifyModal.js';
import { QrPaymentModal } from './components/QrPaymentModal.js';
import { ReceiptModal } from './components/ReceiptModal.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studentSection, setStudentSection] = useState<'catalog' | 'packages' | 'tracking'>('catalog');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isJitModalOpen, setIsJitModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    order_no: string;
    amount: number;
    thai_baht_text: string;
    qr_data_url: string;
  } | null>(null);
  const [receiptOrderNo, setReceiptOrderNo] = useState<string | null>(null);

  useEffect(() => {
    // Check initial user profile or login as default Student S
    ApiClient.getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        // Auto initialize with Student S for instant developer preview
        ApiClient.switchDevRole('student_s')
          .then((res) => {
            ApiClient.setToken(res.token);
            setUser(res.user);
          })
          .catch(console.error);
      });
  }, []);

  const handleSwitchRole = async (roleType: string) => {
    try {
      const res = await ApiClient.switchDevRole(roleType);
      ApiClient.setToken(res.token);
      setUser(res.user);
      setCart([]); // Reset cart on role switch
    } catch (err: any) {
      alert('ไม่สามารถสลับบทบาทได้: ' + err.message);
    }
  };

  const handleLogout = () => {
    ApiClient.clearToken();
    setUser(null);
    setCart([]);
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Routes>
          {/* 1. Student & Public Portal Route */}
          <Route
            path="/"
            element={
              <div className="flex flex-col min-h-screen justify-between">
                <StudentNavbar
                  user={user}
                  activeSection={studentSection}
                  onSelectSection={setStudentSection}
                  cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  onLogout={handleLogout}
                  onOpenLogin={() => setIsAuthModalOpen(true)}
                />

                <main className="flex-1">
                  <StudentPortal
                    user={user}
                    activeSection={studentSection}
                    onSectionChange={setStudentSection}
                    cart={cart}
                    setCart={setCart}
                    isCartOpen={isCartOpen}
                    setIsCartOpen={setIsCartOpen}
                    onRequestCheckout={() => setIsJitModalOpen(true)}
                    onViewReceipt={(orderNo) => setReceiptOrderNo(orderNo)}
                    onOpenQrModal={(data) => setQrModalData(data)}
                  />
                </main>

                <div className="pb-16 md:pb-0">
                  <Footer />
                </div>

                <BottomNav
                  user={user}
                  activeTab={studentSection}
                  setActiveTab={(tab) => {
                    if (tab === 'student' || tab === 'catalog') setStudentSection('catalog');
                    else if (tab === 'tracking') setStudentSection('tracking');
                  }}
                  cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                />
              </div>
            }
          />

          <Route path="/student" element={<Navigate to="/" replace />} />

          {/* 2. Counter Service Staff POS Portal Route */}
          <Route
            path="/staff"
            element={
              <StaffLayout
                user={user}
                onLogout={handleLogout}
                onViewReceipt={(orderNo) => setReceiptOrderNo(orderNo)}
                onOpenQrModal={(data) => setQrModalData(data)}
                onOpenLogin={() => setIsAuthModalOpen(true)}
              />
            }
          />

          <Route path="/counter" element={<Navigate to="/staff" replace />} />

          {/* 3. Admin Management Console Route */}
          <Route
            path="/admin"
            element={
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                onViewReceipt={(orderNo) => setReceiptOrderNo(orderNo)}
                onOpenLogin={() => setIsAuthModalOpen(true)}
              />
            }
          />

          {/* 4. Executive Strategic Dashboard Route */}
          <Route
            path="/executive"
            element={
              <ExecutiveLayout
                user={user}
                onLogout={handleLogout}
                onOpenLogin={() => setIsAuthModalOpen(true)}
              />
            }
          />

          <Route path="/reports" element={<Navigate to="/executive" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Floating Dev Role Bar for instant testing across all 4 portals */}
        <DevRoleBar user={user} onSwitchRole={handleSwitchRole} />

        {/* Global Modals */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
            if (loggedUser.role === 'admin' && window.location.pathname !== '/admin') {
              window.location.href = '/admin';
            } else if (loggedUser.role === 'staff' && window.location.pathname !== '/staff') {
              window.location.href = '/staff';
            } else if (loggedUser.role === 'executive' && window.location.pathname !== '/executive') {
              window.location.href = '/executive';
            }
          }}
        />

        <JitVerifyModal
          isOpen={isJitModalOpen}
          onClose={() => setIsJitModalOpen(false)}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            setIsCartOpen(true);
          }}
        />

        <QrPaymentModal
          isOpen={!!qrModalData}
          orderNo={qrModalData?.order_no || ''}
          amount={qrModalData?.amount || 0}
          thaiBahtText={qrModalData?.thai_baht_text || ''}
          qrDataUrl={qrModalData?.qr_data_url || ''}
          onClose={() => setQrModalData(null)}
          onPaymentSuccess={(_orderNo) => {}}
          onViewReceipt={(orderNo) => setReceiptOrderNo(orderNo)}
        />

        <ReceiptModal
          isOpen={!!receiptOrderNo}
          orderNo={receiptOrderNo}
          onClose={() => setReceiptOrderNo(null)}
        />
      </div>
    </BrowserRouter>
  );
}