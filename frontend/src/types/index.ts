export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'student' | 'executive';
  auth_provider: 'ku_alllogin' | 'google' | 'line' | 'local';
  first_name_th?: string;
  last_name_th?: string;
  phone_number?: string;
  student_id?: string;
  citizen_id?: string;
  status_code?: 'S' | 'D' | 'G';
  faculty_name?: string;
  department_name?: string;
  is_verified?: boolean;
}

export interface StudentProfile {
  student_id: string;
  citizen_id: string;
  title_th: string;
  first_name_th: string;
  last_name_th: string;
  status_code: 'S' | 'D' | 'G' | 'W' | 'R';
  status_desc_th: string;
  faculty_name_th: string;
  department_name_th: string;
  major_name_th: string;
  degree_level: 'Bachelor' | 'Master' | 'Doctoral';
  degree_name_th: string;
  gpa: number;
  email?: string;
  phone_number?: string;
}

export interface DocumentType {
  id: string;
  code: string;
  name_th: string;
  name_en?: string;
  description?: string;
  price: number | string;
  format: 'hardcopy' | 'digital' | 'both';
  allowed_statuses: string[];
  processing_days: number;
  ref2_code?: string;
  is_active: boolean;
}

export interface DocumentPackage {
  id: string;
  code: string;
  name_th: string;
  description?: string;
  package_price: number | string;
  is_restricted_whitelist: boolean;
  allowed_statuses: string[];
  ref2_code?: string;
  items?: Array<{
    id?: string;
    document_type_id: string;
    quantity: number;
    name_th?: string;
    document_name_th?: string;
    document_code?: string;
    document_price?: number | string;
    document_format?: string;
  }>;
  is_active: boolean;
}

export interface RequestItem {
  id?: string;
  document_type_id?: string;
  package_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  amount: number;
}

export interface DocumentRequest {
  id: string;
  order_no: string;
  student_id: string;
  student_name: string;
  student_status: string;
  faculty_name?: string;
  department_name?: string;
  delivery_method: 'pickup' | 'postal' | 'digital';
  recipient_name?: string;
  shipping_address?: string;
  shipping_fee: number | string;
  subtotal: number | string;
  total_amount: number | string;
  status: 'pending_payment' | 'paid' | 'processing' | 'ready_for_pickup' | 'shipped' | 'completed' | 'cancelled';
  postal_tracking_no?: string;
  created_by_role: string;
  created_at: string;
  items?: RequestItem[];
  payment?: {
    status: string;
    amount: number;
    receipt_no?: string;
    qr_payload?: string;
    qr_data_url?: string;
    qr_expired_at?: string;
    biller_id?: string;
    ref1?: string;
    ref2?: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  category: 'urgent' | 'academic' | 'general' | 'guide';
  summary?: string;
  content: string;
  badge_text?: string;
  image_url?: string;
  external_link?: string;
  is_pinned: boolean;
  is_active: boolean;
  view_count?: number;
  publish_date?: string;
  created_at?: string;
}

// --- Thai QR & REF2 Types ---
export interface BillerConfig {
  id: string;
  biller_id: string;
  merchant_name: string;
  service_name_th: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface PaymentCategory {
  id: string;
  code: string;
  name: string;
  created_at?: string;
}

export interface CreditLimit {
  id: string;
  code: string;
  name: string;
  created_at?: string;
}

export interface Ref2Config {
  id: string;
  ref2_code: string;
  name: string;
  category_id?: string | null;
  category_name?: string | null;
  category_code?: string | null;
  credit_limit_id?: string | null;
  credit_limit_code?: string | null;
  credit_limit_name?: string | null;
  payment_type_id?: string | null;
  payment_type_code?: string | null;
  payment_type_name?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}