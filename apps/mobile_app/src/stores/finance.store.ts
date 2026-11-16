import { create } from 'zustand';
import {
  financeApi,
  ChildFeeLedger,
  CreateOrderResponse,
  VerifyPaymentPayload,
} from '../api/finance.api';

interface FinanceState {
  ledger: ChildFeeLedger | null;
  isLoading: boolean;
  isCheckingOut: boolean;
  isError: boolean;
  errorMessage: string | null;
  activeOrder: CreateOrderResponse | null;
  paymentSuccessNotice: string | null;

  fetchChildFees: (studentId: string) => Promise<void>;
  initiatePayment: (
    studentId: string,
    dueId: string,
    amount: number,
  ) => Promise<CreateOrderResponse | null>;
  confirmPayment: (payload: VerifyPaymentPayload) => Promise<boolean>;
  resetCheckout: () => void;
  clear: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  ledger: null,
  isLoading: false,
  isCheckingOut: false,
  isError: false,
  errorMessage: null,
  activeOrder: null,
  paymentSuccessNotice: null,

  fetchChildFees: async (studentId: string) => {
    if (!studentId) return;
    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const data = await financeApi.getChildFeeDetails(studentId);
      set({ ledger: data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        isError: true,
        errorMessage: err?.message || 'Failed to fetch student fee statement',
      });
    }
  },

  initiatePayment: async (studentId: string, dueId: string, amount: number) => {
    set({ isCheckingOut: true, isError: false, errorMessage: null });
    try {
      const order = await financeApi.createPaymentOrder({
        studentId,
        studentChargeDueId: dueId,
        dueId,
        amount,
      });
      set({ activeOrder: order, isCheckingOut: false });
      return order;
    } catch (err: any) {
      set({
        isCheckingOut: false,
        isError: true,
        errorMessage: err?.message || 'Could not initiate payment session',
      });
      return null;
    }
  },

  confirmPayment: async (payload: VerifyPaymentPayload) => {
    set({ isCheckingOut: true, isError: false, errorMessage: null });
    try {
      const verification = await financeApi.verifyPayment(payload);
      if (verification && verification.success !== false) {
        set({
          isCheckingOut: false,
          activeOrder: null,
          paymentSuccessNotice: 'Fee installment payment confirmed successfully.',
        });
        // Refresh fee details if studentId is present
        const currentStudentId = get().ledger?.student_id;
        if (currentStudentId) {
          get().fetchChildFees(currentStudentId);
        }
        return true;
      }
      set({
        isCheckingOut: false,
        isError: true,
        errorMessage: verification?.message || 'Payment verification failed',
      });
      return false;
    } catch (err: any) {
      set({
        isCheckingOut: false,
        isError: true,
        errorMessage: err?.message || 'Payment confirmation failed',
      });
      return false;
    }
  },

  resetCheckout: () => {
    set({
      activeOrder: null,
      isCheckingOut: false,
      isError: false,
      errorMessage: null,
      paymentSuccessNotice: null,
    });
  },

  clear: () => {
    set({
      ledger: null,
      isLoading: false,
      isCheckingOut: false,
      isError: false,
      errorMessage: null,
      activeOrder: null,
      paymentSuccessNotice: null,
    });
  },
}));
