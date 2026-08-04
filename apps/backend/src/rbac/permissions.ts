export const PERMISSIONS = {
    // ADMISSION
    ADMISSION_CREATE: 'admission.create',
    ADMISSION_VIEW_SELF: 'admission.view_own',
    ADMISSION_VIEW_ALL: 'admission.view_all',
    ADMISSION_REVIEW: 'admission.review',
    ADMISSION_RECOMMEND: 'admission.recommend',
    ADMISSION_APPROVE: 'admission.approve',
    ADMISSION_REJECT: 'admission.reject',
    ADMISSION_ENROL: 'admission.enrol',
    ADMISSION_ENQUIRY_CREATE: 'admission.enquiry.create',
    ADMISSION_ENQUIRY_VIEW: 'admission.enquiry.view',
    ADMISSION_LEADS_MANAGE: 'admission.leads.manage',
    ADMISSION_VISITORS_MANAGE: 'admission.visitors.manage',
    ADMISSION_STATUS_HISTORY_VIEW: 'admission.status_history.view',
    APPLICATION_CREATE: 'admission.application.create',
    APPLICATION_UPDATE: 'admission.application.update',
    APPLICATION_SUBMIT: 'admission.application.submit',
    APPLICATION_VIEW: 'admission.application.view',
    APPLICATION_DELETE: 'admission.application.delete',
    FEATURE_FLAGS_MANAGE: 'feature_flags.manage',

    // STUDENT
    STUDENT_CREATE: 'STUDENT_CREATE',
    STUDENT_VIEW: 'STUDENT_VIEW',
    STUDENT_VIEW_SELF: 'STUDENT_VIEW_SELF',
    STUDENT_UPDATE: 'STUDENT_UPDATE',
    STUDENT_ASSIGN_SECTION: 'STUDENT_ASSIGN_SECTION',

    // ACADEMIC
    ACADEMIC_SETUP: 'ACADEMIC_SETUP',
    ACADEMIC_VIEW: 'ACADEMIC_VIEW',
    ACADEMIC_ASSIGN_FACULTY: 'ACADEMIC_ASSIGN_FACULTY',
    CLASS_VIEW: 'CLASS_VIEW',
    CLASS_CREATE: 'CLASS_CREATE',
    SECTION_VIEW: 'SECTION_VIEW',
    SECTION_CREATE: 'SECTION_CREATE',

    // TRANSPORT
    TRANSPORT_SETUP: 'TRANSPORT_SETUP',
    TRANSPORT_VIEW: 'TRANSPORT_VIEW',
    TRANSPORT_VIEW_SELF: 'TRANSPORT_VIEW_SELF',
    TRANSPORT_ASSIGN: 'TRANSPORT_ASSIGN',

    // TRANSPORT OPS (Phase T3)
    TRIP_EXECUTE: 'TRIP_EXECUTE',
    TRIP_VIEW_SELF: 'TRIP_VIEW_SELF',
    TRIP_MONITOR: 'TRIP_MONITOR',

    // FEES
    FEES_VIEW: 'fees.view',
    FEES_SETUP: 'fees.structure.manage',
    FEES_ASSIGN: 'fees.demand.generate',
    FEES_DEMAND_GENERATE: 'fees.demand.generate',
    PAYMENT_RECORD: 'fees.payment.collect',
    FEES_STRUCTURE_VIEW: 'fees.structure.view',
    FEES_DEMAND_VIEW: 'fees.demand.view',
    FEES_PAYMENT_VIEW: 'fees.payment.view',
    FEES_RECEIPT_GENERATE: 'fees.receipt.generate',
    FEES_WAIVER_APPROVE: 'fees.waiver.approve',
    FEES_REFUND_PROCESS: 'fees.refund.process',
    ADMISSION_FEES_INITIALIZE: 'admission.fees.initialize',
    DASHBOARD_VIEW_PARENT: 'DASHBOARD_VIEW_PARENT',

    // ATTENDANCE
    ATTENDANCE_MARK: 'ATTENDANCE_MARK',
    ATTENDANCE_VIEW: 'ATTENDANCE_VIEW',
    ATTENDANCE_VIEW_SELF: 'ATTENDANCE_VIEW_SELF',

    // DASHBOARD VIEWS
    DASHBOARD_VIEW_ADMIN: 'DASHBOARD_VIEW_ADMIN',
    DASHBOARD_VIEW_FACULTY: 'DASHBOARD_VIEW_FACULTY',

    // UNIFIED MODULE DASHBOARD PERMISSIONS
    ADMIN_DASHBOARD_VIEW: 'admin.dashboard.view',
    ASSESSMENT_DASHBOARD_VIEW: 'assessment.dashboard.view',
    EXAM_DASHBOARD_VIEW: 'exam.dashboard.view',
    FEES_DASHBOARD_VIEW: 'fees.dashboard.view',
    ADMISSION_DASHBOARD_VIEW: 'admission.dashboard.view',
    TRANSPORT_DASHBOARD_VIEW: 'transport.dashboard.view',
    FACULTY_DASHBOARD_VIEW: 'faculty.dashboard.view',
    STUDENT_DASHBOARD_VIEW: 'student.dashboard.view',
    PARENT_DASHBOARD_VIEW: 'parent.dashboard.view',
    DRIVER_DASHBOARD_VIEW: 'driver.dashboard.view',

    // EXAMS
    SUBJECT_VIEW: 'SUBJECT_VIEW',
    SUBJECT_CREATE: 'SUBJECT_CREATE',
    EXAM_VIEW: 'EXAM_VIEW',
    EXAM_CREATE: 'EXAM_CREATE',
    MARKS_VIEW: 'MARKS_VIEW',
    MARKS_ENTER: 'MARKS_ENTER',

    // TIMETABLE
    TIMETABLE_VIEW: 'TIMETABLE_VIEW',
    TIMETABLE_CREATE: 'TIMETABLE_CREATE',

    // FACULTY & STAFF MANAGEMENT
    FACULTY_PROFILE_MANAGE: 'FACULTY_PROFILE_MANAGE',
    STAFF_PROFILE_MANAGE: 'STAFF_PROFILE_MANAGE',
    SUBJECT_ASSIGN_FACULTY: 'SUBJECT_ASSIGN_FACULTY',
    SUBJECT_UPDATE_OWN: 'SUBJECT_UPDATE_OWN',

    // ASSESSMENT PLATFORM GRANULAR NAMESPACES
    ASSESSMENT_CONFIG_VIEW: 'assessment.config.view',
    ASSESSMENT_CONFIG_MANAGE: 'assessment.config.manage',
    ASSESSMENT_WORKFLOW_MANAGE: 'assessment.workflow.manage',
    ASSESSMENT_QUESTION_VIEW: 'assessment.question.view',
    ASSESSMENT_QUESTION_MANAGE: 'assessment.question.manage',
    ASSESSMENT_QUESTION_IMPORT: 'assessment.question.import',
    ASSESSMENT_TEMPLATE_VIEW: 'assessment.template.view',
    ASSESSMENT_TEMPLATE_MANAGE: 'assessment.template.manage',
    ASSESSMENT_TEMPLATE_PUBLISH: 'assessment.template.publish',
    
    // Phase 5 Exact Required Permissions
    ASSESSMENT_CONFIGURATION_VIEW: 'assessment.configuration.view',
    ASSESSMENT_CONFIGURATION_MANAGE: 'assessment.configuration.manage',
    ASSESSMENT_WORKFLOW_VIEW: 'assessment.workflow.view',
    ASSESSMENT_WORKFLOW_PUBLISH: 'assessment.workflow.publish',
    ASSESSMENT_WORKFLOW_ARCHIVE: 'assessment.workflow.archive',
    
    ASSESSMENT_FOUNDATION_VIEW: 'assessment.foundation.view',
    ASSESSMENT_FOUNDATION_MANAGE: 'assessment.foundation.manage',
    ASSESSMENT_PAPER_GENERATE: 'assessment.paper.generate',
    ASSESSMENT_PAPER_VIEW: 'assessment.paper.view',
    ASSESSMENT_SCHEDULE_MANAGE: 'assessment.schedule.manage',
    ASSESSMENT_SCHEDULE_VIEW: 'assessment.schedule.view',
    ASSESSMENT_ATTEMPT_WRITE: 'assessment.attempt.write',
    ASSESSMENT_ATTEMPT_VIEW: 'assessment.attempt.view',
    ASSESSMENT_EVALUATION_MANAGE: 'assessment.evaluation.manage',
    ASSESSMENT_RESULT_VIEW: 'assessment.result.view',
    ASSESSMENT_RESULT_PUBLISH: 'assessment.result.publish',
    ASSESSMENT_ANALYTICS_VIEW: 'assessment.analytics.view',
    ASSESSMENT_SETTINGS_VIEW: 'assessment.analytics.view', // Note: mapped to view
    ASSESSMENT_SETTINGS_MANAGE: 'assessment.settings.manage',

    // Phase 6 Question Bank Permissions
    ASSESSMENT_FOLDER_MANAGE: 'assessment.folder.manage',
    ASSESSMENT_ASSET_UPLOAD: 'assessment.asset.upload',
    ASSESSMENT_ASSET_DELETE: 'assessment.asset.delete',
    ASSESSMENT_QUESTION_CREATE: 'assessment.question.create',
    ASSESSMENT_QUESTION_UPDATE: 'assessment.question.update',
    ASSESSMENT_QUESTION_REVIEW: 'assessment.question.review',
    ASSESSMENT_QUESTION_DELETE: 'assessment.question.delete',
};

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
