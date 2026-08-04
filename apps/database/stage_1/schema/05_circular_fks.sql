-- ============================================================================
-- CIRCULAR FOREIGN KEYS
-- ============================================================================

-- Organizations → Users

ALTER TABLE organizations
ADD CONSTRAINT fk_organizations_created_by
FOREIGN KEY (created_by)
REFERENCES users(user_id)
ON DELETE SET NULL;

ALTER TABLE organizations
ADD CONSTRAINT fk_organizations_updated_by
FOREIGN KEY (updated_by)
REFERENCES users(user_id)
ON DELETE SET NULL;