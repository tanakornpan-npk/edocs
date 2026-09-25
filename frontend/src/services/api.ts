const BASE_URL = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.BASE_URL || '/'}api`.replace(/\/{2,}/g, '/');

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('edoc_token');
  }

  static setToken(token: string) {
    localStorage.setItem('edoc_token', token);
  }

  static clearToken() {
    localStorage.removeItem('edoc_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }

    return data;
  }

  // --- Auth Endpoints ---
  static getKuOAuthRedirectUrl(returnUrl?: string): string {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    return `${BASE_URL}/auth/ku${query}`;
  }

  static async kuLogin(username: string) {
    return this.request<{ success: boolean; token: string; user: any; studentProfile?: any }>('/auth/ku-login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  static async socialLogin(provider: string, email: string, name?: string) {
    return this.request<{ success: boolean; token: string; user: any; require_citizen_id_verification: boolean }>(
      '/auth/social-login',
      {
        method: 'POST',
        body: JSON.stringify({ provider, email, name }),
      }
    );
  }

  static async switchDevRole(roleType: string) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ roleType }),
    });
  }

  static async getMe() {
    return this.request<{ success: boolean; user: any; studentDetails?: any }>('/auth/me');
  }

  // --- Student Endpoints ---
  static async verifyCitizenId(citizenId: string, selectedStudentId?: string) {
    return this.request<{
      success: boolean;
      require_selection?: boolean;
      records?: any[];
      token?: string;
      user?: any;
      studentProfile?: any;
      message: string;
    }>('/student/verify-citizen-id', {
      method: 'POST',
      body: JSON.stringify({ citizen_id: citizenId, selected_student_id: selectedStudentId }),
    });
  }

  static async searchStudent(query: string) {
    return this.request<{ success: boolean; student: any }>(`/student/search/${encodeURIComponent(query)}`);
  }

  // --- Document & Package Catalog ---
  static async getDocuments() {
    return this.request<{ success: boolean; data: any[] }>('/documents');
  }

  static async getPackages() {
    return this.request<{ success: boolean; data: any[] }>('/packages');
  }

  // --- Requests & Cart ---
  static async createRequest(orderData: any) {
    return this.request<{
      success: boolean;
      order_no: string;
      request: any;
      payment: {
        amount: number;
        amount_thai_text: string;
        qr_data_url: string;
        expired_at: string;
        biller_id?: string;
        merchant_name?: string;
        service_name_th?: string;
        ref1?: string;
        ref2?: string;
      };
    }>('/requests', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async getMyRequests() {
    return this.request<{ success: boolean; data: any[] }>('/requests/my');
  }

  static async getRequestDetail(orderNo: string) {
    return this.request<{ success: boolean; data: any }>(`/requests/${encodeURIComponent(orderNo)}`);
  }

  // --- Payments & Receipts ---
  static async confirmPayment(orderNo: string) {
    return this.request<{ success: boolean; message: string; receipt_no: string; status: string }>('/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({ order_no: orderNo }),
    });
  }

  static async getReceipt(orderNo: string) {
    return this.request<{ success: boolean; data: any }>(`/payment/receipt/${encodeURIComponent(orderNo)}`);
  }

  // --- Counter Staff Endpoints ---
  static async getCounterOrders(params: { status?: string; student_id?: string; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.student_id) searchParams.append('student_id', params.student_id);
    if (params.search) searchParams.append('search', params.search);
    return this.request<{ success: boolean; data: any[]; count: number }>(`/counter/orders?${searchParams.toString()}`);
  }

  static async updateOrderStatus(orderNo: string, status: string, postal_tracking_no?: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/counter/orders/${encodeURIComponent(orderNo)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, postal_tracking_no }),
      }
    );
  }

  static async getCounterReconciliation() {
    return this.request<{ success: boolean; data: any }>('/counter/reconciliation');
  }

  // --- Admin Endpoints ---
  static async saveDocument(docData: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/documents', {
      method: 'POST',
      body: JSON.stringify(docData),
    });
  }

  static async savePackage(pkgData: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/packages', {
      method: 'POST',
      body: JSON.stringify(pkgData),
    });
  }

  static async uploadWhitelist(packageId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ success: boolean; message: string; count: number }>(
      `/admin/packages/${encodeURIComponent(packageId)}/upload-whitelist`,
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  static async getWhitelist(packageId: string) {
    return this.request<{ success: boolean; data: any[]; count: number }>(
      `/admin/packages/${encodeURIComponent(packageId)}/whitelist`
    );
  }

  static async getStaffList() {
    return this.request<{ success: boolean; data: any[] }>('/admin/staff');
  }

  static async addStaff(staffData: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  static async deleteStaff(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async getApplicants() {
    return this.request<{ success: boolean; data: any[]; count: number }>('/admin/applicants');
  }

  // --- Executive & Analytics ---
  static async getExecutiveDashboard() {
    return this.request<{ success: boolean; data: any }>('/reports/executive');
  }

  // --- Announcements & PR ---
  static async getAnnouncements(category?: string) {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/announcements${query}`);
  }

  static async getAnnouncementDetail(id: string) {
    return this.request<{ success: boolean; data: any }>(`/announcements/${encodeURIComponent(id)}`);
  }

  static async saveAnnouncement(data: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteAnnouncement(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- Thai QR & REF2 Master Management (Admin) ---
  static async getBillerConfigs() {
    return this.request<{ success: boolean; data: any[] }>('/admin/thaiqr/biller');
  }

  static async saveBillerConfig(data: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/thaiqr/biller', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPaymentTypes() {
    return this.request<{ success: boolean; data: any[] }>('/admin/thaiqr/payment-types');
  }

  static async savePaymentType(data: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/thaiqr/payment-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deletePaymentType(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/thaiqr/payment-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async getPaymentCategories() {
    return this.request<{ success: boolean; data: any[] }>('/admin/thaiqr/categories');
  }

  static async savePaymentCategory(data: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/thaiqr/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deletePaymentCategory(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/thaiqr/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async getCreditLimits() {
    return this.request<{ success: boolean; data: any[] }>('/admin/thaiqr/credit-limits');
  }

  static async saveCreditLimit(data: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/thaiqr/credit-limits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteCreditLimit(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/thaiqr/credit-limits/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async getRef2Configs() {
    return this.request<{ success: boolean; data: any[] }>('/admin/thaiqr/ref2');
  }

  static async saveRef2Config(data: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/admin/thaiqr/ref2', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteRef2Config(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/thaiqr/ref2/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async seedDefaultRef2() {
    return this.request<{ success: boolean; message: string }>('/admin/thaiqr/ref2/seed-default', {
      method: 'POST',
    });
  }

  static async testGenerateQr(data: { amount: number; ref1: string; ref2: string; biller_id?: string }) {
    return this.request<{ success: boolean; data: any }>('/admin/thaiqr/test-qr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}