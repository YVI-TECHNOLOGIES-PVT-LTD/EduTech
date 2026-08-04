export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentName: string;
  grade: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}
