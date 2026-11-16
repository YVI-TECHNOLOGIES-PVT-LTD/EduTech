import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { FeeSummary, FeeReceipt, RecordPaymentRequest } from '../types/admission.types';

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
};
