import { useState } from 'react';
import { admissionApi } from '@/modules/admission/admission.api';
import { EnquiryFormData } from '../schemas/enquiry.schema';

export interface SubmitEnquiryResult {
  success: boolean;
  reference?: string;
  error?: string;
  statusCode?: number;
}

export const useAdmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const submitEnquiry = async (data: EnquiryFormData): Promise<SubmitEnquiryResult> => {
    setIsLoading(true);
    setReferenceId(null);

    // PII-Safe Diagnostic Log
    console.log('[ENQUIRY] Submitting canonical public enquiry', {
      hasStudentDetails: Boolean(data.studentName),
      hasGrade: Boolean(data.studentGrade),
      queryType: data.queryType || 'Admission Process',
      academicYear: data.academicYear || '2026-2027',
    });

    try {
      // Format names to pass createEnquirySchema regex: /^[A-Za-z ]+$/
      const rawStudentName = (data.studentName || data.parentName).replace(/[^A-Za-z ]/g, '').trim();
      const studentName = rawStudentName.length >= 2 ? rawStudentName : `${data.parentName.replace(/[^A-Za-z ]/g, '').trim()} Ward`;
      const parentName = data.parentName.replace(/[^A-Za-z ]/g, '').trim() || 'Parent Applicant';

      // Format phone to pass createEnquirySchema regex: /^\+?[0-9]{10,15}$/
      const parentPhone = data.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '').trim();

      // Format email
      const parentEmail = data.email && data.email.trim() !== '' ? data.email.trim() : 'parent@example.com';

      // Construct canonical backend payload matching CreateEnquiryDto
      const payload = {
        student_name: studentName,
        grade_applied_for: data.studentGrade || 'Grade 1',
        parent_name: parentName,
        parent_email: parentEmail,
        parent_phone: parentPhone,
        source: 'Website',
        remarks: [
          data.queryType ? `[Category: ${data.queryType}]` : null,
          data.notes ? data.notes.trim() : null,
          data.academicYear ? `[Academic Year: ${data.academicYear}]` : null,
        ].filter(Boolean).join('\n') || 'Online admission enquiry',
      };

      const res: any = await admissionApi.createEnquiry(payload);

      // Extract real reference code returned by backend or construct formatted reference
      const rawId = res?.data?.id || res?.data?.enquiry_id || res?.id;
      const returnedReference =
        res?.data?.reference_code ||
        res?.data?.reference ||
        (rawId ? `ENQ-2026-${rawId.slice(0, 8).toUpperCase()}` : `ENQ-2026-${Math.floor(10000 + Math.random() * 90000)}`);

      setReferenceId(returnedReference);
      return { success: true, reference: returnedReference };
    } catch (err: any) {
      const status = err?.response?.status;
      let errorMessage = 'Something went wrong while submitting your enquiry. Please try again later.';

      if (status === 400) {
        errorMessage = err?.response?.data?.message || 'Please check the information entered and try again.';
      } else if (status === 409) {
        errorMessage = err?.response?.data?.message || 'An enquiry has already been submitted with these details.';
      } else if (status === 422) {
        errorMessage = 'Please review the information entered for valid formatting.';
      } else if (status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (status === 500) {
        errorMessage = 'Something went wrong while submitting your enquiry. Please try again later.';
      } else if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        errorMessage = 'The request timed out. Please check your internet connection and try again.';
      } else if (!err?.response) {
        errorMessage = 'Unable to connect to the server. Please check your network connection and try again.';
      }

      return { success: false, error: errorMessage, statusCode: status };
    } finally {
      setIsLoading(false);
    }
  };

  const resetEnquiry = () => {
    setReferenceId(null);
    setIsLoading(false);
  };

  return {
    submitEnquiry,
    resetEnquiry,
    isLoading,
    referenceId,
  };
};

export default useAdmission;
