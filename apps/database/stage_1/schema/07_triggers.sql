-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TRIGGER trg_organizations_updated
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE TRIGGER trg_roles_updated
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- DESIGNATIONS
-- ============================================================================

CREATE TRIGGER trg_designations_updated
BEFORE UPDATE ON designations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

CREATE TRIGGER trg_departments_updated
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- STAFF
-- ============================================================================

CREATE TRIGGER trg_staff_updated
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- PARENTS
-- ============================================================================

CREATE TRIGGER trg_parents_updated
BEFORE UPDATE ON parents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ACADEMIC YEARS
-- ============================================================================

CREATE TRIGGER trg_academic_years_updated
BEFORE UPDATE ON academic_years
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ADMISSION CONFIGURATIONS
-- ============================================================================

CREATE TRIGGER trg_admission_configurations_updated
BEFORE UPDATE ON admission_configurations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- GRADES
-- ============================================================================

CREATE TRIGGER trg_grades_updated
BEFORE UPDATE ON grades
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ACADEMIC YEAR GRADES
-- ============================================================================

CREATE TRIGGER trg_academic_year_grades_updated
BEFORE UPDATE ON academic_year_grades
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- SECTIONS
-- ============================================================================

CREATE TRIGGER trg_sections_updated
BEFORE UPDATE ON sections
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- LEADS
-- ============================================================================

CREATE TRIGGER trg_leads_updated
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- LEAD ACTIVITIES
-- ============================================================================

CREATE TRIGGER trg_lead_activities_updated
BEFORE UPDATE ON lead_activities
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- LEAD VISITS
-- ============================================================================

CREATE TRIGGER trg_lead_visits_updated
BEFORE UPDATE ON lead_visits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- ADMISSIONS APPLICATIONS
-- ============================================================================

CREATE TRIGGER trg_admissions_applications_updated
BEFORE UPDATE ON admissions_applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- DOCUMENT TYPES
-- ============================================================================

CREATE TRIGGER trg_document_types_updated
BEFORE UPDATE ON document_types
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ADMISSION DOCUMENTS
-- ============================================================================

CREATE TRIGGER trg_admission_documents_updated
BEFORE UPDATE ON admission_documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ASSESSMENT CONFIGURATIONS
-- ============================================================================

CREATE TRIGGER trg_assessment_configurations_updated
BEFORE UPDATE ON assessment_configurations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- APPLICATION ASSESSMENTS
-- ============================================================================

CREATE TRIGGER trg_application_assessments_updated
BEFORE UPDATE ON application_assessments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


Create
-- ============================================================================
-- ADMISSION DECISIONS
-- ============================================================================

CREATE TRIGGER trg_admission_decisions_updated
BEFORE UPDATE ON admission_decisions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ADMISSION FEE PAYMENTS
-- ============================================================================

CREATE TRIGGER trg_admission_fee_payments_updated
BEFORE UPDATE ON admission_fee_payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- STUDENTS
-- ============================================================================

CREATE TRIGGER trg_students_updated
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- STUDENT PARENTS
-- ============================================================================

CREATE TRIGGER trg_student_parents_updated
BEFORE UPDATE ON student_parents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- STUDENT ENROLLMENTS
-- ============================================================================

CREATE TRIGGER trg_student_enrollments_updated
BEFORE UPDATE ON student_enrollments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();