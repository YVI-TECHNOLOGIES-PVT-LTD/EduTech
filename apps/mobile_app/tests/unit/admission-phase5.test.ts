import { documentsApi } from '../../src/api/documents.api';
import { feesApi } from '../../src/api/fees.api';
import { assessmentApi } from '../../src/api/assessment.api';
import { decisionApi } from '../../src/api/decision.api';
import { timelineApi } from '../../src/api/timeline.api';
import { apiClient } from '../../src/api/client';
import { ENDPOINTS } from '../../src/api/endpoints';

jest.mock('../../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    upload: jest.fn(),
  },
}));

describe('Phase 5 — Document Center, Fee & Payment, Assessment, Decision & Timeline Suites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Document Center & Verification Vault', () => {
    it('should fetch application documents from canonical GET /v1/applications/:id/documents', async () => {
      const mockDocs = [
        {
          document_id: 'doc-001',
          application_id: 'app-123',
          document_type_id: 'dt-01',
          file_name: 'birth_cert.pdf',
          verify_status: 'verified',
        },
        {
          document_id: 'doc-002',
          application_id: 'app-123',
          document_type_id: 'dt-02',
          file_name: 'photo.jpg',
          verify_status: 'rejected',
          rejection_reason: 'Photo is blurry',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockDocs,
      });

      const docs = await documentsApi.listByApplication('app-123');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app-123/documents');
      expect(docs).toHaveLength(2);
      expect(docs[0].verify_status).toBe('verified');
      expect(docs[1].rejection_reason).toBe('Photo is blurry');
    });

    it('should fetch ephemeral signed url from GET /v1/applications/documents/:id/signed-url', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          signed_url: 'https://s3.amazonaws.com/bucket/doc-001.pdf?signature=xyz',
          expires_at: '2026-08-22T12:00:00Z',
        },
      });

      const res = await documentsApi.getSignedUrl('doc-001');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/documents/doc-001/signed-url');
      expect(res.signed_url).toContain('https://s3.amazonaws.com');
      expect(res.expires_at).toBe('2026-08-22T12:00:00Z');
    });

    it('should upload document with multipart form data to POST /v1/applications/:id/documents', async () => {
      (apiClient.upload as jest.Mock).mockResolvedValueOnce({
        document: {
          document_id: 'doc-new',
          application_id: 'app-123',
          document_type_id: 'dt-01',
          verify_status: 'pending',
        },
      });

      const res = await documentsApi.upload({
        applicationId: 'app-123',
        documentTypeId: 'dt-01',
        file: {
          uri: 'file:///path/to/file.pdf',
          name: 'file.pdf',
          type: 'application/pdf',
        },
      });

      expect(apiClient.upload).toHaveBeenCalled();
      expect((apiClient.upload as jest.Mock).mock.calls[0][0]).toBe(
        '/v1/applications/app-123/documents',
      );
      expect(res.document_id).toBe('doc-new');
    });
  });

  describe('2. Fee Statement & Settlement Payment', () => {
    it('should fetch fee statement from GET /v1/applications/:id/fee', async () => {
      const mockFee = {
        application_id: 'app-123',
        application_fee: 500,
        processing_fee: 250,
        total_fee: 750,
        payment_status: 'due',
        currency: 'INR',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockFee,
      });

      const res = await feesApi.getFeeSummary('app-123');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app-123/fee');
      expect(res.total_fee).toBe(750);
      expect(res.payment_status).toBe('due');
    });

    it('should record simulated fee payment via POST /v1/applications/:id/payment without mutation retries', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          payment_id: 'pay-001',
          application_id: 'app-123',
          amount: 750,
          payment_mode: 'upi',
          payment_status: 'paid',
          transaction_reference: 'MOB-123456',
        },
      });

      const res = await feesApi.recordPayment('app-123', {
        payment_mode: 'upi',
        transaction_reference: 'MOB-123456',
        remarks: 'Admission fee settled',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/v1/applications/app-123/payment', {
        payment_mode: 'upi',
        transaction_reference: 'MOB-123456',
        remarks: 'Admission fee settled',
      });
      expect(res.payment_status).toBe('paid');
    });

    it('should fetch itemized payment receipt from GET /v1/applications/:id/receipt', async () => {
      const mockReceipt = {
        receipt_id: 'rec-001',
        receipt_number: 'REC-2026-001',
        application_id: 'app-123',
        application_number: 'APP-2026-001',
        student_name: 'John Doe',
        parent_name: 'Jane Doe',
        amount: 750,
        currency: 'INR',
        payment_mode: 'upi',
        payment_status: 'paid',
        payment_date: '2026-08-22T10:00:00Z',
        breakdown: {
          application_fee: 500,
          processing_fee: 250,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        receipt: mockReceipt,
      });

      const receipt = await feesApi.getReceipt('app-123');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app-123/receipt');
      expect(receipt.receipt_number).toBe('REC-2026-001');
      expect(receipt.amount).toBe(750);
      expect(receipt.breakdown?.application_fee).toBe(500);
    });
  });

  describe('3. Assessment & Decision Trackers', () => {
    it('should fetch assessment details from GET /v1/applications/:id/assessment', async () => {
      const mockAssessment = {
        assessment_id: 'asm-001',
        application_id: 'app-123',
        assessment_type: 'WRITTEN_TEST',
        assessment_date: '2026-09-01T09:00:00Z',
        maximum_marks: 100,
        marks_obtained: 88,
        percentage: 88,
        result: 'pass',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        assessment: mockAssessment,
      });

      const res = await assessmentApi.getByApplicationId('app-123');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app-123/assessment');
      expect(res?.result).toBe('pass');
      expect(res?.marks_obtained).toBe(88);
    });

    it('should return null when assessment returns 404 Not Found', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        status: 404,
        message: 'Assessment not found',
      });

      const res = await assessmentApi.getByApplicationId('app-empty');

      expect(res).toBeNull();
    });

    it('should fetch admission decision from GET /v1/applications/:id/decision', async () => {
      const mockDecision = {
        decision_id: 'dec-001',
        application_id: 'app-123',
        decision_status: 'approved',
        decision_date: '2026-09-10T10:00:00Z',
        offer_expiry_date: '2026-09-25T23:59:59Z',
        remarks: 'Admitted to Grade 1 Section A',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        decision: mockDecision,
      });

      const res = await decisionApi.getByApplicationId('app-123');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app-123/decision');
      expect(res?.decision_status).toBe('approved');
      expect(res?.remarks).toBe('Admitted to Grade 1 Section A');
    });

    it('should return null when decision returns 404 Not Found', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        status: 404,
        message: 'Decision not found',
      });

      const res = await decisionApi.getByApplicationId('app-empty');

      expect(res).toBeNull();
    });
  });

  describe('4. Milestone Timeline Audit', () => {
    it('should fetch milestone events from GET /v1/applications/:id/timeline', async () => {
      const mockTimeline = {
        application_id: 'app-123',
        timeline: [
          {
            id: 'evt-1',
            type: 'APPLICATION_CREATED',
            title: 'Application Submitted',
            description: 'Application received and registered into the system.',
            performed_by: 'Parent Self-Service',
            timestamp: '2026-08-22T08:00:00Z',
          },
          {
            id: 'evt-2',
            type: 'DOCUMENT_UPLOADED',
            title: 'Birth Certificate Uploaded',
            description: 'Document uploaded for verification.',
            performed_by: 'Parent Self-Service',
            timestamp: '2026-08-22T08:05:00Z',
          },
          {
            id: 'evt-3',
            type: 'DOCUMENT_VERIFIED',
            title: 'Documents Verified',
            description: 'Admissions desk approved all mandatory certificates.',
            performed_by: 'Admissions Officer',
            timestamp: '2026-08-22T09:00:00Z',
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockTimeline);

      const res = await timelineApi.getTimeline('app-123');

      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app-123/timeline');
      expect(res.timeline).toHaveLength(3);
      expect(res.timeline[0].type).toBe('APPLICATION_CREATED');
      expect(res.timeline[2].type).toBe('DOCUMENT_VERIFIED');
    });
  });

  describe('5. Security & Parent Authorization Enforcement', () => {
    it('should never send client-side parent_id or user_id in query params or bodies for parent flows', () => {
      expect(ENDPOINTS.APPLICATIONS.LIST_MINE).toBe('/v1/applications?mine=true');
      expect(ENDPOINTS.APPLICATIONS.LIST_MINE).not.toContain('parent_id');
      expect(ENDPOINTS.APPLICATIONS.LIST_MINE).not.toContain('user_id');

      expect(ENDPOINTS.DOCUMENTS.LIST('app-123')).toBe('/v1/applications/app-123/documents');
      expect(ENDPOINTS.FEES.SUMMARY('app-123')).toBe('/v1/applications/app-123/fee');
      expect(ENDPOINTS.FEES.PAYMENT('app-123')).toBe('/v1/applications/app-123/payment');
      expect(ENDPOINTS.FEES.RECEIPT('app-123')).toBe('/v1/applications/app-123/receipt');
      expect(ENDPOINTS.ASSESSMENT.BY_APPLICATION('app-123')).toBe(
        '/v1/applications/app-123/assessment',
      );
      expect(ENDPOINTS.DECISION.BY_APPLICATION('app-123')).toBe(
        '/v1/applications/app-123/decision',
      );
      expect(ENDPOINTS.TIMELINE.BY_APPLICATION('app-123')).toBe(
        '/v1/applications/app-123/timeline',
      );
    });
  });
});
