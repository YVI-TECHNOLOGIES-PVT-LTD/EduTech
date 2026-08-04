CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);

CREATE TYPE gender_type AS ENUM (
    'male',
    'female',
    'other',
    'undisclosed'
);

CREATE TYPE subscription_tier AS ENUM (
    'starter',
    'standard',
    'enterprise'
);

CREATE TYPE academic_year_status AS ENUM (
    'planning',
    'open',
    'admissions_open',
    'teaching',
    'examinations',
    'closed',
    'archived'
);

CREATE TYPE lead_stage AS ENUM (
    'enquiry_received',
    'qualified',
    'counselling_scheduled',
    'campus_visit',
    'application_submitted',
    'document_verification',
    'assessment',
    'admission_approved',
    'waitlisted',
    'rejected',
    'fee_payment_pending',
    'enrolled'
);

CREATE TYPE lead_source AS ENUM (
    'website',
    'walk_in',
    'referral',
    'social_media',
    'chatbot',
    'qr_code',
    'education_fair',
    'phone_call',
    'email',
    'other'
);

CREATE TYPE lead_priority AS ENUM (
    'hot',
    'warm',
    'cold'
);

CREATE TYPE lead_activity_type AS ENUM (
    'phone_call',
    'email',
    'whatsapp',
    'chatbot',
    'follow_up',
    'counselling',
    'application_submitted',
    'note'
);

CREATE TYPE activity_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
);

CREATE TYPE visit_type AS ENUM (
    'campus',
    'virtual'
);

CREATE TYPE visit_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE relationship_type AS ENUM (
    'father',
    'mother',
    'guardian',
    'grandparent',
    'other'
);

CREATE TYPE document_verify_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'resubmission_requested'
);

CREATE TYPE assessment_mode AS ENUM (
    'written',
    'online',
    'oral',
    'observation',
    'practical'
);

CREATE TYPE assessment_result_type AS ENUM (
    'marks',
    'pass_fail',
    'recommendation'
);

CREATE TYPE assessment_result AS ENUM (
    'pass',
    'fail',
    'recommended',
    'not_recommended'
);

CREATE TYPE admission_decision_status AS ENUM (
    'approved',
    'waitlisted',
    'rejected',
    'withdrawn'
);

CREATE TYPE admission_payment_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'failed',
    'waived',
    'refunded'
);

CREATE TYPE enrollment_status AS ENUM (
    'active',
    'transferred_out',
    'graduated',
    'withdrawn'
);


-- ============================================================================
-- ACADEMICS
-- ============================================================================

CREATE TYPE assignment_type AS ENUM (
    'written_response',
    'video_presentation',
    'audio_submission',
    'quiz',
    'draw_and_answer',
    'match_pairs',
    'fill_in_blanks',
    'reading_assessment',
    'public_speaking',
    'code_simulator'
);

CREATE TYPE submission_status AS ENUM (
    'not_submitted',
    'submitted',
    'under_review',
    'evaluated',
    'returned'
);


CREATE TYPE assessment_kind AS ENUM (
    'formative',
    'summative',
    'diagnostic',
    'competency_based',
    'skill_based',
    'project_based',
    'viva',
    'portfolio'
);

CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'half_day',
    'on_leave'
);

-- ============================================================================
-- FINANCE
-- ============================================================================

CREATE TYPE payment_mode AS ENUM (
    'upi',
    'credit_card',
    'debit_card',
    'net_banking',
    'enach',
    'qr',
    'emi',
    'cash',
    'cheque'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'overdue',
    'failed',
    'refunded'
);

CREATE TYPE loan_status AS ENUM (
    'applied',
    'under_review',
    'approved',
    'disbursed',
    'rejected',
    'closed'
);

-- ============================================================================
-- SUPPORT
-- ============================================================================

CREATE TYPE concern_status AS ENUM (
    'open',
    'in_progress',
    'escalated',
    'resolved',
    'closed'
);

-- ============================================================================
-- COMPLIANCE
-- ============================================================================

CREATE TYPE compliance_doc_status AS ENUM (
    'valid',
    'expiring_soon',
    'expired',
    'renewal_in_progress'
);

CREATE TYPE audit_type AS ENUM (
    'scheduled',
    'unannounced'
);

-- ============================================================================
-- AI
-- ============================================================================

CREATE TYPE prediction_type AS ENUM (
    'dropout_risk',
    'fee_default_risk',
    'admission_conversion',
    'teacher_attrition_risk',
    'learning_gap'
);


CREATE TYPE application_status AS ENUM (

    'submitted',

    'documents_pending',

    'assessment_pending',

    'under_review',

    'approved',

    'waitlisted',

    'rejected',

    'withdrawn'
);

CREATE TYPE scholarship_type AS ENUM (
    'merit',
    'sports',
    'need_based',
    'government',
    'management'
);