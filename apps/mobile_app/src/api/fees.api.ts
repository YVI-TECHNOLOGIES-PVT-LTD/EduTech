import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  FeeSummary,
  FeeReceipt,
  RecordPaymentRequest,
  ParentChildrenFeesResponse,
  ChildFeeOverview,
} from '../types/admission.types';

export const feesApi = {
  /**
   * Get Fee Statement & Breakdown: GET /v1/applications/:id/fee
   */
  async getFeeSummary(applicationId: string): Promise<FeeSummary> {
    const res = await apiClient.get<any>(ENDPOINTS.FEES.SUMMARY(applicationId));
    return res?.data || res;
  },

  /**
   * Record Simulated Ledger Fee Payment: POST /v1/applications/:id/payment
   */
  async recordPayment(applicationId: string, payload: RecordPaymentRequest = {}): Promise<any> {
    const res = await apiClient.post<any>(ENDPOINTS.FEES.PAYMENT(applicationId), payload);
    return res?.data || res;
  },

  /**
   * Get Itemized Fee Receipt: GET /v1/applications/:id/receipt
   */
  async getReceipt(applicationId: string): Promise<FeeReceipt> {
    const res = await apiClient.get<any>(ENDPOINTS.FEES.RECEIPT(applicationId));
    return res?.receipt || res?.data || res;
  },

  /**
   * Get Parent's Enrolled Children & Fee Summary: GET /v1/fees/my
   */
  async getMyChildrenFees(): Promise<ParentChildrenFeesResponse> {
    const res = await apiClient.get<any>(ENDPOINTS.FEES.MY_CHILDREN);
    return res;
  },

  /**
   * Get Specific Child Fee Details: GET /v1/fees/my/children/:studentId
   */
  async getChildFeeDetails(studentId: string): Promise<ChildFeeOverview> {
    const res = await apiClient.get<any>(ENDPOINTS.FEES.CHILD_DETAILS(studentId));
    return res?.data || res;
  },

  /**
   * Phase 3: Create Server-Authoritative Parent Payment Order
   * POST /v1/fees/my/payments/create-order
   */
  async createPaymentOrder(payload: {
    student_id?: string;
    studentId?: string;
    student_charge_due_id?: string;
    studentChargeDueId?: string;
    dueId?: string;
    amount?: number;
    payment_method?: string;
    paymentMethod?: string;
    notes?: any;
  }): Promise<any> {
    const body = {
      ...payload,
      studentId: payload.studentId || payload.student_id,
      student_id: payload.student_id || payload.studentId,
      studentChargeDueId: payload.studentChargeDueId || payload.student_charge_due_id,
      student_charge_due_id: payload.student_charge_due_id || payload.studentChargeDueId,
      paymentMethod: payload.paymentMethod || payload.payment_method || 'card',
      payment_method: payload.payment_method || payload.paymentMethod || 'card',
    };
    const res = await apiClient.post<any>(ENDPOINTS.FEES.CREATE_PAYMENT_ORDER, body);
    return res?.data || res;
  },

  /**
   * Phase 3: Authoritatively Verify Gateway Payment & Commit Ledger Allocation
   * POST /v1/fees/my/payments/verify
   */
  async verifyPayment(payload: {
    payment_order_id?: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<any> {
    const res = await apiClient.post<any>(ENDPOINTS.FEES.VERIFY_PAYMENT, payload);
    return res?.data || res;
  },

  /**
   * Phase 3: Retrieve Authorized Parent Payment Receipt
   * GET /v1/fees/my/receipts/:transactionId
   */
  async getParentReceipt(transactionId: string): Promise<any> {
    const res = await apiClient.get<any>(ENDPOINTS.FEES.RECEIPT_BY_TX(transactionId));
    return res?.data || res;
  },
};
