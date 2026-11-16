/**
 * EduTrack ERP Mobile V1 — TanStack Query Keys Factory
 */

export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  metadata: {
    config: ['metadata', 'config'] as const,
    academicYears: ['metadata', 'academicYears'] as const,
    classes: ['metadata', 'classes'] as const,
    documentTypes: ['metadata', 'documentTypes'] as const,
  },
  applications: {
    all: ['applications'] as const,
    mine: () => ['applications', 'mine'] as const,
    detail: (id: string) => ['applications', 'detail', id] as const,
  },
  documents: {
    list: (appId: string) => ['documents', 'application', appId] as const,
    signedUrl: (docId: string) => ['documents', 'signedUrl', docId] as const,
  },
  assessment: {
    byApplication: (appId: string) => ['assessment', 'application', appId] as const,
  },
  decision: {
    byApplication: (appId: string) => ['decision', 'application', appId] as const,
  },
  fees: {
    summary: (appId: string) => ['fees', 'summary', appId] as const,
    receipt: (appId: string) => ['fees', 'receipt', appId] as const,
    myChildren: () => ['fees', 'myChildren'] as const,
    childDetails: (studentId: string) => ['fees', 'childDetails', studentId] as const,
  },
  timeline: {
    byApplication: (appId: string) => ['timeline', 'application', appId] as const,
  },
  notifications: {
    all: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  academics: {
    all: ['academics'] as const,
    attendance: (studentId: string, month?: string) =>
      ['academics', 'attendance', studentId, month || 'current'] as const,
    timetable: (studentId: string) => ['academics', 'timetable', studentId] as const,
    homework: (studentId: string) => ['academics', 'homework', studentId] as const,
    exams: (studentId: string) => ['academics', 'exams', studentId] as const,
    reportCard: (studentId: string, term?: string) =>
      ['academics', 'reportCard', studentId, term || 'all'] as const,
  },
  finance: {
    childLedger: (studentId: string) => ['finance', 'childLedger', studentId] as const,
  },
  parent: {
    lifecycle: (parentId?: string) => ['parent', 'lifecycle', parentId || 'current'] as const,
    students: (parentId: string) => ['parent', 'students', parentId] as const,
  },
} as const;
