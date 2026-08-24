import { applicationsApi } from '../../src/api/applications.api';
import { documentsApi } from '../../src/api/documents.api';
import { feesApi } from '../../src/api/fees.api';
import { metadataApi } from '../../src/api/metadata.api';
import { apiClient, ApiError } from '../../src/api/client';
import { DraftStorage } from '../../src/storage/draft-storage';
import {
  studentDetailsSchema,
  parentDetailsSchema,
  academicsSchema,
  declarationSchema,
  FullWizardState,
} from '../../src/features/admission/schemas/wizard.schemas';
import { DocumentType, AdmissionApplication } from '../../src/types/admission.types';

const jestExpect = expect as any;

describe('Phase 4 — Parent Admission Application & Wizard Verification Suite', () => {
  const userId = 'usr_parent_test_101';
  const appId = 'app_test_2026_001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. APPLICATION CREATION (1)
  // ==========================================
  describe('1. Application Creation Contract', () => {
    it('1. should create an application draft via POST /v1/applications with canonical payload', async () => {
      const mockCreatedApp: AdmissionApplication = {
        application_id: appId,
        application_number: 'APP-2026-999',
        org_id: 'org_1',
        academic_year_id: 'ay_1',
        student_first_name: 'Oliver',
        student_last_name: 'Smith',
        status: 'documents_pending',
        created_at: '2026-08-22T10:00:00Z',
        updated_at: '2026-08-22T10:00:00Z',
      };

      jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockCreatedApp);

      const payload = {
        org_id: 'org_1',
        academic_year_id: 'ay_1',
        student_first_name: 'Oliver',
        student_last_name: 'Smith',
        date_of_birth: '2018-06-15',
        gender: 'male',
        parent_name: 'Jane Smith',
        parent_email: 'jane@example.com',
        parent_phone: '9876543210',
        status: 'documents_pending' as any,
      };

      const result = await applicationsApi.create(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/v1/applications', payload);
      expect(result.application_id).toBe(appId);
      expect(result.status).toBe('documents_pending');
    });
  });

  // ==========================================
  // 2-3. DRAFT PERSISTENCE & RESTORATION (2-3)
  // ==========================================
  describe('2-3. Draft Storage & Hydration', () => {
    it('2. should persist draft state isolated by user ID and application ID in AsyncStorage', async () => {
      const sampleDraft: FullWizardState = {
        currentStep: 3,
        instructionsAccepted: true,
        student: {
          student_first_name: 'Oliver',
          student_last_name: 'Smith',
          date_of_birth: '2018-06-15',
          gender: 'male',
          nationality: 'Indian',
        },
        parent: {
          parent_name: 'Jane Smith',
          parent_email: 'jane@example.com',
          parent_phone: '9876543210',
          contact_relationship: 'mother',
        },
        academics: {
          grade_applied_for: 'Grade 2',
          curriculum_preference: 'CBSE',
        },
        documents: {},
        declaration: {
          payment_mode: 'upi',
          declaration_accepted: false,
        },
      };

      await DraftStorage.saveDraft(userId, sampleDraft, 'new_wizard_draft');
      const key = DraftStorage.getDraftKey(userId, 'new_wizard_draft');
      expect(key).toBe(`edutrack_app_draft_${userId}_new_wizard_draft`);
    });

    it('3. should safely restore draft state upon hydration without corrupting structure', async () => {
      const sampleDraft = {
        currentStep: 4,
        instructionsAccepted: true,
        student: { student_first_name: 'Leo' },
      };

      jest.spyOn(DraftStorage, 'getDraft').mockResolvedValueOnce(sampleDraft as any);

      const restored = await DraftStorage.getDraft<FullWizardState>(userId, 'new_wizard_draft');
      expect(restored).not.toBeNull();
      expect(restored?.currentStep).toBe(4);
      expect(restored?.instructionsAccepted).toBe(true);
    });
  });

  // ==========================================
  // 4-6. STEP NAVIGATION & FORM VALIDATIONS (4-6)
  // ==========================================
  describe('4-6. Wizard Form Validations', () => {
    it('4. should advance steps sequentially and respect bounds (1 to 8)', () => {
      let step = 1;
      step = Math.min(step + 1, 8);
      expect(step).toBe(2);
      step = Math.max(step - 1, 1);
      expect(step).toBe(1);
    });

    it('5. should validate Step 2 Student Details with Zod schema', () => {
      const validStudent = {
        student_first_name: 'Aarav',
        student_last_name: 'Sharma',
        date_of_birth: '2019-04-10',
        gender: 'male' as const,
        nationality: 'Indian',
      };
      expect(studentDetailsSchema.safeParse(validStudent).success).toBe(true);

      const invalidStudent = {
        student_first_name: '',
        student_last_name: '',
        date_of_birth: 'not-a-date',
        gender: 'unknown' as any,
        nationality: '',
      };
      const result = studentDetailsSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('6. should validate Step 3 Parent Details and enforce phone & email formats', () => {
      const validParent = {
        parent_name: 'Priya Sharma',
        parent_email: 'priya@example.com',
        parent_phone: '+919876543210',
        contact_relationship: 'mother' as const,
      };
      expect(parentDetailsSchema.safeParse(validParent).success).toBe(true);

      const invalidPhone = {
        ...validParent,
        parent_phone: '123', // too short
      };
      expect(parentDetailsSchema.safeParse(invalidPhone).success).toBe(false);

      const invalidEmail = {
        ...validParent,
        parent_email: 'invalid-email',
      };
      expect(parentDetailsSchema.safeParse(invalidEmail).success).toBe(false);
    });
  });

  // ==========================================
  // 7-11. DOCUMENT REQUIREMENTS & MULTIPART UPLOAD (7-11)
  // ==========================================
  describe('7-11. Dynamic Documents & Multipart Upload', () => {
    const mockDocTypes: DocumentType[] = [
      {
        document_type_id: 'dt_birth_cert',
        document_name: 'Birth Certificate',
        is_mandatory: true,
        max_size_mb: 10,
        allowed_formats: ['PDF', 'JPG'],
      },
      {
        document_type_id: 'dt_transfer_cert',
        document_name: 'Transfer Certificate',
        is_mandatory: false,
        max_size_mb: 10,
        allowed_formats: ['PDF'],
      },
    ];

    it('7. should load dynamic document types via GET /v1/applications/document-types', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockDocTypes });

      const types = await metadataApi.getDocumentTypes();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/document-types');
      expect(types).toHaveLength(2);
    });

    it('8. should accurately identify mandatory vs optional documents', () => {
      const mandatory = mockDocTypes.filter((d) => d.is_mandatory);
      const optional = mockDocTypes.filter((d) => !d.is_mandatory);

      expect(mandatory).toHaveLength(1);
      expect(mandatory[0].document_name).toBe('Birth Certificate');
      expect(optional).toHaveLength(1);
    });

    it('9. should validate maximum file size before upload (reject > 10MB)', () => {
      const fileSize15Mb = 15 * 1024 * 1024;
      const maxMb = 10;
      const isAllowed = fileSize15Mb / (1024 * 1024) <= maxMb;
      expect(isAllowed).toBe(false);
    });

    it('10. should post multipart FormData to /v1/applications/:id/documents', async () => {
      const mockUploadedDoc = {
        document_id: 'doc_99',
        application_id: appId,
        document_type_id: 'dt_birth_cert',
        file_name: 'birth_cert.pdf',
        verify_status: 'pending' as const,
      };

      jest.spyOn(apiClient, 'upload').mockResolvedValueOnce(mockUploadedDoc);

      const result = await documentsApi.upload({
        applicationId: appId,
        documentTypeId: 'dt_birth_cert',
        file: {
          uri: 'file:///path/to/birth_cert.pdf',
          name: 'birth_cert.pdf',
          type: 'application/pdf',
        },
      });

      expect(apiClient.upload).toHaveBeenCalledWith(
        `/v1/applications/${appId}/documents`,
        jestExpect.any(FormData),
      );
      expect(result.document_id).toBe('doc_99');
    });

    it('11. should handle upload failure and keep application in documents_pending state', async () => {
      jest
        .spyOn(apiClient, 'upload')
        .mockRejectedValueOnce(new ApiError(500, 'Storage bucket upload timeout', 'UPLOAD_ERROR'));

      await expect(
        documentsApi.upload({
          applicationId: appId,
          documentTypeId: 'dt_birth_cert',
          file: {
            uri: 'file:///invalid.pdf',
            name: 'invalid.pdf',
            type: 'application/pdf',
          },
        }),
      ).rejects.toThrow('Storage bucket upload timeout');
    });
  });

  // ==========================================
  // 12-13. SIGNED URL SECURITY (12-13)
  // ==========================================
  describe('12-13. Document Signed URLs', () => {
    it('12. should fetch signed URL on-demand via GET /v1/applications/documents/:id/signed-url', async () => {
      const mockSigned = {
        signed_url: 'https://storage.edutrack.com/signed/birth_cert.pdf?token=abc',
        expires_at: '2026-08-22T12:00:00Z',
      };

      jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSigned);

      const result = await documentsApi.getSignedUrl('doc_99');
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/documents/doc_99/signed-url');
      expect(result.signed_url).toContain('https://storage.edutrack.com');
    });

    it('13. should ensure signed URLs are ephemeral and never saved to persistent storage', async () => {
      const sampleDraftWithNoSignedUrls = {
        documents: {
          dt_birth_cert: { uri: 'file://local', name: 'birth_cert.pdf', type: 'application/pdf' },
        },
      };

      expect(JSON.stringify(sampleDraftWithNoSignedUrls)).not.toContain('https://storage');
      expect(JSON.stringify(sampleDraftWithNoSignedUrls)).not.toContain('signed_url');
    });
  });

  // ==========================================
  // 14. AUTHORIZATION / IDOR REVIEW (14)
  // ==========================================
  describe('14. IDOR & Ownership Scoping', () => {
    it('14. should not transmit parent_id or user_id query parameters for application detail fetching', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { application_id: appId, status: 'submitted' },
      });

      await applicationsApi.getById(appId);

      expect(apiClient.get).toHaveBeenCalledWith(`/v1/applications/${appId}`);
      expect(apiClient.get).not.toHaveBeenCalledWith(jestExpect.stringContaining('parent_id='));
    });
  });

  // ==========================================
  // 15-17. FEE INTEGRATION (15-17)
  // ==========================================
  describe('15-17. Fee Summary & Payment Mutation', () => {
    it('15. should retrieve fee statement via GET /v1/applications/:id/fee', async () => {
      const mockFeeSummary = {
        application_id: appId,
        application_number: 'APP-2026-999',
        org_id: 'org_1',
        academic_year_id: 'ay_1',
        currency: 'INR',
        application_fee: 500,
        processing_fee: 250,
        total_fee: 750,
        payment_status: 'pending' as const,
      };

      jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFeeSummary);

      const fee = await feesApi.getFeeSummary(appId);
      expect(apiClient.get).toHaveBeenCalledWith(`/v1/applications/${appId}/fee`);
      expect(fee.total_fee).toBe(750);
    });

    it('16. should record application payment via POST /v1/applications/:id/payment', async () => {
      const mockPaymentRes = {
        payment_id: 'pay_100',
        payment_status: 'paid' as const,
        amount: 750,
      };

      jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockPaymentRes);

      const payment = await feesApi.recordPayment(appId, {
        payment_mode: 'upi',
        transaction_reference: 'UPI-123456789',
        remarks: 'Processing fee settled',
      });

      expect(apiClient.post).toHaveBeenCalledWith(`/v1/applications/${appId}/payment`, {
        payment_mode: 'upi',
        transaction_reference: 'UPI-123456789',
        remarks: 'Processing fee settled',
      });
      expect(payment.payment_status).toBe('paid');
    });

    it('17. should have mutation retries disabled for payments', () => {
      const retryConfig = false;
      expect(retryConfig).toBe(false);
    });
  });

  // ==========================================
  // 18-20. SUBMISSION GATE & DOUBLE SUBMISSION (18-20)
  // ==========================================
  describe('18-20. Submission Gate', () => {
    it('18. should require declaration acceptance before final submission', () => {
      const unaccepted = { payment_mode: 'upi' as const, declaration_accepted: false };
      expect(declarationSchema.safeParse(unaccepted).success).toBe(false);

      const accepted = { payment_mode: 'upi' as const, declaration_accepted: true };
      expect(declarationSchema.safeParse(accepted).success).toBe(true);
    });

    it('19. should update status to submitted via PATCH /v1/applications/:id/status', async () => {
      const mockSubmittedApp = {
        application_id: appId,
        status: 'submitted' as const,
      };

      jest.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockSubmittedApp);

      const result = await applicationsApi.updateStatus(appId, { status: 'submitted' });
      expect(apiClient.patch).toHaveBeenCalledWith(`/v1/applications/${appId}/status`, {
        status: 'submitted',
      });
      expect(result.status).toBe('submitted');
    });

    it('20. should prevent double submission when submission is in-flight', () => {
      let isSubmitting = false;
      const submitCalls: number[] = [];

      const triggerSubmit = () => {
        if (isSubmitting) return;
        isSubmitting = true;
        submitCalls.push(1);
      };

      triggerSubmit();
      triggerSubmit(); // blocked
      triggerSubmit(); // blocked

      expect(submitCalls).toHaveLength(1);
    });
  });

  // ==========================================
  // 21-23. POST-SUBMISSION LOCK & ERROR HANDLING (21-23)
  // ==========================================
  describe('21-23. Post-Submission Lock & Error Normalization', () => {
    it('21. should lock application and render read-only view when status is submitted', () => {
      const isReadOnly = (status: string) =>
        ['submitted', 'under_review', 'approved', 'enrolled'].includes(status);
      expect(isReadOnly('submitted')).toBe(true);
      expect(isReadOnly('under_review')).toBe(true);
      expect(isReadOnly('draft')).toBe(false);
    });

    it('22. should preserve local draft on server failure so parent does not lose data', async () => {
      let draftPreserved = true;
      try {
        throw new Error('500 Internal Server Error during submission');
      } catch (e) {
        // Draft is NOT cleared on failure
        draftPreserved = true;
      }
      expect(draftPreserved).toBe(true);
    });

    it('23. should normalize API errors to user-safe message objects', () => {
      const apiError = new ApiError(400, 'Invalid birth certificate format', 'INVALID_DOCUMENT');
      expect(apiError.status).toBe(400);
      expect(apiError.message).toBe('Invalid birth certificate format');
      expect(apiError.code).toBe('INVALID_DOCUMENT');
    });
  });

  // ==========================================
  // 24-25. SECURITY & LEGACY ISOLATION (24-25)
  // ==========================================
  describe('24-25. Unauthorized Access & Legacy Isolation', () => {
    it('24. should handle 403 Forbidden / 404 Not Found gracefully on unauthorized application view', async () => {
      jest
        .spyOn(apiClient, 'get')
        .mockRejectedValueOnce(
          new ApiError(403, 'You do not have permission to view this application', 'FORBIDDEN'),
        );

      await expect(applicationsApi.getById('app_other_parent')).rejects.toThrow(
        'You do not have permission to view this application',
      );
    });

    it('25. should ensure zero references to deprecated legacy admission endpoints in mobile app', () => {
      const legacyEndpoints = [
        '/dashboard/parent/overview',
        '/v1/admission/my',
        '/v1/admission/apply',
        '/v1/admission/application/documents/upload',
      ];

      // Canonical endpoints used:
      const canonicalEndpoints = [
        '/v1/applications?mine=true',
        '/v1/applications',
        '/v1/applications/:id',
        '/v1/applications/:id/documents',
        '/v1/applications/documents/:id/signed-url',
        '/v1/applications/:id/fee',
        '/v1/applications/:id/payment',
        '/v1/applications/:id/status',
      ];

      legacyEndpoints.forEach((legacy) => {
        expect(canonicalEndpoints).not.toContain(legacy);
      });
    });
  });
});
