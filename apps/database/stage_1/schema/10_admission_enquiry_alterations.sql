-- ============================================================================
-- ADMISSION ENQUIRY FORM CHANGES
-- ============================================================================

-- 1. Consent
ALTER TABLE leads
ADD COLUMN contact_consent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN contact_consent_at TIMESTAMPTZ;


-- 2. Query Types
CREATE TABLE lead_query_types (

    query_type_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(org_id)
        ON DELETE CASCADE,

    query_type_name VARCHAR(100) NOT NULL,

    display_order INTEGER NOT NULL DEFAULT 0,

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

    UNIQUE(org_id, query_type_name)
);


-- 3. Lead ↔ Query Type mapping
CREATE TABLE lead_query_type_mappings (

    lead_id UUID NOT NULL
        REFERENCES leads(lead_id)
        ON DELETE CASCADE,

    query_type_id UUID NOT NULL
        REFERENCES lead_query_types(query_type_id)
        ON DELETE RESTRICT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    PRIMARY KEY (lead_id, query_type_id)
);


-- 4. Index
CREATE INDEX idx_lead_query_type_mappings_query_type
ON lead_query_type_mappings(query_type_id);


-- 5. Seed default query types for every organization
INSERT INTO lead_query_types (
    org_id,
    query_type_name,
    display_order
)
SELECT
    o.org_id,
    v.query_type_name,
    v.display_order
FROM organizations o
CROSS JOIN (
    VALUES
        ('Admission Availability', 1),
        ('Admission Process', 2),
        ('Fees', 3),
        ('Curriculum', 4),
        ('Documents Required', 5),
        ('Campus Visit', 6)
) AS v(query_type_name, display_order)
ON CONFLICT (org_id, query_type_name)
DO NOTHING;

-- ============================================================================
-- LEAD ↔ PARENT RELATIONSHIP
-- ============================================================================

ALTER TABLE leads
ADD COLUMN parent_id UUID
    REFERENCES parents(parent_id)
    ON DELETE SET NULL;

CREATE INDEX idx_leads_parent_id
ON leads(parent_id);

ALTER TABLE admission_documents
ADD COLUMN original_file_name VARCHAR(255),
ADD COLUMN mime_type VARCHAR(100),
ADD COLUMN file_size BIGINT;

ALTER TABLE admission_documents
RENAME COLUMN file_path TO storage_path;


UPDATE document_types

SET

document_name = 'Student Photo',
description = 'Recent passport size photograph of the student',
updated_at = now()

WHERE document_name = 'Passport Size Photo';





ALTER TABLE public.students

ADD COLUMN nationality VARCHAR(100);





ALTER TABLE public.admissions_applications

ADD COLUMN nationality VARCHAR(100),

ADD COLUMN previous_school_name VARCHAR(200),

ADD COLUMN previous_school_address TEXT,

ADD COLUMN previous_school_board VARCHAR(100),

ADD COLUMN previous_grade VARCHAR(50),

ADD COLUMN previous_school_year VARCHAR(20);

UPDATE document_types
SET
    document_name = 'Student Aadhaar Card',
    description = 'Government identity proof of the student',
    updated_at = now()
WHERE document_name = 'Aadhaar Card';

ALTER TABLE admissions_applications
DROP CONSTRAINT admissions_applications_lead_id_key;

ALTER TABLE admissions_applications
ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE admissions_applications
DROP CONSTRAINT admissions_applications_lead_id_fkey;

ALTER TABLE admissions_applications
ADD CONSTRAINT admissions_applications_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES leads(lead_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE admissions_applications
ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE admission_configurations
ADD COLUMN processing_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.admission_fee_payments
ADD COLUMN payment_mode public.admission_payment_mode;

ALTER TABLE admission_fee_payments
ADD COLUMN card_name VARCHAR(100) NULL,
ADD COLUMN card_last_four CHAR(4) NULL;

CREATE UNIQUE INDEX ux_admissions_applications_lead_id
ON public.admissions_applications (lead_id)
WHERE lead_id IS NOT NULL;

ALTER TABLE public.users
ADD COLUMN country_id uuid;

ALTER TABLE public.users
ADD CONSTRAINT users_country_id_fkey
FOREIGN KEY (country_id)
REFERENCES public.countries (country_id)
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS ix_users_country
ON public.users (country_id);

ALTER TABLE public.users
ALTER COLUMN country_id SET NOT NULL;

ALTER TABLE users
ADD COLUMN avatar_url VARCHAR(500) NULL;

ALTER TYPE lead_priority RENAME VALUE 'hot' TO 'high';
ALTER TYPE lead_priority RENAME VALUE 'warm' TO 'medium';
ALTER TYPE lead_priority RENAME VALUE 'cold' TO 'low';