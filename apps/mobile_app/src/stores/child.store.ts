import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnifiedChild, EnrolledChild, ApplicantChild } from '../types/child.types';
import { apiClient } from '../api/client';
import { applicationsApi } from '../api/applications.api';
import { financeApi } from '../api/finance.api';

const STORAGE_KEY = 'edutrack_active_child_id';

export type AccountLifecycleType = 'NO_APPLICATION' | 'PRE_ADMISSION' | 'POST_ADMISSION' | 'HYBRID';

interface ChildStoreState {
  children: UnifiedChild[];
  selectedChildId: string | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  accountType: AccountLifecycleType | null;
  lifecycleData: any | null;

  setChildren: (children: UnifiedChild[]) => void;
  selectChild: (id: string) => boolean;
  getSelectedChild: () => UnifiedChild | null;
  syncChildren: (parentId?: string) => Promise<void>;
  hydrateStoredSelection: () => Promise<void>;
  reset: () => void;
}

export const useChildStore = create<ChildStoreState>((set, get) => ({
  children: [],
  selectedChildId: null,
  isLoading: false,
  isError: false,
  errorMessage: null,
  accountType: null,
  lifecycleData: null,

  setChildren: (children: UnifiedChild[]) => {
    const currentSelectedId = get().selectedChildId;
    let newSelectedId: string | null = null;

    if (currentSelectedId && children.some((c) => c.id === currentSelectedId)) {
      newSelectedId = currentSelectedId;
    } else {
      // Priority 1: First enrolled student
      const firstEnrolled = children.find((c) => c.kind === 'enrolled');
      if (firstEnrolled) {
        newSelectedId = firstEnrolled.id;
      } else if (children.length > 0) {
        // Priority 2: First applicant
        newSelectedId = children[0].id;
      }
    }

    // Determine accountType from children list if not already set from backend
    let derivedAccountType: AccountLifecycleType | null = get().accountType;
    if (children.length === 0) {
      derivedAccountType = 'NO_APPLICATION';
    } else {
      const hasEnrolled = children.some((c) => c.kind === 'enrolled');
      const hasApplicant = children.some((c) => c.kind === 'applicant');
      if (hasEnrolled && hasApplicant) {
        derivedAccountType = 'HYBRID';
      } else if (hasEnrolled) {
        derivedAccountType = 'POST_ADMISSION';
      } else if (hasApplicant) {
        derivedAccountType = 'PRE_ADMISSION';
      }
    }

    set({
      children,
      selectedChildId: newSelectedId,
      accountType: derivedAccountType,
      isError: false,
      errorMessage: null,
    });

    if (newSelectedId) {
      AsyncStorage.setItem(STORAGE_KEY, newSelectedId).catch(() => {});
    }
  },

  selectChild: (id: string): boolean => {
    const { children } = get();
    const targetChild = children.find((c) => c.id === id);

    // Strict Authorization Guard: Reject client ID injection not present in authorized children
    if (!targetChild) {
      return false;
    }

    set({ selectedChildId: id });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    return true;
  },

  getSelectedChild: (): UnifiedChild | null => {
    const { children, selectedChildId } = get();
    if (!selectedChildId) return null;
    return children.find((c) => c.id === selectedChildId) || null;
  },

  hydrateStoredSelection: async () => {
    try {
      const storedId = await AsyncStorage.getItem(STORAGE_KEY);
      const { children } = get();
      if (storedId && children.some((c) => c.id === storedId)) {
        set({ selectedChildId: storedId });
      }
    } catch {
      // Non-blocking fallback
    }
  },

  syncChildren: async (parentId?: string) => {
    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const unifiedList: UnifiedChild[] = [];
      let lifecycleLoaded = false;

      // 1. Authoritative Backend Lifecycle Service (Rule 1 & Rule 2 Source of Truth)
      try {
        const lifecycleRes = await apiClient.get<any>('/v1/parents/lifecycle');
        if (lifecycleRes && Array.isArray(lifecycleRes.children)) {
          lifecycleLoaded = true;
          set({
            accountType: lifecycleRes.lifecycle?.accountType || null,
            lifecycleData: lifecycleRes,
          });

          lifecycleRes.children.forEach((c: any) => {
            if (c.lifecycleType === 'POST_ADMISSION') {
              const enrolledChild: EnrolledChild = {
                kind: 'enrolled',
                id: c.studentId || c.id,
                studentId: c.studentId || c.id,
                admissionNumber: c.admissionNumber || 'ADM-PENDING',
                fullName:
                  c.studentName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Student',
                firstName: c.firstName || 'Student',
                lastName: c.lastName || '',
                gradeLevel: c.gradeLevel || 'Class',
                section: c.section || 'A',
                rollNumber: c.rollNumber || undefined,
                academicYear: c.academicYear || '2026-2027',
                status: c.enrollmentStatus || 'active',
                relationship: c.relationship || 'Guardian',
                isPrimaryContact: Boolean(c.isPrimaryContact),
                avatarUrl: c.avatarUrl || null,
                attendanceToday: {
                  status: 'present',
                  timestamp: '08:15 AM',
                },
              };
              unifiedList.push(enrolledChild);
            } else {
              const applicantChild: ApplicantChild = {
                kind: 'applicant',
                id: c.applicationId || c.id,
                applicationId: c.applicationId || c.id,
                applicationNumber:
                  c.applicationNumber || `APP-${(c.applicationId || c.id).slice(0, 6)}`,
                fullName:
                  c.studentName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Applicant',
                firstName: c.firstName || 'Applicant',
                lastName: c.lastName || '',
                applyingGrade: c.gradeLevel || 'Kindergarten',
                academicYear: c.academicYear || '2026-2027',
                stage: c.applicationStatus || 'submitted',
                progressPercentage: getFunnelProgress(c.applicationStatus || 'submitted'),
                actionRequiredNotice: getActionNotice(c.applicationStatus || 'submitted'),
                relationship: c.relationship || 'Parent',
                isPrimaryContact: Boolean(c.isPrimaryContact),
                avatarUrl: null,
              };
              unifiedList.push(applicantChild);
            }
          });
        }
      } catch (lifecycleErr) {
        // Non-fatal: fallback to legacy endpoints below (e.g. for mock offline test suites)
      }

      // 2. Legacy / Fallback resolution if lifecycle service is unavailable
      if (!lifecycleLoaded) {
        if (parentId) {
          try {
            const studentsRes = await apiClient.get<any>(`/v1/parents/${parentId}/students`);
            const studentItems = Array.isArray(studentsRes)
              ? studentsRes
              : Array.isArray(studentsRes?.data)
                ? studentsRes.data
                : [];

            studentItems.forEach((s: any) => {
              const studentId = s.student_id || s.id;
              if (!studentId) return;

              // Authoritative rule: only treat as enrolled if s.is_enrolled !== false and lifecycle_type !== 'PRE_ADMISSION'
              const isEnrolled = s.is_enrolled !== false && s.lifecycle_type !== 'PRE_ADMISSION';
              if (isEnrolled) {
                const enrolledChild: EnrolledChild = {
                  kind: 'enrolled',
                  id: studentId,
                  studentId,
                  admissionNumber: s.admission_no || s.admissionNumber || 'ADM-PENDING',
                  fullName:
                    s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student',
                  firstName: s.first_name || s.student_first_name || 'Student',
                  lastName: s.last_name || s.student_last_name || '',
                  gradeLevel: s.current_grade_level || s.grade_level || s.class_name || 'Class',
                  section: s.section_name || s.section || 'A',
                  rollNumber: s.roll_no || s.rollNumber,
                  academicYear: s.academic_year || '2026-2027',
                  status: s.status || 'active',
                  relationship: s.relationship || 'Guardian',
                  isPrimaryContact: Boolean(s.is_primary_contact),
                  avatarUrl: s.avatar_url || s.avatarUrl || null,
                  hasPendingFees: Boolean(s.has_pending_fees),
                  attendanceToday: s.attendance_today || {
                    status: 'present',
                    timestamp: '08:15 AM',
                  },
                };
                unifiedList.push(enrolledChild);
              }
            });
          } catch {
            // Graceful degradation
          }
        }

        // Fetch applications
        try {
          const appItems = await applicationsApi.listMine();

          appItems.forEach((app: any) => {
            const appId = app.application_id || app.id;
            if (!appId) return;

            const studentName =
              app.student_name ||
              (app.student_first_name
                ? `${app.student_first_name} ${app.student_last_name || ''}`.trim()
                : app.leads
                  ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                  : app.lead
                    ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                    : 'Applicant') ||
              'Applicant';

            const firstName = app.student_first_name || studentName.split(' ')[0] || 'Applicant';
            const lastName =
              app.student_last_name || studentName.split(' ').slice(1).join(' ') || '';

            const applicantChild: ApplicantChild = {
              kind: 'applicant',
              id: appId,
              applicationId: appId,
              applicationNumber: app.application_number || `APP-${appId.slice(0, 6)}`,
              fullName: studentName,
              firstName,
              lastName,
              applyingGrade: app.grade_applying || app.grade || 'Kindergarten',
              academicYear: app.academic_year || '2026-2027',
              stage: app.status || 'submitted',
              progressPercentage: getFunnelProgress(app.status),
              actionRequiredNotice: getActionNotice(app.status),
              relationship: 'Parent',
              isPrimaryContact: true,
              avatarUrl: null,
            };
            unifiedList.push(applicantChild);
          });
        } catch {
          // Graceful degradation
        }
      }

      // 3. Fetch & Enrich Enrolled Students with Real Finance Data
      try {
        const feeChildren = await financeApi.getMyChildrenFees();
        if (Array.isArray(feeChildren)) {
          feeChildren.forEach((fc: any) => {
            const studentId = fc.student_id;
            if (!studentId) return;

            const existingIndex = unifiedList.findIndex(
              (c) => c.kind === 'enrolled' && (c as EnrolledChild).studentId === studentId,
            );

            const hasPending = (fc.summary?.outstanding_balance || 0) > 0;
            const pendingAmount = fc.summary?.outstanding_balance || 0;

            if (existingIndex >= 0) {
              const existing = unifiedList[existingIndex] as EnrolledChild;
              unifiedList[existingIndex] = {
                ...existing,
                admissionNumber: fc.admission_no || existing.admissionNumber,
                gradeLevel: fc.grade_name || existing.gradeLevel,
                section: fc.section_name || existing.section,
                academicYear: fc.academic_year_name || existing.academicYear,
                hasPendingFees: hasPending,
                pendingFeeAmount: pendingAmount,
              };
            }
          });
        }
      } catch {
        // Non-blocking fallback
      }

      get().setChildren(unifiedList);
      await get().hydrateStoredSelection();
    } catch (err: any) {
      set({
        isError: true,
        errorMessage: err?.message || 'Failed to sync child relationships.',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    set({
      children: [],
      selectedChildId: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
      accountType: null,
      lifecycleData: null,
    });
  },
}));

function getFunnelProgress(status?: string): number {
  switch (status) {
    case 'draft':
      return 10;
    case 'submitted':
      return 25;
    case 'documents_pending':
      return 40;
    case 'under_review':
      return 55;
    case 'assessment_scheduled':
      return 70;
    case 'fee_pending':
      return 85;
    case 'decision_ready':
    case 'offer_accepted':
      return 100;
    default:
      return 30;
  }
}

function getActionNotice(status?: string): string | undefined {
  switch (status) {
    case 'documents_pending':
      return 'Upload verification documents to proceed';
    case 'fee_pending':
      return 'Application processing fee payment pending';
    case 'assessment_scheduled':
      return 'Entrance assessment booked';
    case 'decision_ready':
      return 'Offer Letter ready for review';
    default:
      return undefined;
  }
}
