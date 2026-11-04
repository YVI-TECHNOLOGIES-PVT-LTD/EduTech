import { useFinanceStore } from '../../src/stores/finance.store';
import { financeApi, ChildFeeLedger } from '../../src/api/finance.api';

jest.mock('../../src/api/finance.api');

describe('Finance & Payment Module Test Suite', () => {
  beforeEach(() => {
    useFinanceStore.getState().clear();
    jest.clearAllMocks();
  });

  const mockLedger: ChildFeeLedger = {
    student_id: 'student-uuid-45',
    admission_no: 'ADM-2026-0045',
    first_name: 'Ananya',
    last_name: 'Sharma',
    full_name: 'Ananya Sharma',
    grade_name: 'Grade 5',
    academic_year_name: '2026-2027',
    section_name: 'A',
    fee_structure_name: 'Standard CBSE Annual',
    installment_plan_name: 'Quarterly',
    summary: {
      total_assessed: 50000,
      total_paid: 25000,
      outstanding_balance: 25000,
      overdue_amount: 0,
      status: 'partially_paid',
    },
    components: [
      {
        component_name: 'Tuition Fee',
        component_code: 'TUI',
        amount: 40000,
        description: 'Annual tuition',
      },
      {
        component_name: 'Computer Lab Fee',
        component_code: 'LAB',
        amount: 10000,
        description: 'Lab facility',
      },
    ],
    dues: [
      {
        due_id: 'due-q1',
        charge_description: 'Quarter 1 Tuition',
        amount_due: 25000,
        paid_amount: 25000,
        outstanding_amount: 0,
        due_date: '2026-06-30',
        is_overdue: false,
        status: 'PAID',
      },
      {
        due_id: 'due-q2',
        charge_description: 'Quarter 2 Tuition',
        amount_due: 25000,
        paid_amount: 0,
        outstanding_amount: 25000,
        due_date: '2026-11-30',
        is_overdue: false,
        status: 'UNPAID',
      },
    ],
    payment_history: [
      {
        transaction_id: 'tx-001',
        order_id: 'order_1234',
        payment_method: 'upi',
        amount: 25000,
        currency: 'INR',
        status: 'SUCCESS',
        transaction_reference: 'UPI-REF-0987',
        created_at: '2026-06-25T10:00:00Z',
      },
    ],
  };

  describe('1. Fee Statement Hydration', () => {
    it('should initialize with empty fee ledger state', () => {
      const state = useFinanceStore.getState();
      expect(state.ledger).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isCheckingOut).toBe(false);
    });

    it('should fetch and populate child fee ledger from real finance API', async () => {
      (financeApi.getChildFeeDetails as jest.Mock).mockResolvedValue(mockLedger);

      await useFinanceStore.getState().fetchChildFees('student-uuid-45');

      const state = useFinanceStore.getState();
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledWith('student-uuid-45');
      expect(state.ledger).toEqual(mockLedger);
      expect(state.ledger?.summary.outstanding_balance).toBe(25000);
      expect(state.ledger?.dues).toHaveLength(2);
      expect(state.isLoading).toBe(false);
    });

    it('should handle fee fetch errors gracefully', async () => {
      (financeApi.getChildFeeDetails as jest.Mock).mockRejectedValue(
        new Error('Unauthorized fee access'),
      );

      await useFinanceStore.getState().fetchChildFees('student-uuid-45');

      const state = useFinanceStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Unauthorized fee access');
    });
  });

  describe('2. Razorpay Payment Checkout Flow', () => {
    it('should initiate payment order successfully', async () => {
      const mockOrder = {
        success: true,
        order_id: 'order_rzp_555',
        amount: 2500000,
        currency: 'INR',
        key_id: 'rzp_test_key',
      };
      (financeApi.createPaymentOrder as jest.Mock).mockResolvedValue(mockOrder);

      const order = await useFinanceStore
        .getState()
        .initiatePayment('student-uuid-45', 'due-q2', 25000);

      expect(financeApi.createPaymentOrder).toHaveBeenCalledWith({
        studentId: 'student-uuid-45',
        studentChargeDueId: 'due-q2',
        dueId: 'due-q2',
        amount: 25000,
      });
      expect(order).toEqual(mockOrder);
      expect(useFinanceStore.getState().activeOrder).toEqual(mockOrder);
      expect(useFinanceStore.getState().isCheckingOut).toBe(false);
    });

    it('should confirm payment with signature verification and refresh ledger', async () => {
      useFinanceStore.setState({ ledger: mockLedger });
      (financeApi.verifyPayment as jest.Mock).mockResolvedValue({
        success: true,
        transaction_id: 'tx-new-999',
      });
      (financeApi.getChildFeeDetails as jest.Mock).mockResolvedValue({
        ...mockLedger,
        summary: {
          ...mockLedger.summary,
          outstanding_balance: 0,
          total_paid: 50000,
          status: 'fully_paid',
        },
      });

      const confirmed = await useFinanceStore.getState().confirmPayment({
        razorpay_order_id: 'order_rzp_555',
        razorpay_payment_id: 'pay_rzp_888',
        razorpay_signature: 'sig_valid_hex',
        studentChargeDueId: 'due-q2',
        dueId: 'due-q2',
      });

      expect(confirmed).toBe(true);
      expect(useFinanceStore.getState().paymentSuccessNotice).toBeDefined();
      expect(useFinanceStore.getState().activeOrder).toBeNull();
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledWith('student-uuid-45');
    });

    it('should handle failed payment verification correctly', async () => {
      (financeApi.verifyPayment as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Signature mismatch detected',
      });

      const confirmed = await useFinanceStore.getState().confirmPayment({
        razorpay_order_id: 'order_rzp_555',
        razorpay_payment_id: 'pay_rzp_888',
        razorpay_signature: 'sig_invalid',
      });

      expect(confirmed).toBe(false);
      expect(useFinanceStore.getState().isError).toBe(true);
      expect(useFinanceStore.getState().errorMessage).toBe('Signature mismatch detected');
    });
  });

  describe('3. Checkout Reset & Store Purge', () => {
    it('should clear active order and notices on resetCheckout()', () => {
      useFinanceStore.setState({
        activeOrder: { success: true, order_id: 'order_1', amount: 100, currency: 'INR' },
        paymentSuccessNotice: 'Done',
      });

      useFinanceStore.getState().resetCheckout();

      expect(useFinanceStore.getState().activeOrder).toBeNull();
      expect(useFinanceStore.getState().paymentSuccessNotice).toBeNull();
    });

    it('should purge all financial records on clear()', () => {
      useFinanceStore.setState({
        ledger: mockLedger,
        isError: true,
      });

      useFinanceStore.getState().clear();

      expect(useFinanceStore.getState().ledger).toBeNull();
      expect(useFinanceStore.getState().isError).toBe(false);
    });
  });
});
