import { useChildStore } from '../../src/stores/child.store';
import { EnrolledChild, ApplicantChild } from '../../src/types/child.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Wave 1 — Universal Child Model & Store Test Suite', () => {
  const mockEnrolledChild1: EnrolledChild = {
    kind: 'enrolled',
    id: 'stu_101',
    studentId: 'stu_101',
    admissionNumber: 'ADM-2024-001',
    fullName: 'Aarav Sharma',
    firstName: 'Aarav',
    lastName: 'Sharma',
    gradeLevel: 'Grade 4',
    section: 'B',
    rollNumber: '14',
    academicYear: '2026-2027',
    status: 'active',
    relationship: 'Father',
    isPrimaryContact: true,
    hasPendingFees: true,
    pendingFeeAmount: 25000,
  };

  const mockEnrolledChild2: EnrolledChild = {
    kind: 'enrolled',
    id: 'stu_102',
    studentId: 'stu_102',
    admissionNumber: 'ADM-2022-088',
    fullName: 'Riya Sharma',
    firstName: 'Riya',
    lastName: 'Sharma',
    gradeLevel: 'Grade 8',
    section: 'A',
    rollNumber: '03',
    academicYear: '2026-2027',
    status: 'active',
    relationship: 'Father',
    isPrimaryContact: true,
    hasPendingFees: false,
  };

  const mockApplicantChild: ApplicantChild = {
    kind: 'applicant',
    id: 'app_2026_099',
    applicationId: 'app_2026_099',
    applicationNumber: 'APP-2026-099',
    fullName: 'Kabir Sharma',
    firstName: 'Kabir',
    lastName: 'Sharma',
    applyingGrade: 'Kindergarten',
    academicYear: '2026-2027',
    stage: 'documents_pending',
    progressPercentage: 40,
    actionRequiredNotice: 'Upload Birth Certificate',
    relationship: 'Father',
    isPrimaryContact: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useChildStore.getState().reset();
  });

  describe('1. Child Store Initialization & Priority Auto-Selection', () => {
    it('should initialize with empty state and null selection', () => {
      const state = useChildStore.getState();
      expect(state.children).toEqual([]);
      expect(state.selectedChildId).toBeNull();
      expect(state.getSelectedChild()).toBeNull();
    });

    it('should prioritize enrolled student when setting mixed children', () => {
      useChildStore.getState().setChildren([mockApplicantChild, mockEnrolledChild1]);

      const state = useChildStore.getState();
      expect(state.children.length).toBe(2);
      expect(state.selectedChildId).toBe(mockEnrolledChild1.id);
      expect(state.getSelectedChild()?.kind).toBe('enrolled');
      expect(state.getSelectedChild()?.fullName).toBe('Aarav Sharma');
    });

    it('should select first applicant when no enrolled students exist', () => {
      useChildStore.getState().setChildren([mockApplicantChild]);

      const state = useChildStore.getState();
      expect(state.children.length).toBe(1);
      expect(state.selectedChildId).toBe(mockApplicantChild.id);
      expect(state.getSelectedChild()?.kind).toBe('applicant');
      expect(state.getSelectedChild()?.fullName).toBe('Kabir Sharma');
    });
  });

  describe('2. Multi-Child Switching & Validation', () => {
    beforeEach(() => {
      useChildStore
        .getState()
        .setChildren([mockEnrolledChild1, mockEnrolledChild2, mockApplicantChild]);
    });

    it('should switch between enrolled children successfully', () => {
      expect(useChildStore.getState().selectedChildId).toBe(mockEnrolledChild1.id);

      const success = useChildStore.getState().selectChild(mockEnrolledChild2.id);
      expect(success).toBe(true);

      const active = useChildStore.getState().getSelectedChild();
      expect(active?.id).toBe(mockEnrolledChild2.id);
      expect(active?.fullName).toBe('Riya Sharma');
    });

    it('should switch between enrolled child and applicant child successfully', () => {
      const success = useChildStore.getState().selectChild(mockApplicantChild.id);
      expect(success).toBe(true);

      const active = useChildStore.getState().getSelectedChild();
      expect(active?.id).toBe(mockApplicantChild.id);
      expect(active?.kind).toBe('applicant');
    });

    it('should REJECT unauthorized child selection attempt', () => {
      const unauthorizedId = 'unauthorized_student_999';
      const success = useChildStore.getState().selectChild(unauthorizedId);

      expect(success).toBe(false);
      // Selected child must remain unchanged
      expect(useChildStore.getState().selectedChildId).toBe(mockEnrolledChild1.id);
    });

    it('should persist selected child ID in AsyncStorage on switch', () => {
      useChildStore.getState().selectChild(mockEnrolledChild2.id);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'edutrack_active_child_id',
        mockEnrolledChild2.id,
      );
    });
  });

  describe('3. Logout Cleanup & State Isolation', () => {
    it('should clear all children, selection, and storage on reset', () => {
      useChildStore.getState().setChildren([mockEnrolledChild1, mockApplicantChild]);
      expect(useChildStore.getState().children.length).toBe(2);

      useChildStore.getState().reset();

      const state = useChildStore.getState();
      expect(state.children).toEqual([]);
      expect(state.selectedChildId).toBeNull();
      expect(state.getSelectedChild()).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('edutrack_active_child_id');
    });
  });
});
