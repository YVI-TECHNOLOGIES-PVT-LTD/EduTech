-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (

    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_code VARCHAR(30) NOT NULL UNIQUE,

    org_name VARCHAR(200) NOT NULL,

    board_affiliation VARCHAR(50),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    postal_code VARCHAR(20),

    country VARCHAR(100) NOT NULL DEFAULT 'India',

    phone VARCHAR(20) NOT NULL,

    email VARCHAR(200) NOT NULL,

    website VARCHAR(200),

    subscription_tier subscription_tier
        NOT NULL DEFAULT 'starter',

    status user_status
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now()

    created_by UUID,

    updated_by UUID
);


-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (

    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(200) NOT NULL,

    phone VARCHAR(20) NOT NULL,

    sso_subject VARCHAR(200),

    password_hash TEXT,

    status user_status
        NOT NULL DEFAULT 'active',

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),
    
    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(org_id, email)
);

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE TABLE roles (

    role_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    role_name VARCHAR(50)
        NOT NULL,

    description TEXT,

    is_active BOOLEAN
        NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE (org_id, role_name)
);


-- ============================================================================
-- USER ROLES
-- ============================================================================

CREATE TABLE user_roles (

    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES roles(role_id)
        ON DELETE RESTRICT,

    granted_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    granted_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    PRIMARY KEY (user_id, role_id)
);


-- ============================================================================
-- DESIGNATIONS
-- ============================================================================

CREATE TABLE designations (

    designation_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    designation_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    UNIQUE(org_id, designation_name)
);


-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

CREATE TABLE departments (

    department_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    department_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    UNIQUE(org_id, department_name)
);

-- ============================================================================
-- STAFF
-- ============================================================================

CREATE TABLE staff (

    staff_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    employee_code VARCHAR(30) NOT NULL,

    designation_id UUID
        REFERENCES designations(designation_id)
        ON DELETE RESTRICT,

    department_id UUID
        REFERENCES departments(department_id)
        ON DELETE RESTRICT,

    joining_date DATE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    UNIQUE(org_id, employee_code),

    UNIQUE(user_id)
);

-- ============================================================================
-- PARENTS
-- ============================================================================

CREATE TABLE parents (

    parent_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    phone VARCHAR(20) NOT NULL,

    email VARCHAR(200),

    occupation VARCHAR(100),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

ALTER TABLE parents
ADD COLUMN user_id UUID UNIQUE
REFERENCES users(user_id)
ON DELETE SET NULL;

-- ============================================================================
-- ACADEMIC YEARS
-- ============================================================================

CREATE TABLE academic_years (

    academic_year_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    academic_year_name VARCHAR(30) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status academic_year_status
        NOT NULL DEFAULT 'planning',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CHECK (end_date > start_date),

    UNIQUE(org_id, academic_year_name)
);

-- ============================================================================
-- ADMISSION CONFIGURATIONS
-- ============================================================================

CREATE TABLE admission_configurations (

    configuration_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    academic_year_id UUID NOT NULL
        REFERENCES academic_years(academic_year_id)
        ON DELETE CASCADE,

    admission_start_date DATE NOT NULL,

    admission_end_date DATE NOT NULL,

    application_fee NUMERIC(10,2)
        NOT NULL DEFAULT 0,

    assessment_required BOOLEAN
        NOT NULL DEFAULT FALSE,

    allow_waitlist BOOLEAN
        NOT NULL DEFAULT TRUE,

    allow_online_application BOOLEAN
        NOT NULL DEFAULT TRUE,

    minimum_age NUMERIC(4,2),

    maximum_age NUMERIC(4,2),

    max_applications INTEGER,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(org_id, academic_year_id),

    CHECK (admission_end_date >= admission_start_date)
);


-- ============================================================================
-- GRADES
-- ============================================================================

CREATE TABLE grades (

    grade_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    grade_code VARCHAR(20) NOT NULL,

    grade_name VARCHAR(50) NOT NULL,

    board VARCHAR(50),

    display_order INTEGER NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(org_id, grade_code),

    UNIQUE(org_id, grade_name)
);

-- ============================================================================
-- ACADEMIC YEAR GRADES
-- ============================================================================

CREATE TABLE academic_year_grades (

    academic_year_grade_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    academic_year_id UUID NOT NULL
        REFERENCES academic_years(academic_year_id)
        ON DELETE CASCADE,

    grade_id UUID NOT NULL
        REFERENCES grades(grade_id)
        ON DELETE CASCADE,

    intake_capacity INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE (academic_year_id, grade_id)
);

-- ============================================================================
-- SECTIONS
-- ============================================================================

CREATE TABLE sections (

    section_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    academic_year_grade_id UUID NOT NULL
        REFERENCES academic_year_grades(academic_year_grade_id)
        ON DELETE CASCADE,

    section_name VARCHAR(10) NOT NULL,

    class_teacher_id UUID
        REFERENCES staff(staff_id)
        ON DELETE SET NULL,

    room_no VARCHAR(20),

    capacity INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE (academic_year_grade_id, section_name)
);


-- ============================================================================
-- LEADS
-- ============================================================================

CREATE TABLE leads (

    lead_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    lead_number VARCHAR(30)
        NOT NULL UNIQUE,

    academic_year_grade_id UUID NOT NULL
        REFERENCES academic_year_grades(academic_year_grade_id)
        ON DELETE RESTRICT,

    -- Student Information
    student_first_name VARCHAR(100)
        NOT NULL,

    student_last_name VARCHAR(100),

    dob DATE,

    gender gender_type,

    -- Admission Preference
    curriculum_preference VARCHAR(50),

    scholarship_interest BOOLEAN
        NOT NULL DEFAULT FALSE,

    -- Primary Contact
    contact_name VARCHAR(150)
        NOT NULL,

    contact_relationship relationship_type,

    contact_phone VARCHAR(20)
        NOT NULL,

    contact_email VARCHAR(200),

    -- CRM
    source lead_source
        NOT NULL,

    stage lead_stage
        NOT NULL DEFAULT 'enquiry_received',

    priority lead_priority
        DEFAULT 'warm',

    ai_lead_score NUMERIC(5,2),

    assigned_counsellor_id UUID
        REFERENCES staff(staff_id)
        ON DELETE SET NULL,

    remarks TEXT,

    enquiry_date DATE
        NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================================================
-- LEAD ACTIVITIES
-- ============================================================================

CREATE TABLE lead_activities (

    activity_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL
        REFERENCES leads(lead_id)
        ON DELETE CASCADE,

    activity_type lead_activity_type
        NOT NULL,

    activity_date TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    status activity_status
        NOT NULL DEFAULT 'completed',

    next_followup_date DATE,

    notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- CHATBOT SESSIONS 
-- ----------------------------------------------------------------------------

CREATE TABLE chatbot_sessions (
  session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  channel             chatbot_channel NOT NULL DEFAULT 'web_widget',

  -- Who the session belongs to — a session can start anonymous (lead_id and
  -- user_id both null) and be linked once the visitor identifies themselves.
  lead_id             UUID REFERENCES leads(lead_id) ON DELETE SET NULL,
  user_id             UUID REFERENCES users(user_id) ON DELETE SET NULL,
  anonymous_contact   VARCHAR(150),           -- phone/email captured before a lead row exists

  status              chatbot_status NOT NULL DEFAULT 'active',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at            TIMESTAMPTZ,

  -- Escalation to a human counsellor (mirrors lead_activities activity_type = 'chatbot_session')
  escalated_to_staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
  escalation_reason   TEXT,

  -- Post-session quality signals
  ai_summary          TEXT,                   -- AI-generated session summary
  satisfaction_rating SMALLINT CHECK (satisfaction_rating BETWEEN 1 AND 5),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. CHATBOT MESSAGES — one row per message, in order, within a session
-- ----------------------------------------------------------------------------
CREATE TABLE chatbot_messages (
  message_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE,
  sender           chatbot_sender NOT NULL,
  content          TEXT NOT NULL,

  -- AI/NLU metadata — null for sender = 'user' or 'staff'
  intent           VARCHAR(50),               -- e.g. 'fee_query', 'admission_status', 'schedule_visit'
  confidence_score NUMERIC(5,2),              -- 0-100, model's confidence in the detected intent
  model_version    VARCHAR(30),
  response_time_ms INT,                       -- latency for bot replies; null for user/staff messages

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- LEAD VISITS
-- ============================================================================

CREATE TABLE lead_visits (

    visit_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL
        REFERENCES leads(lead_id)
        ON DELETE CASCADE,

    visit_type visit_type
        NOT NULL,

    scheduled_at TIMESTAMPTZ
        NOT NULL,

    staff_id UUID
        REFERENCES staff(staff_id)
        ON DELETE SET NULL,

    status visit_status
        NOT NULL DEFAULT 'scheduled',

    meeting_link TEXT,

    remarks TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL
);



-- ============================================================================
-- ADMISSIONS APPLICATIONS
-- ============================================================================

CREATE TABLE admissions_applications (

    application_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL
        REFERENCES leads(lead_id)
        ON DELETE CASCADE,

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    academic_year_id UUID NOT NULL
        REFERENCES academic_years(academic_year_id)
        ON DELETE CASCADE,

    application_number VARCHAR(30)
        NOT NULL UNIQUE,

    application_date DATE
        NOT NULL DEFAULT CURRENT_DATE,

    status application_status
        NOT NULL DEFAULT 'submitted',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE (lead_id)
);


-- ============================================================================
-- DOCUMENT TYPES
-- ============================================================================

CREATE TABLE document_types (

    document_type_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    document_name VARCHAR(100)
        NOT NULL,

    description TEXT,

    is_mandatory BOOLEAN
        NOT NULL DEFAULT FALSE,

    is_active BOOLEAN
        NOT NULL DEFAULT TRUE,

    display_order INT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(org_id, document_name)
);


-- ============================================================================
-- ADMISSION DOCUMENTS
-- ============================================================================

CREATE TABLE admission_documents (

    document_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL
        REFERENCES admissions_applications(application_id)
        ON DELETE CASCADE,

    document_type_id UUID NOT NULL
        REFERENCES document_types(document_type_id)
        ON DELETE RESTRICT,

    file_path TEXT NOT NULL,

    verify_status document_verify_status
        NOT NULL DEFAULT 'pending',

    verification_remarks TEXT,

    uploaded_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    verified_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(application_id, document_type_id)
);

-- ============================================================================
-- ASSESSMENT CONFIGURATIONS
-- ============================================================================

CREATE TABLE assessment_configurations (

    config_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    academic_year_grade_id UUID NOT NULL
        REFERENCES academic_year_grades(academic_year_grade_id)
        ON DELETE CASCADE,

    assessment_required BOOLEAN
        NOT NULL DEFAULT FALSE,

    assessment_mode assessment_mode,

    result_type assessment_result_type
        NOT NULL DEFAULT 'marks',

    maximum_marks NUMERIC(5,2),

    pass_marks NUMERIC(5,2),

    is_active BOOLEAN
        NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(academic_year_grade_id),

    CHECK (
    assessment_required = FALSE
    OR assessment_mode IS NOT NULL
    ),

    CHECK (
        maximum_marks IS NULL
        OR maximum_marks >= 0
    ),

    CHECK (
        pass_marks IS NULL
        OR pass_marks >= 0
    ),

    CHECK (
        pass_marks IS NULL
        OR maximum_marks IS NOT NULL
    ),

    CHECK (
        maximum_marks IS NULL
        OR pass_marks IS NULL
        OR pass_marks <= maximum_marks
    )
);


-- ============================================================================
-- APPLICATION ASSESSMENTS
-- ============================================================================

CREATE TABLE application_assessments (

    assessment_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL
        REFERENCES admissions_applications(application_id)
        ON DELETE CASCADE,

    config_id UUID NOT NULL
        REFERENCES assessment_configurations(config_id)
        ON DELETE RESTRICT,

    assessment_date DATE
        NOT NULL,

    maximum_marks NUMERIC(5,2),

    marks_obtained NUMERIC(5,2),

    percentage NUMERIC(5,2),

    result assessment_result,

    remarks TEXT,

    assessed_by UUID
        REFERENCES staff(staff_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(application_id),

    CHECK (
        maximum_marks IS NULL
        OR maximum_marks >= 0
    ),

    CHECK (
        marks_obtained IS NULL
        OR marks_obtained >= 0
    ),

    CHECK (
        marks_obtained IS NULL
        OR maximum_marks IS NOT NULL
    ),

    CHECK (
        maximum_marks IS NULL
        OR marks_obtained IS NULL
        OR marks_obtained <= maximum_marks
    ),

    CHECK (
        percentage IS NULL
        OR (percentage >= 0 AND percentage <= 100)
    ),

    CHECK (
        percentage IS NULL
        OR marks_obtained IS NOT NULL
    )
);      

-- ============================================================================
-- ADMISSION DECISIONS
-- ============================================================================

CREATE TABLE admission_decisions (

    decision_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL
        REFERENCES admissions_applications(application_id)
        ON DELETE CASCADE,

    decision_status admission_decision_status
        NOT NULL,

    decision_date DATE
        NOT NULL DEFAULT CURRENT_DATE,

    decided_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    reason TEXT,

    remarks TEXT,

    offer_expiry_date DATE,

    waitlist_position INT,

    scholarship_percentage NUMERIC(5,2),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(application_id)
);


-- ============================================================================
-- ADMISSION FEE PAYMENTS
-- ============================================================================

CREATE TABLE admission_fee_payments (

    payment_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL
        REFERENCES admissions_applications(application_id)
        ON DELETE CASCADE,

    payment_status admission_payment_status
        NOT NULL DEFAULT 'pending',

    amount NUMERIC(10,2)
        NOT NULL,

    payment_date DATE,

    transaction_reference VARCHAR(100),

    remarks TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(application_id)
);


-- ============================================================================
-- STUDENTS
-- ============================================================================

CREATE TABLE students (

    student_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    application_id UUID NOT NULL
        REFERENCES admissions_applications(application_id)
        ON DELETE RESTRICT,

    user_id UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    admission_no VARCHAR(30)
        NOT NULL,

    first_name VARCHAR(100)
        NOT NULL,

    last_name VARCHAR(100),

    dob DATE,

    gender gender_type,

    admission_date DATE,

    status enrollment_status
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(org_id, admission_no),

    UNIQUE(application_id)
);


-- ============================================================================
-- STUDENT PARENTS
-- ============================================================================

CREATE TABLE student_parents (

    student_id UUID NOT NULL
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    parent_id UUID NOT NULL
        REFERENCES parents(parent_id)
        ON DELETE CASCADE,

    relationship relationship_type
        NOT NULL,

    is_primary_contact BOOLEAN
        NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    PRIMARY KEY(student_id, parent_id)
);


-- ============================================================================
-- STUDENT ENROLLMENTS
-- ============================================================================

CREATE TABLE student_enrollments (

    enrollment_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    academic_year_grade_id UUID NOT NULL
        REFERENCES academic_year_grades(academic_year_grade_id)
        ON DELETE CASCADE,

    section_id UUID
        REFERENCES sections(section_id)
        ON DELETE SET NULL,

    roll_number VARCHAR(20),

    enrollment_date DATE
        NOT NULL DEFAULT CURRENT_DATE,

    exit_date DATE,

    status enrollment_status
        NOT NULL DEFAULT 'active',

    remarks TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE(student_id, academic_year_grade_id)
    UNIQUE(section_id, roll_number)
);