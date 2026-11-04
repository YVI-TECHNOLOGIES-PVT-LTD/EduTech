export type ChildRelationship = 'father' | 'mother' | 'guardian';

export interface BaseChild {
  id: string; // Unique identifier: studentId or applicationId
  fullName: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  avatarUrl?: string | null;
  relationship?: ChildRelationship | string;
  isPrimaryContact?: boolean;
  academicYear: string; // e.g. "2026-2027"
}

export interface EnrolledChild extends BaseChild {
  kind: 'enrolled';
  studentId: string;
  admissionNumber: string;
  gradeLevel: string; // e.g. "Grade 4"
  section: string; // e.g. "B"
  rollNumber?: string;
  campusName?: string;
  status: 'active' | 'graduated' | 'suspended' | 'transferred' | string;
  attendanceToday?: {
    status: 'present' | 'absent' | 'late' | 'holiday' | 'unmarked';
    timestamp?: string;
  };
  hasPendingFees?: boolean;
  pendingFeeAmount?: number;
}

export interface ApplicantChild extends BaseChild {
  kind: 'applicant';
  applicationId: string;
  applicationNumber: string; // e.g. "APP-2026-089"
  applyingGrade: string; // e.g. "Kindergarten"
  stage:
    | 'draft'
    | 'submitted'
    | 'documents_pending'
    | 'under_review'
    | 'assessment_scheduled'
    | 'fee_pending'
    | 'decision_ready'
    | 'offer_accepted'
    | 'rejected'
    | string;
  progressPercentage: number; // 0 - 100
  actionRequiredNotice?: string;
}

export type UnifiedChild = EnrolledChild | ApplicantChild;
