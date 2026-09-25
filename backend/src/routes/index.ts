import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';
import { StudentController } from '../controllers/student.controller.js';
import { DocumentController } from '../controllers/document.controller.js';
import { RequestController } from '../controllers/request.controller.js';
import { PaymentController } from '../controllers/payment.controller.js';
import { CounterController } from '../controllers/counter.controller.js';
import { ReportController } from '../controllers/report.controller.js';
import { AnnouncementController } from '../controllers/announcement.controller.js';
import { ThaiQrConfigController } from '../controllers/thaiQrConfig.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// --- 1. Authentication Routes ---
router.get('/auth/ku', AuthController.kuAuthorize);
router.get('/auth/ku/callback', AuthController.kuCallback);
router.post('/auth/ku-login', AuthController.kuAllLogin);
router.post('/auth/social-login', AuthController.socialOrAlumniLogin);
router.get('/auth/me', authenticate, AuthController.getMe);
router.post('/auth/switch-role', AuthController.switchDevRole);

// --- 2. Student & Verification Routes ---
router.post('/student/verify-citizen-id', authenticate, StudentController.verifyCitizenId);
router.get('/student/search/:query', authenticate, StudentController.searchStudent);

// --- 3. Document & Package Catalog ---
router.get('/documents', authenticate, DocumentController.getDocuments);
router.get('/packages', authenticate, DocumentController.getPackages);

// --- 4. Request / Order Lifecycle ---
router.post('/requests', authenticate, RequestController.createRequest);
router.get('/requests/my', authenticate, RequestController.getMyRequests);
router.get('/requests/:orderNo', authenticate, RequestController.getRequestDetail);

// --- 5. Payments & Receipts ---
router.post('/payment/confirm', PaymentController.confirmPayment);
router.get('/payment/receipt/:orderNo', PaymentController.getReceipt);

// --- 6. Counter Staff POS & Queue ---
router.get('/counter/orders', authenticate, requireRoles(['staff', 'admin']), CounterController.getOrders);
router.patch('/counter/orders/:orderNo/status', authenticate, requireRoles(['staff', 'admin']), CounterController.updateOrderStatus);
router.get('/counter/reconciliation', authenticate, requireRoles(['staff', 'admin']), CounterController.getDailyReconciliation);

// --- 7. Admin Management & Whitelist Upload ---
router.post('/admin/documents', authenticate, requireRoles(['admin']), DocumentController.saveDocument);
router.post('/admin/packages', authenticate, requireRoles(['admin']), DocumentController.savePackage);
router.post('/admin/packages/:id/upload-whitelist', authenticate, requireRoles(['admin']), upload.single('file'), DocumentController.uploadWhitelistExcel);
router.get('/admin/packages/:id/whitelist', authenticate, requireRoles(['admin']), DocumentController.getPackageWhitelist);
router.get('/admin/staff', authenticate, requireRoles(['admin']), ReportController.getStaffUsers);
router.post('/admin/staff', authenticate, requireRoles(['admin']), ReportController.addStaffUser);
router.delete('/admin/staff/:id', authenticate, requireRoles(['admin']), ReportController.deleteStaffUser);
router.get('/admin/applicants', authenticate, requireRoles(['admin']), ReportController.getApplicants);

// --- 8. Executive & Admin Analytics ---
router.get('/reports/executive', authenticate, requireRoles(['executive', 'admin']), ReportController.getExecutiveDashboard);

// --- 9. Public Relations & Announcements ---
router.get('/announcements', AnnouncementController.getAnnouncements);
router.get('/announcements/:id', AnnouncementController.getAnnouncementDetail);
router.post('/admin/announcements', authenticate, requireRoles(['admin']), AnnouncementController.saveAnnouncement);
router.delete('/admin/announcements/:id', authenticate, requireRoles(['admin']), AnnouncementController.deleteAnnouncement);

// --- 10. Thai QR & REF2 Configurations (Admin) ---
router.get('/admin/thaiqr/biller', authenticate, requireRoles(['admin']), ThaiQrConfigController.getBillerConfigs);
router.post('/admin/thaiqr/biller', authenticate, requireRoles(['admin']), ThaiQrConfigController.saveBillerConfig);

router.get('/admin/thaiqr/payment-types', authenticate, requireRoles(['admin']), ThaiQrConfigController.getPaymentTypes);
router.post('/admin/thaiqr/payment-types', authenticate, requireRoles(['admin']), ThaiQrConfigController.savePaymentType);
router.delete('/admin/thaiqr/payment-types/:id', authenticate, requireRoles(['admin']), ThaiQrConfigController.deletePaymentType);

router.get('/admin/thaiqr/categories', authenticate, requireRoles(['admin']), ThaiQrConfigController.getCategories);
router.post('/admin/thaiqr/categories', authenticate, requireRoles(['admin']), ThaiQrConfigController.saveCategory);
router.delete('/admin/thaiqr/categories/:id', authenticate, requireRoles(['admin']), ThaiQrConfigController.deleteCategory);

router.get('/admin/thaiqr/credit-limits', authenticate, requireRoles(['admin']), ThaiQrConfigController.getCreditLimits);
router.post('/admin/thaiqr/credit-limits', authenticate, requireRoles(['admin']), ThaiQrConfigController.saveCreditLimit);
router.delete('/admin/thaiqr/credit-limits/:id', authenticate, requireRoles(['admin']), ThaiQrConfigController.deleteCreditLimit);

router.get('/admin/thaiqr/ref2', authenticate, requireRoles(['admin']), ThaiQrConfigController.getRef2Configs);
router.post('/admin/thaiqr/ref2', authenticate, requireRoles(['admin']), ThaiQrConfigController.saveRef2Config);
router.delete('/admin/thaiqr/ref2/:id', authenticate, requireRoles(['admin']), ThaiQrConfigController.deleteRef2Config);
router.post('/admin/thaiqr/ref2/seed-default', authenticate, requireRoles(['admin']), ThaiQrConfigController.seedDefaults);
router.post('/admin/thaiqr/test-qr', authenticate, requireRoles(['admin']), ThaiQrConfigController.testGenerateQr);

export default router;