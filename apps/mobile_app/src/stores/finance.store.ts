import { create } from 'zustand';
import {
  financeApi,
  ChildFeeLedger,
  CreateOrderResponse,
  VerifyPaymentPayload,
} from '../api/finance.api';

export interface StudentFinanceCache {
  ledger: ChildFeeLedger | null;
  cachedAt: number;
}

interface FinanceState {
  currentStudentId: string | null;
  ledger: ChildFeeLedger | null;
  isLoading: boolean;
  isCheckingOut: boolean;
  isError: boolean;
  errorMessage: string | null;
  activeOrder: CreateOrderResponse | null;
  paymentSuccessNotice: string | null;
  studentCache: Record<string, StudentFinanceCache>;

  fetchChildFees: (studentId: string, force?: boolean) => Promise<void>;
  initiatePayment: (
    studentId: string,
    dueId: string,
    amount: number,
  ) => Promise<CreateOrderResponse | null>;
  confirmPayment: (payload: VerifyPaymentPayload) => Promise<boolean>;
  resetCheckout: () => void;
  clear: () => void;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes in-memory cache

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentStudentId: null,
  ledger: null,
  isLoading: false,
  isCheckingOut: false,
  isError: false,
  errorMessage: null,
  activeOrder: null,
  paymentSuccessNotice: null,
  studentCache: {},

  fetchChildFees: async (studentId: string, force = false) => {
    if (!studentId) return;

    const { studentCache, currentStudentId } = get();
    const cached = studentCache[studentId];
    const isCacheFresh = cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;

    // Fast path: Return cached child fee ledger immediately if fresh and not forced
    if (!force && isCacheFresh) {
      set({
        currentStudentId: studentId,
        ledger: cached.ledger,
        isLoading: false,
        isError: false,
        errorMessage: null,
      });
      return;
    }

    // If switching student without fresh cache, clear previous student ledger to avoid stale flash
    if (currentStudentId !== studentId) {
      set({
        currentStudentId: studentId,
        ledger: cached?.ledger || null,
      });
    }

    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const data = await financeApi.getChildFeeDetails(studentId);
      const freshEntry: StudentFinanceCache = {
        ledger: data,
        cachedAt: Date.now(),
      };
      set((state) => ({
        currentStudentId: studentId,
        ledger: data,
        isLoading: false,
        studentCache: {
          ...state.studentCache,
          [studentId]: freshEntry,
        },
      }));
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
        // Invalidate cache and refresh fee details for current student
        const currentStudentId = get().ledger?.student_id;
        if (currentStudentId) {
          get().fetchChildFees(currentStudentId, true);
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
      currentStudentId: null,
      ledger: null,
      isLoading: false,
      isCheckingOut: false,
      isError: false,
      errorMessage: null,
      activeOrder: null,
      paymentSuccessNotice: null,
      studentCache: {},
    });
  },
}));
