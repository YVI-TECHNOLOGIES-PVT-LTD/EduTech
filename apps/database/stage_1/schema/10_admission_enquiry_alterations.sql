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