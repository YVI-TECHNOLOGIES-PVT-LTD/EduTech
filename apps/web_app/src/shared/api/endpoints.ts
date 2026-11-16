export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ORGANIZATION: {
    PROFILE: '/organization/profile',
    UPDATE: '/organization/update',
    SETTINGS: '/organization/settings',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
  },
  HR: {
    DEPARTMENTS: '/hr/departments',
    DESIGNATIONS: '/hr/designations',
    STAFF: '/v1/staff',
    STAFF_COUNSELLORS: '/v1/staff/counsellors',
    STAFF_BY_ID: (id: string) => `/v1/staff/${id}`,
  },
  ACADEMICS: {
    YEARS: '/v1/academic/years',
    GRADES: '/v1/academic/grades',
    SECTIONS: '/v1/academic/sections',
  },
  CRM: {
    LEADS: '/v1/leads',
    LEAD_BY_ID: (id: string) => `/v1/leads/${id}`,
    LEAD_ACTIVITIES: (leadId: string) => `/v1/leads/${leadId}/activities`,
    CAMPUS_VISITS: '/v1/leads/visits',
    QUALIFY: (leadId: string) => `/v1/leads/${leadId}/qualify`,
    CONVERT: (leadId: string) => `/v1/leads/${leadId}/convert`,
  },
  ADMISSIONS: {
    APPLICATIONS: '/v1/applications',
    APPLICATION_BY_ID: (id: string) => `/v1/applications/${id}`,
    DOCUMENTS: (appId: string) => `/v1/applications/${appId}/documents`,
    DOCUMENT_VERIFY: (docId: string) => `/v1/applications/documents/${docId}/verify`,
    DOCUMENT_SIGNED_URL: (docId: string) => `/v1/applications/documents/${docId}/signed-url`,
    DOCUMENT_DELETE: (docId: string) => `/v1/applications/documents/${docId}`,
    DOCUMENT_TYPES: '/v1/applications/document-types',
    PENDING: '/v1/applications/pending',
    DASHBOARD: '/v1/applications/dashboard',
    ASSESSMENT: (appId: string) => `/v1/applications/${appId}/assessment`,
    ASSESSMENT_CONFIGS: '/v1/applications/assessment-configs',
    ASSESSMENT_ANALYTICS: '/v1/applications/assessment-analytics',
    ASSESSMENTS_LIST: '/v1/applications/assessments',
    EXAMINERS: '/v1/applications/examiners',
    DECISION: (appId: string) => `/v1/applications/${appId}/decision`,
    FEES: (appId: string) => `/v1/applications/${appId}/fees`,
    FEE_INFO: (appId: string) => `/v1/applications/${appId}/fee`,
    PAYMENT: (appId: string) => `/v1/applications/${appId}/payment`,
    RECEIPT: (appId: string) => `/v1/applications/${appId}/receipt`,
    FEE_CONFIG: '/v1/applications/fee-config',
  },
  STUDENTS: {
    DIRECTORY: '/v1/students',
    STUDENT_BY_ID: (id: string) => `/v1/students/${id}`,
    APPROVED_APPLICATIONS: '/v1/students/approved-applications',
    CONVERT_APPLICATION: (appId: string) => `/v1/students/convert-application/${appId}`,
    ASSIGN_SECTION: (enrollmentId: string) => `/v1/students/enrollments/${enrollmentId}/section`,
    PARENTS: (studentId: string) => `/v1/students/${studentId}/parents`,
  },
  REPORTS: {
    ADMISSIONS: '/reports/admissions',
    STUDENTS: '/reports/students',
    FINANCIAL: '/reports/financial',
  },
  AUDIT: {
    LOGS: '/audit/logs',
  },
  CHATBOT: {
    CREATE_SESSION: '/v1/chatbot/session',
    SEND_MESSAGE: '/v1/chatbot/message',
    GET_SESSION: (sessionId: string) => `/v1/chatbot/session/${sessionId}`,
    COMPLETE_SESSION: (sessionId: string) => `/v1/chatbot/session/${sessionId}/complete`,
  },

  NOTIFICATIONS: {
    BASE: '/v1/notifications',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/v1/notifications/mark-all-read',
    BY_ID: (id: string) => `/v1/notifications/${id}`,
  },
  PARENT_PORTAL: {
    DASHBOARD_OVERVIEW: '/v1/parent/dashboard/overview',
    CHILDREN: '/v1/parent/children',
    CHILD_BY_ID: (childId: string) => `/v1/parent/children/${childId}`,
    TIMETABLE_TODAY: (childId: string) => `/v1/parent/children/${childId}/timetable/today`,
    TIMETABLE_WEEKLY: (childId: string) => `/v1/parent/children/${childId}/timetable/weekly`,
    SUBJECTS: (childId: string) => `/v1/parent/children/${childId}/subjects`,
    CURRICULUM: (childId: string) => `/v1/parent/children/${childId}/curriculum`,
    ACADEMIC_PROGRESS: (childId: string) => `/v1/parent/children/${childId}/academic-progress`,
    RESOURCES: (childId: string) => `/v1/parent/children/${childId}/resources`,
    RESOURCE_PREVIEW: (childId: string, resourceId: string) =>
      `/v1/parent/children/${childId}/resources/${resourceId}/preview`,
    RESOURCE_DOWNLOAD: (childId: string, resourceId: string) =>
      `/v1/parent/children/${childId}/resources/${resourceId}/download`,
    CALENDAR: (childId: string) => `/v1/parent/children/${childId}/calendar`,
  },
  CLASSROOM: {
    TEACHER_OVERVIEW: '/v1/classroom/teacher/overview',
    TEACHER_CLASSES: '/v1/classroom/teacher/classes',
    TEACHER_SESSIONS: '/v1/classroom/teacher/sessions',
    TEACHER_SESSION_BY_ID: (sessionId: string) => `/v1/classroom/teacher/sessions/${sessionId}`,
    TEACHER_SESSION_START: (sessionId: string) =>
      `/v1/classroom/teacher/sessions/${sessionId}/start`,
    TEACHER_SESSION_COMPLETE: (sessionId: string) =>
      `/v1/classroom/teacher/sessions/${sessionId}/complete`,
    TEACHER_SESSION_CANCEL: (sessionId: string) =>
      `/v1/classroom/teacher/sessions/${sessionId}/cancel`,
    TEACHER_SESSION_NOT_CONDUCTED: (sessionId: string) =>
      `/v1/classroom/teacher/sessions/${sessionId}/not-conducted`,
    TEACHER_SESSION_ATTENDANCE: (sessionId: string) =>
      `/v1/classroom/teacher/sessions/${sessionId}/attendance`,
    TEACHER_SESSION_AUDIT: (sessionId: string) =>
      `/v1/classroom/teacher/sessions/${sessionId}/audit`,
    TEACHER_FLIPPED_PREPARATION: '/v1/classroom/teacher/flipped-preparation',
    TEACHER_FLIPPED_PREPARATION_BY_ID: (lessonPlanId: string) =>
      `/v1/classroom/teacher/flipped-preparation/${lessonPlanId}`,
    ADMIN_ACADEMIC_YEARS: '/v1/classroom/admin/academic-years',
    ADMIN_SESSIONS: '/v1/classroom/admin/sessions',
    ADMIN_SESSIONS_GENERATE: '/v1/classroom/admin/sessions/generate',
    ADMIN_SESSION_AUDIT: (sessionId: string) => `/v1/classroom/admin/sessions/${sessionId}/audit`,
    STUDENT_OVERVIEW: '/v1/classroom/student/overview',
    STUDENT_CLASSES: '/v1/classroom/student/classes',
    STUDENT_SESSIONS: '/v1/classroom/student/sessions',
    STUDENT_SESSION_BY_ID: (sessionId: string) => `/v1/classroom/student/sessions/${sessionId}`,
    STUDENT_SESSION_JOIN: (sessionId: string) => `/v1/classroom/student/sessions/${sessionId}/join`,
    STUDENT_ATTENDANCE: '/v1/classroom/student/attendance',
    STUDENT_FLIPPED_PREPARATION: '/v1/classroom/student/flipped-preparation',
    PARENT_CHILD_OVERVIEW: (childId: string) => `/v1/classroom/parent/children/${childId}/overview`,
    PARENT_CHILD_SESSIONS: (childId: string) => `/v1/classroom/parent/children/${childId}/sessions`,
    PARENT_CHILD_ATTENDANCE: (childId: string) =>
      `/v1/classroom/parent/children/${childId}/attendance`,
  },
  LEARNING_ACTIVITIES: {
    TEACHER_OVERVIEW: '/v1/learning-activities/teacher/overview',
    TEACHER_ASSIGNMENTS: '/v1/learning-activities/teacher/assignments',
    TEACHER_ACTIVITIES: '/v1/learning-activities/teacher/activities',
    TEACHER_CLOSE_DUE: '/v1/learning-activities/teacher/activities/close-due',
    TEACHER_ACTIVITY_BY_ID: (activityId: string) =>
      `/v1/learning-activities/teacher/activities/${activityId}`,
    TEACHER_ACTIVITY_PUBLISH: (activityId: string) =>
      `/v1/learning-activities/teacher/activities/${activityId}/publish`,
    TEACHER_ACTIVITY_CLOSE: (activityId: string) =>
      `/v1/learning-activities/teacher/activities/${activityId}/close`,
    TEACHER_ACTIVITY_EXTEND_LATE: (activityId: string) =>
      `/v1/learning-activities/teacher/activities/${activityId}/extend-late`,
    TEACHER_ACTIVITY_AUDIT: (activityId: string) =>
      `/v1/learning-activities/teacher/activities/${activityId}/audit`,
    TEACHER_SUBMISSIONS: '/v1/learning-activities/teacher/submissions',
    TEACHER_START_REVIEW: (submissionId: string) =>
      `/v1/learning-activities/teacher/submissions/${submissionId}/start-review`,
    TEACHER_REVIEW_SUBMISSION: (submissionId: string) =>
      `/v1/learning-activities/teacher/submissions/${submissionId}/reviews`,
    TEACHER_FILE_DOWNLOAD: (fileId: string) =>
      `/v1/learning-activities/teacher/files/${fileId}/download`,
    STUDENT_OVERVIEW: '/v1/learning-activities/student/overview',
    STUDENT_ACTIVITIES: '/v1/learning-activities/student/activities',
    STUDENT_ACTIVITY_BY_ID: (activityId: string) =>
      `/v1/learning-activities/student/activities/${activityId}`,
    STUDENT_ACTIVITY_SUBMIT: (activityId: string) =>
      `/v1/learning-activities/student/activities/${activityId}/submit`,
    STUDENT_FILE_DOWNLOAD: (fileId: string) =>
      `/v1/learning-activities/student/files/${fileId}/download`,
    PARENT_CHILD_OVERVIEW: (childId: string) =>
      `/v1/learning-activities/parent/children/${childId}/overview`,
    PARENT_CHILD_ACTIVITIES: (childId: string) =>
      `/v1/learning-activities/parent/children/${childId}/activities`,
    PARENT_CHILD_ACTIVITY_BY_ID: (childId: string, activityId: string) =>
      `/v1/learning-activities/parent/children/${childId}/activities/${activityId}`,
    PARENT_CHILD_FILE_DOWNLOAD: (childId: string, fileId: string) =>
      `/v1/learning-activities/parent/children/${childId}/files/${fileId}/download`,
    ADMIN_OVERVIEW: '/v1/learning-activities/admin/overview',
    ADMIN_FILTERS: '/v1/learning-activities/admin/filters',
    ADMIN_ACTIVITIES: '/v1/learning-activities/admin/activities',
    ADMIN_ACTIVITY_BY_ID: (activityId: string) =>
      `/v1/learning-activities/admin/activities/${activityId}`,
    ADMIN_CLOSE_DUE: '/v1/learning-activities/admin/activities/close-due',
    ADMIN_FILE_DOWNLOAD: (fileId: string) =>
      `/v1/learning-activities/admin/files/${fileId}/download`,
  },
  AI_COPILOT: {
    STATUS: '/v1/ai-teacher-copilot/status',
    TEACHER_CONTEXT: '/v1/ai-teacher-copilot/teacher/context',
    LESSON_PLANS_GENERATE: '/v1/ai-teacher-copilot/teacher/lesson-plans/generate',
    TEACHING_MATERIALS_GENERATE: '/v1/ai-teacher-copilot/teacher/teaching-materials/generate',
    QUESTIONS_GENERATE: '/v1/ai-teacher-copilot/teacher/questions/generate',
    ASSESSMENTS_GENERATE: '/v1/ai-teacher-copilot/teacher/assessments/generate',
    HOMEWORK_GENERATE: '/v1/ai-teacher-copilot/teacher/activities/homework/generate',
    PROJECT_GENERATE: '/v1/ai-teacher-copilot/teacher/activities/project/generate',
    PERFORMANCE_ANALYZE: '/v1/ai-teacher-copilot/teacher/performance/analyze',
    LEARNING_GAPS_ANALYZE: '/v1/ai-teacher-copilot/teacher/learning-gaps/analyze',
    REMEDIAL_PLANS_GENERATE: '/v1/ai-teacher-copilot/teacher/remedial-plans/generate',
    FEEDBACK_DRAFT: '/v1/ai-teacher-copilot/teacher/feedback/draft',
    PARENT_COMMUNICATIONS_DRAFT: '/v1/ai-teacher-copilot/teacher/parent-communications/draft',
    MATERIALS_APPROVE: '/v1/ai-teacher-copilot/teacher/materials/approve',
    MATERIALS_LIST: '/v1/ai-teacher-copilot/teacher/materials',
    MATERIAL_VERSIONS: (materialId: string) =>
      `/v1/ai-teacher-copilot/teacher/materials/${materialId}/versions`,
    STUDENT_STUDY_ASSISTANT: '/v1/ai-teacher-copilot/student/study-assistant/respond',
    ADMIN_USAGE: '/v1/ai-teacher-copilot/admin/usage',
  },
} as const;
