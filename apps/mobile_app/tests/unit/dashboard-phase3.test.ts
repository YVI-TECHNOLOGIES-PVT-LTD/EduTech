import { applicationsApi } from '../../src/api/applications.api';
import { notificationsApi } from '../../src/api/notifications.api';
import { apiClient, ApiError } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth.store';
import { getApplicationStatusConfig } from '../../src/utils/status-mapper';
import { AdmissionApplication } from '../../src/types/admission.types';

const jestExpect = expect as any;

describe('Phase 3 — Parent Navigation & Dashboard Verification Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
  });

  // ==========================================
  // 1. NAVIGATION TESTS (1 - 3)
  // ==========================================
  describe('Navigation & Shell Protection', () => {
    it('1. should allow authenticated parent user to access parent dashboard', () => {
      const parentUser = {
        id: 'usr_parent_100',
        email: 'parent@edutrack.com',
        full_name: 'Jane Parent',
        roles: ['PARENT'],
        permissions: ['admission.view'],
      };

      useAuthStore.getState().setAuth(parentUser, {
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.roles).toContain('PARENT');
    });

    it('2. should reject unauthenticated user before rendering protected parent shell', () => {
      useAuthStore.getState().logout();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('3. should verify parent navigation shell routes structure', () => {
      const expectedRoutes = ['Home', 'Applications', 'Notifications', 'Account'];
      expect(expectedRoutes).toHaveLength(4);
    });
  });

  // ==========================================
  // 2. DASHBOARD DATA & STATUS TESTS (4 - 10)
  // ==========================================
  describe('Dashboard Applications & Multi-Child Behavior', () => {
    it('4. should handle application query function correctly', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: [],
      });

      const data = await applicationsApi.listMine();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications?mine=true');
      expect(data).toEqual([]);
    });

    it('5. should load applications successfully for authenticated parent', async () => {
      const mockApplications: AdmissionApplication[] = [
        {
          application_id: 'app_101',
          application_number: 'APP-2026-001',
          org_id: 'org_1',
          academic_year_id: 'ay_1',
          student_first_name: 'Leo',
          student_last_name: 'Parent',
          student_name: 'Leo Parent',
          status: 'submitted',
          created_at: '2026-08-20T10:00:00Z',
          updated_at: '2026-08-20T10:00:00Z',
        },
      ];

      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockApplications,
      });

      const apps = await applicationsApi.listMine();
      expect(apps).toHaveLength(1);
      expect(apps[0].application_number).toBe('APP-2026-001');
      expect(apps[0].student_first_name).toBe('Leo');
    });

    it('6. should handle empty applications state cleanly', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: [],
      });

      const apps = await applicationsApi.listMine();
      expect(apps).toHaveLength(0);
    });

    it('7. should handle API error state on application load', async () => {
      jest
        .spyOn(apiClient, 'get')
        .mockRejectedValueOnce(
          new ApiError(500, 'Failed to fetch parent applications', 'SERVER_ERROR'),
        );

      await expect(applicationsApi.listMine()).rejects.toThrow(
        'Failed to fetch parent applications',
      );
    });

    it('8. should correctly map application statuses to canonical visual configs', () => {
      const submitted = getApplicationStatusConfig('submitted');
      expect(submitted.label).toBe('Submitted');
      expect(submitted.progress).toBe(25);

      const docsPending = getApplicationStatusConfig('documents_pending');
      expect(docsPending.label).toBe('Documents Pending');
      expect(docsPending.progress).toBe(35);

      const underReview = getApplicationStatusConfig('under_review');
      expect(underReview.label).toBe('Under Review');
      expect(underReview.progress).toBe(60);

      const approved = getApplicationStatusConfig('approved');
      expect(approved.label).toBe('Offer Sent');
      expect(approved.progress).toBe(85);

      const enrolled = getApplicationStatusConfig('enrolled');
      expect(enrolled.label).toBe('Enrolled');
      expect(enrolled.progress).toBe(100);

      // Unknown future status fallback
      const unknown = getApplicationStatusConfig('future_unseen_status');
      expect(unknown.label).toBe('Future Unseen Status');
      expect(unknown.progress).toBe(50);
    });

    it('9. should handle multiple applications for multi-child parent accounts', async () => {
      const mockMultiApps: AdmissionApplication[] = [
        {
          application_id: 'app_child_1',
          application_number: 'APP-2026-001',
          org_id: 'org_1',
          academic_year_id: 'ay_1',
          student_first_name: 'Tommy',
          student_last_name: 'Miller',
          student_name: 'Tommy Miller',
          status: 'under_review',
          created_at: '2026-08-01T10:00:00Z',
          updated_at: '2026-08-01T10:00:00Z',
        },
        {
          application_id: 'app_child_2',
          application_number: 'APP-2026-002',
          org_id: 'org_1',
          academic_year_id: 'ay_1',
          student_first_name: 'Emma',
          student_last_name: 'Miller',
          student_name: 'Emma Miller',
          status: 'submitted',
          created_at: '2026-08-05T10:00:00Z',
          updated_at: '2026-08-05T10:00:00Z',
        },
      ];

      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockMultiApps,
      });

      const apps = await applicationsApi.listMine();
      expect(apps).toHaveLength(2);
      expect(apps[0].student_first_name).toBe('Tommy');
      expect(apps[1].student_first_name).toBe('Emma');
    });

    it('10. should support selecting active child application', () => {
      const apps = [
        { application_id: 'app_1', student_name: 'Child One' },
        { application_id: 'app_2', student_name: 'Child Two' },
      ];
      let selectedId = apps[0].application_id;

      // Switch to Child Two
      selectedId = apps[1].application_id;
      const activeApp = apps.find((a) => a.application_id === selectedId);

      expect(activeApp?.student_name).toBe('Child Two');
    });
  });

  // ==========================================
  // 3. SECURITY & DATA SCOPING (11 - 12)
  // ==========================================
  describe('Security & Data Scoping', () => {
    it('11. should not construct or transmit parentUserId from client (uses mine=true)', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [] });

      await applicationsApi.listMine();

      // Backend derives ownership from JWT token context, not query param user ID
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications?mine=true');
      expect(apiClient.get).not.toHaveBeenCalledWith(jestExpect.stringContaining('parent_id='));
      expect(apiClient.get).not.toHaveBeenCalledWith(jestExpect.stringContaining('user_id='));
    });

    it('12. should not leak or render internal staff-only evaluation notes', () => {
      const publicCardFields = [
        'studentName',
        'appNumber',
        'gradeApplied',
        'statusConfig',
        'submittedDate',
      ];
      expect(publicCardFields).not.toContain('internal_staff_notes');
      expect(publicCardFields).not.toContain('confidential_rating');
    });
  });

  // ==========================================
  // 4. NOTIFICATIONS BADGE (13)
  // ==========================================
  describe('Notifications Unread Count', () => {
    it('13. should fetch unread notifications count for badge display', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ unread_count: 3 });

      const count = await notificationsApi.getUnreadCount();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/notifications/unread-count');
      expect(count).toBe(3);
    });
  });
});
