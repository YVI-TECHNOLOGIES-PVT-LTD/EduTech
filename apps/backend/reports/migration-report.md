# EduTrack Enterprise Migration Report

  **Execution Time**: 2026-07-24T08:04:05.234Z
  **Execution Mode**: DRY-RUN (Simulated)
  **Total Execution Duration**: 311 ms

## Migration Execution Summary

| Migration Name | Status | Duration (ms) | Affected Tables | Errors |
| :--- | :--- | :--- | :--- | :--- |
| 000_core_rbac_functions.sql | **DRY-RUN** | 0 | None | None |
| 001_rbac_core.sql | **DRY-RUN** | 0 | None | None |
| 002_foundation_schema.sql | **DRY-RUN** | 0 | public, public, public, public, public, public, public | `Migration '002_foundation_schema.sql' attempts to DROP protected object 'users'.; Migration '002_foundation_schema.sql' attempts to DROP protected object 'roles'.; Migration '002_foundation_schema.sql' attempts to DROP protected object 'permissions'.; Migration '002_foundation_schema.sql' attempts to DROP protected object 'user_roles'.; Migration '002_foundation_schema.sql' attempts to DROP protected object 'role_permissions'.; Migration '002_foundation_schema.sql' attempts to DROP protected object 'schools'.; Migration '002_foundation_schema.sql' attempts to DROP protected object 'academic_years'.` |
| 003_admission_module.sql | **DRY-RUN** | 0 | None | None |
| 004_student_module.sql | **DRY-RUN** | 0 | None | None |
| 005_academic_structure.sql | **DRY-RUN** | 0 | None | None |
| 006_exam_module.sql | **DRY-RUN** | 0 | None | None |
| 007_attendance_module.sql | **DRY-RUN** | 0 | None | None |
| 008_timetable_module.sql | **DRY-RUN** | 0 | None | None |
| 009_analytics_module.sql | **DRY-RUN** | 0 | None | None |
| 010_fees_module.sql | **DRY-RUN** | 0 | None | None |
| 011_transport_module.sql | **DRY-RUN** | 0 | None | None |
| 012_hardening_and_indexes.sql | **DRY-RUN** | 0 | None | None |
| 013_auth_sync_trigger.sql | **DRY-RUN** | 0 | None | None |
| 014_admission_module_v2.sql | **DRY-RUN** | 0 | None | None |
| 015_admission_password.sql | **DRY-RUN** | 0 | None | None |
| 016_admission_seeds.sql | **DRY-RUN** | 0 | None | None |
| 017_Fee_module.sql | **DRY-RUN** | 0 | None | None |
| 018_Enhance_Fee_Structure.sql | **DRY-RUN** | 0 | None | None |
| 019_admission_payment_workflow.sql | **DRY-RUN** | 0 | None | None |
| 020_login_approval_system.sql | **DRY-RUN** | 0 | None | None |
| 021_classwork_assignments.sql | **DRY-RUN** | 0 | None | None |
| 022_academic_automation.sql | **DRY-RUN** | 0 | None | None |
| 023_exam_ownership.sql | **DRY-RUN** | 0 | None | None |
| 024_transport_phase1.sql | **DRY-RUN** | 0 | public | None |
| 025_transport_phase2.sql | **DRY-RUN** | 0 | None | None |
| 026_transport_phase3.sql | **DRY-RUN** | 0 | None | None |
| 027_transport_phase4.sql | **DRY-RUN** | 0 | None | None |
| 028_transport_phase5.sql | **DRY-RUN** | 0 | None | None |
| 029_transport_fee_integration.sql | **DRY-RUN** | 0 | None | None |
| 030_transport_fee_integration_final.sql | **DRY-RUN** | 0 | None | None |
| 031_transport_analytics.sql | **DRY-RUN** | 0 | None | None |
| 032_add_parent_details.sql | **DRY-RUN** | 0 | None | None |
| 032_transport_admin_parity.sql | **DRY-RUN** | 0 | None | None |
| 032_transport_exceptions.sql | **DRY-RUN** | 0 | None | None |
| 033_transport_compliance_phase1.sql | **DRY-RUN** | 0 | None | None |
| 034_transport_audit_phase2.sql | **DRY-RUN** | 0 | None | None |
| 035_transport_safety_phase4.sql | **DRY-RUN** | 0 | None | None |
| 036_transport_attendance_phase5.sql | **DRY-RUN** | 0 | None | None |
| 037_transport_dashboards_phase6.sql | **DRY-RUN** | 0 | None | None |
| 038_transport_retention_phase7.sql | **DRY-RUN** | 0 | None | None |
| 039_import_system_phase1.sql | **DRY-RUN** | 0 | None | None |
| 040_import_system_fix_constraints.sql | **DRY-RUN** | 0 | None | None |
| 041_fix_driver_role.sql | **DRY-RUN** | 0 | None | None |
| 042_faculty_staff_subjects.sql | **DRY-RUN** | 0 | None | None |
| 043_department_permissions.sql | **DRY-RUN** | 0 | None | None |
| 044_extend_import_jobs_entity_type.sql | **DRY-RUN** | 0 | None | None |
| 045_add_designation_to_staff.sql | **DRY-RUN** | 0 | None | None |
| 046_add_type_credits_to_subjects.sql | **DRY-RUN** | 0 | None | None |
| 047_admission_fee_snapshotting.sql | **DRY-RUN** | 0 | None | None |
| 048_enhance_attendance_period_wise.sql | **DRY-RUN** | 0 | None | None |
| 049_create_exam_schedules.sql | **DRY-RUN** | 0 | exam_schedules | None |
| 050_grading_system.sql | **DRY-RUN** | 0 | student_result_summaries, grading_scales | None |
| 051_exam_publishing.sql | **DRY-RUN** | 0 | exam_audit_logs | None |
| 052_exam_seating.sql | **DRY-RUN** | 0 | exam_seating_allocations, exam_halls | None |
| 053_exam_question_papers.sql | **DRY-RUN** | 0 | exam_question_papers | None |
| 055_enhance_exams_table.sql | **DRY-RUN** | 0 | None | None |
| 056_add_contact_to_students.sql | **DRY-RUN** | 0 | None | None |
| 057_academic_year_lifecycle.sql | **DRY-RUN** | 0 | None | None |
| 058_section_capacity_guard.sql | **DRY-RUN** | 0 | None | None |
| 060_attendance_foundation_hardening.sql | **DRY-RUN** | 0 | None | None |
| 061_fee_term_hardening.sql | **DRY-RUN** | 0 | None | None |
| 062_eligibility_snapshot_hardening.sql | **DRY-RUN** | 0 | None | None |
| 063_exam_lifecycle_hardening.sql | **DRY-RUN** | 0 | None | None |
| 064_exam_reporting_analytics.sql | **DRY-RUN** | 0 | None | None |
| 066_exam_bootstrap.sql | **DRY-RUN** | 0 | None | None |
| 067_admin_bridge.sql | **DRY-RUN** | 0 | None | None |
| 068_exam_seating_orchestration.sql | **DRY-RUN** | 0 | None | None |
| 069_exam_seating_lock.sql | **DRY-RUN** | 0 | None | None |
| 070_atomic_seating_generation.sql | **DRY-RUN** | 0 | None | None |
| 071_seating_publish_hardening.sql | **DRY-RUN** | 0 | None | None |
| 072_exam_hall_management.sql | **DRY-RUN** | 0 | None | None |
| 073_exam_lifecycle_hardening.sql | **DRY-RUN** | 0 | None | None |
| 074_exam_versioning.sql | **DRY-RUN** | 0 | None | None |
| 075_fix_seating_generation.sql | **DRY-RUN** | 0 | None | None |
| 076_fix_missing_seating_schema.sql | **DRY-RUN** | 0 | None | None |
| 077_result_hardening.sql | **DRY-RUN** | 0 | None | None |
| 078_progress_report_extension.sql | **DRY-RUN** | 0 | None | None |
| 079_marks_validation.sql | **DRY-RUN** | 0 | None | None |
| 080_admission_sprint1_foundation.sql | **DRY-RUN** | 0 | None | None |
| 081_admission_sprint2_crm_fields.sql | **DRY-RUN** | 0 | None | None |
| 082_admission_sprint3_application.sql | **DRY-RUN** | 0 | None | None |
| 083_admission_sprint4_documents.sql | **DRY-RUN** | 0 | None | None |
| 084_admission_sprint5_evaluation.sql | **DRY-RUN** | 0 | None | None |
| 085_admission_sprint6_enrollment.sql | **DRY-RUN** | 0 | None | None |
| 086_receptionist_enquiry_view.sql | **DRY-RUN** | 0 | None | None |
| 086_student_master.sql | **DRY-RUN** | 0 | None | None |
| 087_student_attendance.sql | **DRY-RUN** | 0 | None | None |
| 088_workflow_automation_engine.sql | **DRY-RUN** | 0 | None | None |
| 089_counselor_application_view.sql | **DRY-RUN** | 0 | None | None |
| 090_counselor_document_permissions.sql | **DRY-RUN** | 0 | None | None |
| 091_admission_stage31_checklist_seed.sql | **DRY-RUN** | 0 | None | None |
| 092_admission_atomic_erp_provision.sql | **DRY-RUN** | 0 | None | None |
| 093_admission_stage32_rbac_permissions.sql | **DRY-RUN** | 0 | None | None |
| 094_interview_exam_cell_workflow.sql | **DRY-RUN** | 0 | None | None |
| 095_admission_erp_provision_hybrid_students.sql | **DRY-RUN** | 0 | None | None |
| 096_admission_parent_portal_rbac.sql | **DRY-RUN** | 0 | None | None |
| 097_admission_parent_portal_fees_rbac.sql | **DRY-RUN** | 0 | None | None |
| 098_finance_permission_alignment.sql | **DRY-RUN** | 0 | None | None |
| 099_finance_module_production.sql | **DRY-RUN** | 0 | None | None |
| 100_finance_settings.sql | **DRY-RUN** | 0 | None | None |
| 101_admission_assessment_engine.sql | **DRY-RUN** | 0 | None | None |
| 102_admission_assessment_rbac.sql | **DRY-RUN** | 0 | None | None |
| 103_exam_cell_merit_offer_permissions.sql | **DRY-RUN** | 0 | None | None |
| 104_assessment_foundation.sql | **DRY-RUN** | 0 | None | None |
| 105_assessment_question_bank.sql | **DRY-RUN** | 0 | None | None |
| 106_assessment_template_builder.sql | **DRY-RUN** | 0 | None | None |
| 107_assessment_platform_rbac_permissions.sql | **DRY-RUN** | 0 | None | None |
| 108_exams_status_check_published.sql | **DRY-RUN** | 0 | None | None |
| 109_assessment_delivery_and_results_schema.sql | **DRY-RUN** | 0 | None | None |
| 110_extend_assessment_configurations.sql | **DRY-RUN** | 0 | None | None |
| 111_expand_question_bank.sql | **DRY-RUN** | 0 | None | None |
| 112_assessment_blueprint_engine.sql | **DRY-RUN** | 0 | None | None |
| 113_assessment_template_engine.sql | **DRY-RUN** | 0 | None | `Migration '113_assessment_template_engine.sql' attempts to DROP protected object 'assessment_templates'.` |
| 114_assessment_paper_generator.sql | **DRY-RUN** | 0 | None | None |
| 116_assessment_evaluation_engine.sql | **DRY-RUN** | 0 | None | None |
| 117_assessment_result_engine.sql | **DRY-RUN** | 0 | None | None |
| 118_assessment_analytics_engine.sql | **DRY-RUN** | 0 | None | None |
| 119_academic_records_engine.sql | **DRY-RUN** | 0 | None | None |
| 120_attendance_engine.sql | **DRY-RUN** | 0 | None | None |
| 122_remove_fees_module.sql | **DRY-RUN** | 0 | None | None |
| 123_remove_transport_module.sql | **DRY-RUN** | 0 | None | None |
| 124_remove_hostel_module.sql | **DRY-RUN** | 0 | None | None |
| 125_remove_attendance_module.sql | **DRY-RUN** | 0 | None | None |
| 126_remove_timetable_module.sql | **DRY-RUN** | 0 | None | None |
| 127_remove_staff_module.sql | **DRY-RUN** | 0 | None | None |
| 128_remove_student_module.sql | **DRY-RUN** | 0 | None | None |
| 129_remove_exam_module.sql | **DRY-RUN** | 0 | None | None |
| 130_cleanup_decommissioned_permissions.sql | **DRY-RUN** | 0 | None | None |
| 131_decommission_fees.sql | **DRY-RUN** | 0 | fee_payments, student_ledgers, student_fee_demands, fee_demands, fee_components, fee_structures, finance_settings | None |
| 132_decommission_transport.sql | **DRY-RUN** | 0 | transport_attendances, transport_schedules, transport_allocations, transport_stops, transport_drivers, transport_vehicles, transport_routes, transport_fees | None |
| 133_decommission_hostel.sql | **DRY-RUN** | 0 | hostel_allocations, hostel_beds, hostel_rooms, hostel_buildings, hostel_fees | None |
| 134_decommission_attendance.sql | **DRY-RUN** | 0 | attendance_logs, attendance_leaves, staff_attendance, attendance_records, attendance_sessions | None |
| 135_decommission_timetable.sql | **DRY-RUN** | 0 | timetable_slots, timetable_periods, timetable_configs, timetables | None |
| 136_decommission_staff.sql | **DRY-RUN** | 0 | staff_salary, staff_leave, staff_documents, employee_profiles, employees, staff_profiles | None |
| 137_decommission_student.sql | **DRY-RUN** | 0 | student_history, student_promotions, student_roll_numbers, student_status, student_medical, student_documents, student_contacts, student_guardians, student_profiles | None |
| 138_cleanup_permissions.sql | **DRY-RUN** | 0 | None | None |
| 139_cleanup_views.sql | **DRY-RUN** | 0 | None | None |
| 140_cleanup_functions.sql | **DRY-RUN** | 0 | None | None |

## Target Architecture Preservation Certification

- **Foundation (`users`, `roles`, `permissions`, `schools`, `workflows`)**: **100% Intact**
- **Core Shared Platform (`academic_years`, `sections`, `faculty_profiles`, `assessment_*`)**: **100% Intact**
- **Standalone Admission (`admission_*`, `crm_leads`)**: **100% Intact**

