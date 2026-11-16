import { feesApi } from '../../src/api/fees.api';
import { apiClient } from '../../src/api/client';
import { ENDPOINTS } from '../../src/api/endpoints';

jest.mock('../../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Phase 3 — Parent Mobile Online Payments, Checkout & Receipt Integration Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('P1 — Server-Authoritative Payment Initiation', () => {
    it('successfully calls create-order with authoritative student and due references', async () => {
      const mockOrderResponse = {
        success: true,
        order_id: 'order_rzp_mock_123',
        amount: 2000000, // 20,000 INR in paise
        currency: 'INR',
        key_id: 'rzp_test_public_key',
        payment_order_id: 'po_uuid_001',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockOrderResponse,
      });

      const payload = {
        student_id: 'std_001',
        student_charge_due_id: 'due_002',
        amount: 20000,
        payment_method: 'card',
      };

      const result = await feesApi.createPaymentOrder(payload);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        ENDPOINTS.FEES.CREATE_PAYMENT_ORDER,
        (expect as any).objectContaining(payload),
      );
      expect(result).toEqual(mockOrderResponse);
      expect(result.order_id).toBe('order_rzp_mock_123');
      expect(result.amount).toBe(2000000);
      expect(result.key_id).toBe('rzp_test_public_key');
    });

    it('propagates server validation errors when requesting payment on an invalid or settled due', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: 'DUE_ALREADY_SETTLED',
            message: 'This installment due has already been fully settled.',
          },
        },
      });

      await expect(
        feesApi.createPaymentOrder({
          student_id: 'std_001',
          student_charge_due_id: 'due_settled_001',
          amount: 5000,
        }),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            error: 'DUE_ALREADY_SETTLED',
          },
        },
      });
    });

    it('rejects cross-student or unauthorized child payment intent at API client level', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            success: false,
            error: 'FORBIDDEN',
            message: 'You are not authorized to create payment orders for this student.',
          },
        },
      });

      await expect(
        feesApi.createPaymentOrder({
          student_id: 'std_unauthorized_999',
          student_charge_due_id: 'due_foreign_001',
          amount: 10000,
        }),
      ).rejects.toMatchObject({
        response: {
          status: 403,
          data: {
            error: 'FORBIDDEN',
          },
        },
      });
    });
  });

  describe('P2 — Authoritative Payment Verification & Reconciliation', () => {
    it('submits cryptographic signature verification payload and receives committed ledger status', async () => {
      const mockVerifyResponse = {
        success: true,
        status: 'committed',
        ledger_updated: true,
        transaction_id: 'tx_uuid_999',
        receipt_number: 'RCPT-2026-0042',
        allocated_amount: 20000,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockVerifyResponse,
      });

      const verificationPayload = {
        payment_order_id: 'po_uuid_001',
        razorpay_order_id: 'order_rzp_mock_123',
        razorpay_payment_id: 'pay_rzp_mock_456',
        razorpay_signature: 'hmac_sha256_mock_sig',
      };

      const result = await feesApi.verifyPayment(verificationPayload);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        ENDPOINTS.FEES.VERIFY_PAYMENT,
        verificationPayload,
      );
      expect(result.status).toBe('committed');
      expect(result.ledger_updated).toBe(true);
      expect(result.receipt_number).toBe('RCPT-2026-0042');
    });

    it('handles idempotent replay gracefully when webhook or client sends duplicate verification', async () => {
      const mockDuplicateResponse = {
        success: true,
        status: 'committed',
        ledger_updated: true,
        message: 'Payment has already been authoritatively verified and settled.',
        transaction_id: 'tx_uuid_999',
        receipt_number: 'RCPT-2026-0042',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockDuplicateResponse,
      });

      const repeatPayload = {
        payment_order_id: 'po_uuid_001',
        razorpay_order_id: 'order_rzp_mock_123',
        razorpay_payment_id: 'pay_rzp_mock_456',
        razorpay_signature: 'hmac_sha256_mock_sig',
      };

      const result = await feesApi.verifyPayment(repeatPayload);

      expect(result.success).toBe(true);
      expect(result.status).toBe('committed');
      expect(result.receipt_number).toBe('RCPT-2026-0042');
    });

    it('fails verification and informs client when cryptographic signature mismatch occurs', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: 'SIGNATURE_MISMATCH',
            message: 'Cryptographic signature verification failed. Potential tampering detected.',
          },
        },
      });

      await expect(
        feesApi.verifyPayment({
          payment_order_id: 'po_uuid_001',
          razorpay_order_id: 'order_rzp_mock_123',
          razorpay_payment_id: 'pay_tampered_456',
          razorpay_signature: 'invalid_tampered_signature',
        }),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            error: 'SIGNATURE_MISMATCH',
          },
        },
      });
    });
  });

  describe('P5 — Payment History & Receipt Access', () => {
    it('retrieves official itemized receipt details by authorized transaction ID', async () => {
      const mockReceiptData = {
        receipt_number: 'RCPT-2026-0042',
        receipt_date: '2026-04-02T10:30:00.000Z',
        receipt_type: 'ORIGINAL',
        student: {
          student_id: 'std_001',
          first_name: 'Aarav',
          last_name: 'Sharma',
          admission_no: 'ADM-2026-0042',
        },
        transaction: {
          payment_transaction_id: 'tx_uuid_999',
          transaction_reference: 'rzp_pay_mock_456',
          amount: 20000,
          payment_method: 'online',
          status: 'success',
          created_at: '2026-04-02T10:30:00.000Z',
        },
        allocations: [
          {
            payment_allocation_id: 'alloc_001',
            allocated_amount: 20000,
            term_name: 'Term 2 (Jul 2026)',
            component_name: 'Tuition Fee',
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockReceiptData,
      });

      const result = await feesApi.getParentReceipt('tx_uuid_999');

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.FEES.RECEIPT_BY_TX('tx_uuid_999'));
      expect(result.receipt_number).toBe('RCPT-2026-0042');
      expect(result.student.admission_no).toBe('ADM-2026-0042');
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].allocated_amount).toBe(20000);
    });

    it('denies receipt retrieval when parent attempts to access an unauthorized child transaction', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            success: false,
            error: 'FORBIDDEN',
            message: 'You are not authorized to view receipts for this transaction.',
          },
        },
      });

      await expect(feesApi.getParentReceipt('tx_foreign_tenant_888')).rejects.toMatchObject({
        response: {
          status: 403,
          data: {
            error: 'FORBIDDEN',
          },
        },
      });
    });
  });
});
