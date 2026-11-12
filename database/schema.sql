-- ====================================================================
-- SmartAttend 3D – Database Schema
-- Compatible with SQLite3 and easily migratable to PostgreSQL
-- ====================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Authentication & System Accounts)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE', -- 'ADMIN', 'SECURITY_OFFICER', 'EMPLOYEE'
    is_active BOOLEAN NOT NULL DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employees Table (Workforce Profiles)
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    employee_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. SA-1001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department_id INTEGER,
    designation VARCHAR(100) NOT NULL,
    location VARCHAR(100) DEFAULT 'Bengaluru',
    joining_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'ON_LEAVE', 'TERMINATED'
    profile_photo_url TEXT,
    face_registered BOOLEAN NOT NULL DEFAULT 0,
    face_registered_at TIMESTAMP,
    shift_start_time VARCHAR(10) DEFAULT '09:00',
    shift_end_time VARCHAR(10) DEFAULT '17:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. Face Embeddings Table (Biometric Signatures)
CREATE TABLE IF NOT EXISTS face_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    embedding_vector TEXT NOT NULL, -- JSON serialized Float array (128D or 512D)
    model_name VARCHAR(100) NOT NULL DEFAULT 'SmartAttend-DeepNet-v2',
    model_version VARCHAR(50) NOT NULL DEFAULT '2.4.0',
    image_sample_url TEXT,
    quality_score REAL NOT NULL DEFAULT 0.95,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 5. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PRESENT', -- 'PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'
    work_hours REAL DEFAULT 0.0,
    recognition_confidence REAL DEFAULT 0.0,
    liveness_score REAL DEFAULT 0.0,
    is_spoof_prevented BOOLEAN DEFAULT 0,
    verification_mode VARCHAR(50) DEFAULT 'FACE_BIOMETRIC_3D', -- 'FACE_BIOMETRIC_3D', 'MANUAL_OVERRIDE', 'ADMIN_ADJUSTED'
    device_ip VARCHAR(50) DEFAULT '127.0.0.1',
    device_name VARCHAR(100) DEFAULT 'Main Gate Scanner Terminal #1',
    location_label VARCHAR(100) DEFAULT 'HQ Tech Park - Terminal A',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
);

-- 6. Security Events Table (Anti-Spoofing & Intrusion Audit Log)
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type VARCHAR(100) NOT NULL, -- 'SPOOF_PHOTO_DETECTED', 'SPOOF_SCREEN_DETECTED', 'SPOOF_VIDEO_REPLAY', 'UNKNOWN_FACE_ATTEMPT', 'CONFIDENCE_BELOW_THRESHOLD'
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    attempted_employee_id INTEGER,
    confidence_score REAL DEFAULT 0.0,
    liveness_score REAL DEFAULT 0.0,
    attack_vector VARCHAR(100), -- 'Printed Paper', 'Mobile Screen', 'Tablet Replay', '3D Mask Simulation'
    snapshot_url TEXT,
    device_ip VARCHAR(50) DEFAULT '127.0.0.1',
    device_name VARCHAR(100) DEFAULT 'Kiosk-01-Lobby',
    location_label VARCHAR(100) DEFAULT 'Main Lobby Entry',
    description TEXT,
    resolved BOOLEAN DEFAULT 0,
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempted_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'GENERAL', -- 'GENERAL', 'AI_SECURITY', 'ATTENDANCE', 'HARDWARE'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_face_emb_emp ON face_embeddings(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_sec_events_created ON security_events(created_at);
