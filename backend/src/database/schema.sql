-- KU CSC e-Doc Database Schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150),
    role VARCHAR(30) NOT NULL, -- 'admin', 'staff', 'student', 'executive'
    auth_provider VARCHAR(30) NOT NULL, -- 'ku_alllogin', 'google', 'line', 'local'
    provider_id VARCHAR(255),
    first_name_th VARCHAR(100),
    last_name_th VARCHAR(100),
    phone_number VARCHAR(30),
    student_id VARCHAR(10),
    citizen_id VARCHAR(13),
    status_code VARCHAR(5),
    faculty_name VARCHAR(150),
    department_name VARCHAR(150),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Document Types
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_th VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    format VARCHAR(20) NOT NULL DEFAULT 'both',
    allowed_statuses TEXT[] NOT NULL,
    processing_days INT DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Document Packages
CREATE TABLE IF NOT EXISTS document_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_th VARCHAR(200) NOT NULL,
    description TEXT,
    package_price NUMERIC(10, 2) NOT NULL,
    is_restricted_whitelist BOOLEAN DEFAULT FALSE,
    allowed_statuses TEXT[] NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Package Items
CREATE TABLE IF NOT EXISTS package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES document_packages(id) ON DELETE CASCADE,
    document_type_id UUID REFERENCES document_types(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1
);

-- 5. Package Whitelist
CREATE TABLE IF NOT EXISTS package_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES document_packages(id) ON DELETE CASCADE,
    student_id VARCHAR(10) NOT NULL,
    full_name VARCHAR(200),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pkg_student UNIQUE(package_id, student_id)
);

-- 6. Document Requests
CREATE TABLE IF NOT EXISTS document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(35) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_id VARCHAR(10) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    student_status VARCHAR(5) NOT NULL,
    faculty_name VARCHAR(150),
    department_name VARCHAR(150),
    delivery_method VARCHAR(20) NOT NULL, -- 'pickup', 'postal', 'digital'
    recipient_name VARCHAR(150),
    shipping_address TEXT,
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
    postal_tracking_no VARCHAR(50),
    created_by_role VARCHAR(20) NOT NULL DEFAULT 'student',
    counter_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Request Items
CREATE TABLE IF NOT EXISTS request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES document_requests(id) ON DELETE CASCADE,
    document_type_id UUID REFERENCES document_types(id) ON DELETE SET NULL,
    package_id UUID REFERENCES document_packages(id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    amount NUMERIC(10, 2) NOT NULL
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES document_requests(id) ON DELETE CASCADE,
    order_no VARCHAR(35) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'thai_qr',
    qr_payload TEXT,
    qr_expired_at TIMESTAMP WITH TIME ZONE,
    biller_id VARCHAR(50),
    ref1 VARCHAR(50),
    ref2 VARCHAR(50),
    transaction_ref VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    receipt_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES document_requests(id) ON DELETE CASCADE,
    action_by UUID REFERENCES users(id) ON DELETE SET NULL,
    action_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Thai QR & REF2 Configurations
CREATE TABLE IF NOT EXISTS biller_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    biller_id VARCHAR(50) NOT NULL UNIQUE,
    merchant_name VARCHAR(150) NOT NULL,
    service_name_th VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ref2_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref2_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES payment_categories(id) ON DELETE SET NULL,
    credit_limit_id UUID REFERENCES credit_limits(id) ON DELETE SET NULL,
    payment_type_id UUID REFERENCES payment_types(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);