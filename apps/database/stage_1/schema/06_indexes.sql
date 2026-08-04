-- ============================================================================
-- USERS
-- ============================================================================

CREATE INDEX ix_users_org
ON users(org_id);

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE INDEX ix_roles_org
ON roles(org_id);

-- ============================================================================
-- DESIGNATIONS
-- ============================================================================

CREATE INDEX ix_designations_org
ON designations(org_id);


-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

CREATE INDEX ix_departments_org
ON departments(org_id);


-- ============================================================================
-- STAFF
-- ============================================================================

CREATE INDEX ix_staff_org
ON staff(org_id);

CREATE INDEX ix_staff_designation
ON staff(designation_id);

CREATE INDEX ix_staff_department
ON staff(department_id);

CREATE INDEX ix_staff_employee_code
ON staff(employee_code);

-- ============================================================================
-- PARENTS
-- ============================================================================

CREATE INDEX ix_parents_org
ON parents(org_id);

CREATE INDEX ix_parents_phone
ON parents(phone);

CREATE INDEX ix_parents_email
ON parents(email);


-- ============================================================================
-- ACADEMIC YEARS
-- ============================================================================

CREATE INDEX ix_academic_years_org
ON academic_years(org_id);

CREATE INDEX ix_academic_years_status
ON academic_years(status);


-- ============================================================================
-- ADMISSION CONFIGURATIONS
-- ============================================================================

CREATE INDEX ix_admission_configurations_academic_year
ON admission_configurations(academic_year_id);

CREATE INDEX ix_admission_configurations_org
ON admission_configurations(org_id);

-- ============================================================================
-- GRADES
-- ============================================================================

CREATE INDEX ix_grades_org
ON grades(org_id);


-- ============================================================================
-- ACADEMIC YEAR GRADES
-- ============================================================================

CREATE INDEX ix_academic_year_grades_academic_year
ON academic_year_grades(academic_year_id);

CREATE INDEX ix_academic_year_grades_grade
ON academic_year_grades(grade_id);


-- ============================================================================
-- SECTIONS
-- ============================================================================

CREATE INDEX ix_sections_academic_year_grade
ON sections(academic_year_grade_id);

CREATE INDEX ix_sections_class_teacher
ON sections(class_teacher_id);

-- ============================================================================
-- LEADS
-- ============================================================================

CREATE INDEX ix_leads_org
ON leads(org_id);

CREATE INDEX ix_leads_stage
ON leads(stage);

CREATE INDEX ix_leads_lead_number
ON leads(lead_number);

CREATE INDEX ix_leads_academic_year_grade
ON leads(academic_year_grade_id);

CREATE INDEX ix_leads_assigned_counsellor
ON leads(assigned_counsellor_id);


-- ============================================================================
-- LEAD ACTIVITIES
-- ============================================================================

CREATE INDEX ix_lead_activities_lead
ON lead_activities(lead_id);

CREATE INDEX ix_lead_activities_followup
ON lead_activities(next_followup_date);


-- ============================================================================
-- LEAD VISITS
-- ============================================================================

CREATE INDEX ix_lead_visits_lead
ON lead_visits(lead_id);

CREATE INDEX ix_lead_visits_schedule
ON lead_visits(scheduled_at);

CREATE INDEX ix_lead_visits_staff
ON lead_visits(staff_id);

CREATE INDEX ix_lead_visits_status
ON lead_visits(status);


-- ============================================================================
-- ADMISSIONS APPLICATIONS
-- ============================================================================

CREATE INDEX ix_admissions_applications_lead
ON admissions_applications(lead_id);

CREATE INDEX ix_admissions_applications_org
ON admissions_applications(org_id);

CREATE INDEX ix_admissions_applications_academic_year_grade
ON admissions_applications(academic_year_id);

CREATE INDEX ix_admissions_applications_status
ON admissions_applications(status);

CREATE INDEX ix_admissions_applications_number
ON admissions_applications(application_number);


-- ============================================================================
-- ASSESSMENT CONFIGURATIONS
-- ============================================================================

CREATE INDEX ix_assessment_configurations_ayg
ON assessment_configurations(academic_year_grade_id);

-- ============================================================================
-- APPLICATION ASSESSMENTS
-- ============================================================================

CREATE INDEX ix_application_assessments_application
ON application_assessments(application_id);

CREATE INDEX ix_application_assessments_assessed_by
ON application_assessments(assessed_by);

-- ============================================================================
-- ADMISSION DECISIONS
-- ============================================================================

CREATE INDEX ix_admission_decisions_status
ON admission_decisions(decision_status);

CREATE INDEX ix_admission_decisions_decided_by
ON admission_decisions(decided_by);

-- ============================================================================
-- DOCUMENTS TYPES
-- ============================================================================

CREATE INDEX ix_document_types_org
ON document_types(org_id);

-- ============================================================================
-- ADMISSION DOCUMENTS
-- ============================================================================

CREATE INDEX ix_admission_documents_application
ON admission_documents(application_id);

CREATE INDEX ix_admission_documents_document_type
ON admission_documents(document_type_id);

CREATE INDEX ix_admission_documents_status
ON admission_documents(verify_status);

-- ============================================================================
-- STUDENTS
-- ============================================================================

CREATE INDEX ix_students_org
ON students(org_id);

CREATE INDEX ix_students_user
ON students(user_id);

CREATE INDEX ix_students_application
ON students(application_id);

CREATE INDEX ix_students_admission_number
ON students(admission_no);


-- ============================================================================
-- STUDENT PARENTS
-- ============================================================================

CREATE INDEX ix_student_parents_parent
ON student_parents(parent_id);


-- ============================================================================
-- STUDENT ENROLLMENTS
-- ============================================================================

CREATE INDEX ix_student_enrollments_student
ON student_enrollments(student_id);

CREATE INDEX ix_student_enrollments_ayg
ON student_enrollments(academic_year_grade_id);

CREATE INDEX ix_student_enrollments_section
ON student_enrollments(section_id);

CREATE INDEX ix_student_enrollments_status
ON student_enrollments(status);