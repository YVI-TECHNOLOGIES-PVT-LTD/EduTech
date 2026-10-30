import {
  authApi,
  metadataApi,
  applicationsApi,
  documentsApi,
  assessmentApi,
  decisionApi,
  feesApi,
  notificationsApi,
} from '../../src/api';
import { apiClient } from '../../src/api/client';
import { SecureStorage } from '../../src/storage/secure-store';

jest.mock('../../src/storage/secure-store', () => ({
  SecureStorage: {
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearSession: jest.fn(),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getWorkspaceId: jest.fn(),
    setWorkspaceId: jest.fn(),
    getUserProfile: jest.fn(),
    setUserProfile: jest.fn(),
  },
}));

describe('Canonical API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authApi', () => {
    it('should call login endpoint and save tokens', async () => {
      const mockResponse = {
        accessToken: 'access_123',
        refreshToken: 'refresh_123',
        user: {
          id: 'usr_1',
          email: 'test@example.com',
          full_name: 'Test Parent',
          roles: ['PARENT'],
          permissions: [],
        },
      };
      jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({ email: 'test@example.com', password: 'password123' });
      expect(apiClient.post).toHaveBeenCalledWith('/v1/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(SecureStorage.setAccessToken).toHaveBeenCalledWith('access_123');
      expect(SecureStorage.setRefreshToken).toHaveBeenCalledWith('refresh_123');
      expect(result).toEqual(mockResponse);
    });

    it('should call registerParent endpoint', async () => {
      const mockPayload = {
        full_name: 'Jane Parent',
        email: 'jane@example.com',
        phone: '9876543210',
        password: 'Password@123',
      };
      const mockResponse = { success: true, user_id: 'usr_2', parent_id: 'par_2' };
      jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

      const result = await authApi.registerParent(mockPayload);
      expect(apiClient.post).toHaveBeenCalledWith('/v1/admission/register', mockPayload);
      expect(result).toEqual(mockResponse);
    });

    it('should call verifyOtp endpoint', async () => {
      const mockPayload = { email: 'jane@example.com', otp: '123456' };
      const mockResponse = { success: true, message: 'OTP verified' };
      jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

      const result = await authApi.verifyOtp(mockPayload);
      expect(apiClient.post).toHaveBeenCalledWith('/v1/admission/verify-otp', mockPayload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('metadataApi', () => {
    it('should fetch public admission config', async () => {
      const mockConfig = {
        organization: { org_id: 'org_1', org_name: 'Springfield School' },
        academic_years: [],
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockConfig });

      const result = await metadataApi.getAdmissionConfig();
      expect(apiClient.get).toHaveBeenCalledWith('/public/admission/config');
      expect(result).toEqual(mockConfig);
    });

    it('should fetch public academic years', async () => {
      const mockYears = [
        {
          academic_year_id: 'ay_1',
          year_name: '2026-2027',
          start_date: '2026-06-01',
          end_date: '2027-05-31',
        },
      ];
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockYears });

      const result = await metadataApi.getAcademicYears();
      expect(apiClient.get).toHaveBeenCalledWith('/public/academic-years');
      expect(result).toEqual(mockYears);
    });
  });

  describe('applicationsApi', () => {
    it('should fetch parent applications with mine=true query', async () => {
      const mockApps = [
        {
          application_id: 'app_1',
          application_number: 'APP-2026-001',
          student_first_name: 'Alice',
          status: 'submitted',
        },
      ];
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockApps });

      const result = await applicationsApi.listMine();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications?mine=true');
      expect(result).toEqual(mockApps);
    });

    it('should get single application by ID', async () => {
      const mockApp = {
        application_id: 'app_1',
        application_number: 'APP-2026-001',
        student_first_name: 'Alice',
        status: 'submitted',
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ application: mockApp });

      const result = await applicationsApi.getById('app_1');
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app_1');
      expect(result).toEqual(mockApp);
    });
  });

  describe('feesApi', () => {
    it('should fetch fee statement for an application', async () => {
      const mockFee = {
        application_id: 'app_1',
        currency: 'INR',
        application_fee: 500,
        processing_fee: 100,
        total_fee: 600,
        payment_status: 'pending',
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockFee });

      const result = await feesApi.getFeeSummary('app_1');
      expect(apiClient.get).toHaveBeenCalledWith('/v1/applications/app_1/fee');
      expect(result).toEqual(mockFee);
    });

    it('should fetch parent multi-child enrolled fees from /v1/fees/my', async () => {
      const mockResponse = {
        success: true,
        parent_id: 'par_123',
        parent_name: 'John Parent',
        children_count: 1,
        children: [
          {
            student_id: 'stu_1',
            admission_no: 'ADM-001',
            first_name: 'Rahul',
            last_name: 'Sharma',
            full_name: 'Rahul Sharma',
            grade_name: 'Grade 5',
            summary: {
              total_assessed: 45000,
              total_paid: 20000,
              outstanding_balance: 25000,
              overdue_amount: 0,
              status: 'partially_paid',
            },
          },
        ],
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse);

      const result = await feesApi.getMyChildrenFees();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/fees/my');
      expect(result.success).toBe(true);
      expect(result.children.length).toBe(1);
      expect(result.children[0].admission_no).toBe('ADM-001');
    });

    it('should fetch specific child fee details from /v1/fees/my/children/:studentId', async () => {
      const mockDetails = {
        student_id: 'stu_1',
        admission_no: 'ADM-001',
        first_name: 'Rahul',
        full_name: 'Rahul Sharma',
        summary: {
          total_assessed: 45000,
          total_paid: 20000,
          outstanding_balance: 25000,
          overdue_amount: 0,
          status: 'partially_paid',
        },
        dues: [
          {
            due_id: 'due_1',
            term_name: 'Term 1',
            amount_due: 25000,
            paid_amount: 0,
            outstanding_amount: 25000,
            due_date: '2026-11-01',
            is_overdue: false,
            status: 'pending',
          },
        ],
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockDetails });

      const result = await feesApi.getChildFeeDetails('stu_1');
      expect(apiClient.get).toHaveBeenCalledWith('/v1/fees/my/children/stu_1');
      expect(result.student_id).toBe('stu_1');
      expect(result.dues?.length).toBe(1);
    });
  });

  describe('notificationsApi', () => {
    it('should fetch unread notifications count', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ unread_count: 5 });

      const result = await notificationsApi.getUnreadCount();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/notifications/unread-count');
      expect(result).toBe(5);
    });
  });
});
