export enum AdmissionStatus {
  ENQUIRY = 'ENQUIRY',
  LEAD = 'LEAD',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  DOCUMENTS_VERIFIED = 'DOCUMENTS_VERIFIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ENROLLED = 'ENROLLED',
}

export interface AdmissionEnquiry {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  gradeApplying: string;
  status: AdmissionStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorRecord {
  id: string;
  visitorName: string;
  purpose: string;
  phone: string;
  checkInTime: string;
  checkOutTime?: string;
  hostName?: string;
}
