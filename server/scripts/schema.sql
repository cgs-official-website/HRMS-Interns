-- ================================================================
-- HRMS POSTGRESQL DATABASE SCHEMA (RAILWAY READY - UNLIMITED ID LENGTH)
-- ================================================================

DROP TABLE IF EXISTS external_links CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS environment_settings CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS dm_threads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS task_reports CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS regularization_requests CASCADE;
DROP TABLE IF EXISTS paid_leaves CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS company_domains CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. COMPANIES & DOMAINS
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    code TEXT,
    domain TEXT,
    logo_url TEXT,
    plan TEXT DEFAULT 'basic',
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE company_domains (
    domain TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'VERIFIED',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & STAFF DIRECTORY
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    employee_id TEXT,
    role TEXT DEFAULT 'employee',
    department TEXT,
    designation TEXT,
    program_type TEXT DEFAULT 'Full-time',
    employment_type TEXT DEFAULT 'Full-time',
    phone TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active',
    shift_start TEXT DEFAULT '09:00',
    shift_end TEXT DEFAULT '18:00',
    casual_leave_quota NUMERIC DEFAULT 25,
    sick_leave_quota NUMERIC DEFAULT 10,
    paid_leave_quota NUMERIC DEFAULT 6,
    gross_salary NUMERIC DEFAULT 0,
    paid_days NUMERIC DEFAULT 0,
    is_project_manager BOOLEAN DEFAULT FALSE,
    project TEXT,
    projects TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 3. ATTENDANCE LOGS
CREATE TABLE attendance (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    duration_minutes INT DEFAULT 0,
    status TEXT DEFAULT 'present',
    work_mode TEXT DEFAULT 'office',
    location JSONB DEFAULT '{}'::jsonb,
    check_in_location JSONB DEFAULT '{}'::jsonb,
    check_out_location JSONB DEFAULT '{}'::jsonb,
    breaks JSONB DEFAULT '[]'::jsonb,
    is_regularized BOOLEAN DEFAULT FALSE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_company_date ON attendance(company_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);

-- 4. LEAVES & REGULARIZATION
CREATE TABLE leave_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE paid_leaves (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regularization_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    requested_check_in TIMESTAMPTZ,
    requested_check_out TIMESTAMPTZ,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    manager_comment TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. PROJECTS, TASKS & REPORTS
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'in-progress',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY(project_id, user_id)
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_reports (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    user_id TEXT,
    company_id TEXT,
    content TEXT,
    time_spent_minutes INT DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    tasks_done TEXT,
    tasks_planned TEXT,
    blockers TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weekly_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. CHANNELS, MESSAGES, DMs
CREATE TABLE channels (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar TEXT,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dm_threads (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    participants TEXT[] NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE direct_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT REFERENCES dm_threads(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAYROLL, ASSETS, ROLES, SETTINGS & EXTERNAL LINKS
CREATE TABLE payroll (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    employee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    basic_salary NUMERIC DEFAULT 0,
    hra NUMERIC DEFAULT 0,
    allowances NUMERIC DEFAULT 0,
    gross_salary NUMERIC DEFAULT 0,
    pf_deduction NUMERIC DEFAULT 0,
    esi_deduction NUMERIC DEFAULT 0,
    tax_deduction NUMERIC DEFAULT 0,
    total_deductions NUMERIC DEFAULT 0,
    net_salary NUMERIC DEFAULT 0,
    paid_days NUMERIC DEFAULT 0,
    present_days NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    asset_tag TEXT,
    category TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'available',
    purchase_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE environment_settings (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE external_links (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    project_name TEXT,
    pm_id TEXT,
    pm_name TEXT,
    client_email TEXT,
    client_name TEXT,
    link_token TEXT UNIQUE NOT NULL,
    channel_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
