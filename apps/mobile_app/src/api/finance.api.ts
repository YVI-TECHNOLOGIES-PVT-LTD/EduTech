import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export interface FeeSummaryData {
  total_assessed: number;
  total_paid: number;
  outstanding_balance: number;
  overdue_amount: number;
  status: 'fully_paid' | 'partially_paid' | 'pending' | 'overdue' | 'no_fees_assigned';
}

export interface FeeComponentItem {
  component_name: string;
  component_code: string;
  amount: number;
  description: string | null;
}

export interface FeeDueItem {
  due_id: string;
  charge_id?: string;
  charge_description: string;
  component_name?: string;
  term_name?: string;
  amount_due: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  is_overdue: boolean;
  status: string;
}

export interface PaymentTransactionItem {
  transaction_id: string;
  order_id: string | null;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  transaction_reference: string | null;
  created_at: string;
}

export interface ChildFeeLedger {
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  grade_name: string | null;
  academic_year_name: string | null;
  section_name: string | null;
  fee_structure_name: string | null;
  installment_plan_name: string | null;
  summary: FeeSummaryData;
  components: FeeComponentItem[];
  dues: FeeDueItem[];
  payment_history: PaymentTransactionItem[];
}

export interface RazorpayConfigResponse {
  key_id: string;
  is_configured: boolean;
  is_webhook_configured: boolean;
}

export interface CreateOrderPayload {
  studentId: string;
  studentChargeDueId?: string;
  dueId?: string;
  amount?: number;
  currency?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  amount: number;
  currency: string;
  key_id?: string;
  key?: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  studentChargeDueId?: string;
  dueId?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  transaction_id?: string;
  message?: string;
}

export const financeApi = {
  /**
   * Fetch fee summary for all children of the authenticated parent
   * GET /v1/fees/my
   */
  async getMyChildrenFees(): Promise<ChildFeeLedger[]> {
    const res = await apiClient.get<any>(ENDPOINTS.FINANCE.MY_FEES);
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return [];
  },

  /**
   * Fetch detailed fee structure, components, dues and ledger for a specific student
   * GET /v1/fees/my/children/:studentId
   */
  async getChildFeeDetails(studentId: string): Promise<ChildFeeLedger | null> {
    const res = await apiClient.get<any>(ENDPOINTS.FINANCE.CHILD_FEES(studentId));
    return res?.data || res || null;
  },

  /**
   * Fetch public Razorpay key ID configuration
   * GET /razorpay/config
   */
  async getRazorpayConfig(): Promise<RazorpayConfigResponse> {
    const res = await apiClient.get<any>(ENDPOINTS.FINANCE.RAZORPAY_CONFIG);
    return res?.data || res;
  },

  /**
   * Initiate Razorpay payment order
   * POST /create-order
   */
  async createPaymentOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const res = await apiClient.post<any>(ENDPOINTS.FINANCE.CREATE_ORDER, payload);
    return res?.data || res;
  },

  /**
   * Verify Razorpay payment signature & commit ledger transaction
   * POST /verify-payment
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    const res = await apiClient.post<any>(ENDPOINTS.FINANCE.VERIFY_PAYMENT, payload);
    return res?.data || res;
  },

  /**
   * Fetch transaction receipt
   * GET /v1/fees/receipts/:id
   */
  async getReceipt(transactionId: string): Promise<any> {
    const res = await apiClient.get<any>(ENDPOINTS.FINANCE.RECEIPT_BY_ID(transactionId));
    return res?.data || res;
  },
};
