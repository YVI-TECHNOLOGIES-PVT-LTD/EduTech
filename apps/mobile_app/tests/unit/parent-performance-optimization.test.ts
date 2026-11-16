import { useAcademicsStore } from '../../src/stores/academics.store';
import { useFinanceStore } from '../../src/stores/finance.store';
import { useChildStore } from '../../src/stores/child.store';
import { academicsApi } from '../../src/api/academics.api';
import { financeApi } from '../../src/api/finance.api';
import { apiClient } from '../../src/api/client';

jest.mock('../../src/api/academics.api');
jest.mock('../../src/api/finance.api');
jest.mock('../../src/api/client');

describe('Parent App Performance & Demand-Driven Optimization Test Suite', () => {
  beforeEach(() => {
    useAcademicsStore.getState().clear();
    useFinanceStore.getState().clear();
    useChildStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('1. Academics In-Memory Caching & Request Deduplication', () => {
    const mockAttendance = {
      totalDays: 20,
      presentDays: 18,
      absentDays: 2,
      lateDays: 0,
      percentage: 90,
      records: [],
    };
    const mockTimetable = [
      {
        day: 'Monday' as const,
        periods: [
          {
            periodNumber: 1,
            startTime: '08:30 AM',
            endTime: '09:15 AM',
            subject: 'English',
            teacherName: 'Mrs. Davis',
            room: 'Room 202',
          },
        ],
      },
    ];

    it('should deduplicate repeat calls for same student within TTL', async () => {
      (academicsApi.getAttendance as jest.Mock).mockResolvedValue(mockAttendance);
      (academicsApi.getTimetable as jest.Mock).mockResolvedValue(mockTimetable);
      (academicsApi.getHomework as jest.Mock).mockResolvedValue([]);
      (academicsApi.getExams as jest.Mock).mockResolvedValue([]);
      (academicsApi.getReportCard as jest.Mock).mockResolvedValue(null);

      // First call: executes API calls and populates cache
      await useAcademicsStore.getState().fetchStudentAcademics('student-A');
      expect(academicsApi.getAttendance).toHaveBeenCalledTimes(1);
      expect(academicsApi.getTimetable).toHaveBeenCalledTimes(1);

      // Second call within 2 minutes: should use cache without hit
      await useAcademicsStore.getState().fetchStudentAcademics('student-A');
      expect(academicsApi.getAttendance).toHaveBeenCalledTimes(1);
      expect(academicsApi.getTimetable).toHaveBeenCalledTimes(1);

      // Forced call (pull to refresh): should bypass cache and fetch again
      await useAcademicsStore.getState().fetchStudentAcademics('student-A', true);
      expect(academicsApi.getAttendance).toHaveBeenCalledTimes(2);
      expect(academicsApi.getTimetable).toHaveBeenCalledTimes(2);
    });

    it('should isolate cache per child on multi-child switching', async () => {
      (academicsApi.getAttendance as jest.Mock)
        .mockResolvedValueOnce({ ...mockAttendance, percentage: 92 })
        .mockResolvedValueOnce({ ...mockAttendance, percentage: 84 });
      (academicsApi.getTimetable as jest.Mock).mockResolvedValue(mockTimetable);
      (academicsApi.getHomework as jest.Mock).mockResolvedValue([]);
      (academicsApi.getExams as jest.Mock).mockResolvedValue([]);
      (academicsApi.getReportCard as jest.Mock).mockResolvedValue(null);

      // Fetch Child A
      await useAcademicsStore.getState().fetchStudentAcademics('child-A');
      expect(useAcademicsStore.getState().attendance?.percentage).toBe(92);

      // Switch to Child B
      await useAcademicsStore.getState().fetchStudentAcademics('child-B');
      expect(useAcademicsStore.getState().attendance?.percentage).toBe(84);

      // Switch back to Child A (cached, zero new network hits)
      await useAcademicsStore.getState().fetchStudentAcademics('child-A');
      expect(useAcademicsStore.getState().attendance?.percentage).toBe(92);
      expect(academicsApi.getAttendance).toHaveBeenCalledTimes(2); // Only 2 calls total, not 3!
    });
  });

  describe('2. Finance In-Memory Caching & Cache Invalidation', () => {
    const mockLedger: any = {
      student_id: 'student-A',
      admission_no: 'ADM-001',
      summary: {
        total_assessed: 40000,
        total_paid: 20000,
        outstanding_balance: 20000,
        overdue_amount: 0,
        status: 'partially_paid',
      },
      dues: [],
      components: [],
      payment_history: [],
    };

    it('should reuse cached fee ledger for repeat requests and re-fetch on force', async () => {
      (financeApi.getChildFeeDetails as jest.Mock).mockResolvedValue(mockLedger);

      // First fetch
      await useFinanceStore.getState().fetchChildFees('student-A');
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledTimes(1);

      // Second fetch within TTL (cached)
      await useFinanceStore.getState().fetchChildFees('student-A');
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledTimes(1);

      // Pull-to-refresh force
      await useFinanceStore.getState().fetchChildFees('student-A', true);
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache and reload fresh ledger after successful payment confirmation', async () => {
      (financeApi.getChildFeeDetails as jest.Mock).mockResolvedValue(mockLedger);
      (financeApi.verifyPayment as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Verified',
      });

      await useFinanceStore.getState().fetchChildFees('student-A');
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledTimes(1);

      // Confirm payment
      await useFinanceStore.getState().confirmPayment({
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'sig_1',
        studentChargeDueId: 'due_1',
        dueId: 'due_1',
      });

      // verifyPayment success should trigger force re-fetch
      expect(financeApi.getChildFeeDetails).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Child Store Sync Debounce & Lifecycle Caching', () => {
    it('should not fire repeat network sync within 60s when children are already loaded', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        lifecycle: { accountType: 'POST_ADMISSION' },
        children: [
          {
            studentId: 'stu-1',
            lifecycleType: 'POST_ADMISSION',
            studentName: 'Aarav',
            gradeLevel: 'Grade 3',
            isPrimaryContact: true,
          },
        ],
      });

      // First sync
      await useChildStore.getState().syncChildren('parent-1');
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(useChildStore.getState().children).toHaveLength(1);

      // Second sync immediately after (debounced)
      await useChildStore.getState().syncChildren('parent-1');
      expect(apiClient.get).toHaveBeenCalledTimes(1); // Still 1

      // Forced sync (pull to refresh)
      await useChildStore.getState().syncChildren('parent-1', true);
      expect(apiClient.get).toHaveBeenCalledTimes(2); // Now 2
    });
  });
});
