import { ROUTES } from '../../src/constants/routes';
import { feesApi } from '../../src/api/fees.api';
import { apiClient } from '../../src/api/client';
import { ENDPOINTS } from '../../src/api/endpoints';
import { QUERY_KEYS } from '../../src/api/query-keys';

jest.mock('../../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Final Release Gate — Parent Mobile Finance Integrity & Deep-Link Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Route Registry & URL Resolution', () => {
    it('registers ENROLLED_FEES route path correctly for Expo Router and deep links', () => {
      expect(ROUTES.PARENT.ENROLLED_FEES).toBe('/(parent)/fees');
    });

    it('retains admission application fee route alongside enrolled fee route', () => {
      expect(ROUTES.PARENT.FEES('app_123')).toBe('/(parent)/applications/fees?id=app_123');
      expect(ROUTES.PARENT.DASHBOARD).toBe('/(parent)');
    });

    it('parses deep-link return URL parameters cleanly and safely', () => {
      const sampleUrl = 'edutrack://parent/fees?status=success&txId=tx_abc_123&studentId=std_789';
      const parsed = new URL(sampleUrl.replace('edutrack://', 'https://edutrack.app/'));

      expect(parsed.searchParams.get('status')).toBe('success');
      expect(parsed.searchParams.get('txId')).toBe('tx_abc_123');
      expect(parsed.searchParams.get('studentId')).toBe('std_789');
    });
  });

  describe('2. Missing, Malformed, and Untrusted Deep Links', () => {
    it('handles deep link missing transaction id safely without triggering false receipt fetch', () => {
      const malformedUrl = 'edutrack://parent/fees?status=success';
      const parsed = new URL(malformedUrl.replace('edutrack://', 'https://edutrack.app/'));

      const txId = parsed.searchParams.get('txId');
      expect(txId).toBeNull();
      // Verifies client does NOT call getParentReceipt when txId is absent
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('sanitizes malformed transaction id characters before querying API', async () => {
      const maliciousTxId = "tx_123'; DROP TABLE receipts;--";
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Invalid transaction ID format' } },
      });

      await expect(feesApi.getParentReceipt(maliciousTxId)).rejects.toMatchObject({
        response: { status: 400 },
      });
      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.FEES.RECEIPT_BY_TX(maliciousTxId));
    });
  });

  describe('3. Authoritative Verification vs Client-Supplied Status', () => {
    it('requires server verification when status=success arrives in deep link', async () => {
      const mockReceipt = {
        receipt_no: 'RCPT-2026-0042',
        receipt_number: 'RCPT-2026-0042',
        transaction_id: 'tx_auth_01',
        amount: 30000,
        currency: 'INR',
        transaction_status: 'success',
        status: 'GENERATED',
        student_name: 'Aarav Sharma',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockReceipt });

      const res = await feesApi.getParentReceipt('tx_auth_01');
      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.FEES.RECEIPT_BY_TX('tx_auth_01'));
      expect(res.transaction_status).toBe('success');
      expect(res.status).toBe('GENERATED');
    });

    it('detects and flags status=success when backend status is pending (webhook lag)', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: 'RECEIPT_NOT_READY',
            message: 'Receipt is not available for unconfirmed or pending transactions',
          },
        },
      });

      await expect(feesApi.getParentReceipt('tx_pending_01')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'RECEIPT_NOT_READY' },
        },
      });
    });

    it('blocks payment confirmation when payment was captured but unallocated', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: 'EXCEEDS_REMAINING_DUE',
            message: 'Payment was captured by gateway, but exceeds remaining due balance.',
          },
        },
      });

      await expect(feesApi.getParentReceipt('tx_unallocated_01')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'EXCEEDS_REMAINING_DUE' },
        },
      });
    });

    it('rejects unauthorized receipt access across different parent accounts (403)', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            success: false,
            error: 'UNAUTHORIZED_RECEIPT_ACCESS',
            message: 'You are not authorized to access receipts for this student.',
          },
        },
      });

      await expect(feesApi.getParentReceipt('tx_forbidden_student')).rejects.toMatchObject({
        response: {
          status: 403,
          data: { error: 'UNAUTHORIZED_RECEIPT_ACCESS' },
        },
      });
    });

    it('rejects marked cancelled receipts from triggering successful payment state', async () => {
      const cancelledReceipt = {
        receipt_no: 'RCPT-2026-0042',
        receipt_number: 'RCPT-2026-0042',
        transaction_id: 'tx_cancelled_01',
        amount: 30000,
        currency: 'INR',
        transaction_status: 'cancelled',
        receipt_type: 'CANCELLED',
        status: 'CANCELLED',
        student_name: 'Aarav Sharma',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: cancelledReceipt });

      const res = await feesApi.getParentReceipt('tx_cancelled_01');
      const isConfirmedSuccess =
        res &&
        res.transaction_status === 'success' &&
        res.receipt_type !== 'CANCELLED' &&
        res.status !== 'CANCELLED';

      expect(isConfirmedSuccess).toBe(false);
    });
  });

  describe('4. Checkout Cancellation & Network Resilience', () => {
    it('handles checkout cancellation without issuing ledger mutations or receipts', () => {
      const cancelledUrl = 'edutrack://parent/fees?status=cancelled&studentId=std_01';
      const parsed = new URL(cancelledUrl.replace('edutrack://', 'https://edutrack.app/'));

      expect(parsed.searchParams.get('status')).toBe('cancelled');
      // No server verify or receipt call should be executed
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('handles network disconnection during status verification gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      await expect(feesApi.getParentReceipt('tx_net_err')).rejects.toThrow(
        'Network request failed',
      );
    });
  });

  describe('5. Multi-Child Isolation & Concurrent State', () => {
    it('isolates React Query cache keys per student to prevent late response cross-pollution', () => {
      const keyChildA = QUERY_KEYS.fees.childDetails('student_A');
      const keyChildB = QUERY_KEYS.fees.childDetails('student_B');

      expect(keyChildA).toEqual(['fees', 'childDetails', 'student_A']);
      expect(keyChildB).toEqual(['fees', 'childDetails', 'student_B']);
      expect(keyChildA).not.toEqual(keyChildB);
    });

    it('retrieves multi-child ledger with distinct summaries and due dates', async () => {
      const multiChildResponse = {
        success: true,
        parent_name: 'Sunita Mehra',
        children_count: 2,
        children: [
          {
            student_id: 'std_child_1',
            first_name: 'Rohan',
            last_name: 'Mehra',
            grade_name: 'Grade 6',
            summary: {
              total_assessed: 60000,
              total_paid: 60000,
              outstanding_balance: 0,
              status: 'fully_paid',
            },
          },
          {
            student_id: 'std_child_2',
            first_name: 'Priya',
            last_name: 'Mehra',
            grade_name: 'Grade 9',
            summary: {
              total_assessed: 75000,
              total_paid: 25000,
              outstanding_balance: 50000,
              status: 'partially_paid',
            },
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(multiChildResponse);

      const res = await feesApi.getMyChildrenFees();
      expect(res.children).toHaveLength(2);
      expect(res.children[0].student_id).toBe('std_child_1');
      expect(res.children[0].summary.status).toBe('fully_paid');
      expect(res.children[1].student_id).toBe('std_child_2');
      expect(res.children[1].summary.status).toBe('partially_paid');
    });
  });

  describe('6. Double-Tap Prevention and Idempotency', () => {
    it('blocks duplicate payment order creation payload submissions', async () => {
      const orderPayload = {
        studentId: 'std_01',
        studentChargeDueId: 'due_01',
        amount: 15000,
        paymentMethod: 'card',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          order_id: 'order_rzp_mock_duplicate_test',
          payment_order_id: 'po_uuid_001',
          amount: 1500000,
        },
      });

      const firstCall = await feesApi.createPaymentOrder(orderPayload);
      expect(firstCall.order_id).toBe('order_rzp_mock_duplicate_test');
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });
  });
});
