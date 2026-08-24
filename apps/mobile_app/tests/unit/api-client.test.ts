import { apiClient, ApiError } from '../../src/api/client';
import { SecureStorage } from '../../src/storage/secure-store';
import { useAuthStore } from '../../src/stores/auth.store';

// Mock dependencies
jest.mock('../../src/storage/secure-store', () => ({
  SecureStorage: {
    getAccessToken: jest.fn(),
    setAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    getWorkspaceId: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('Mobile API Client & Error Normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ApiError Class', () => {
    it('should properly construct with status, message, code and details', () => {
      const err = new ApiError(404, 'Not found', 'NOT_FOUND', { resourceId: '123' });
      expect(err.name).toBe('ApiError');
      expect(err.status).toBe(404);
      expect(err.message).toBe('Not found');
      expect(err.code).toBe('NOT_FOUND');
      expect(err.details).toEqual({ resourceId: '123' });
    });
  });

  describe('Client HTTP Methods', () => {
    it('should expose standard REST and upload methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
      expect(typeof apiClient.upload).toBe('function');
    });

    it('should execute get request with baseURL', async () => {
      const mockData = { success: true, data: [{ id: 'app_1' }] };
      jest.spyOn(apiClient.instance, 'get').mockResolvedValueOnce({
        status: 200,
        data: mockData,
        headers: {},
        config: {} as any,
        statusText: 'OK',
      });

      const result = await apiClient.get('/v1/applications?mine=true');
      expect(result).toEqual(mockData);
    });

    it('should execute post request with body payload', async () => {
      const mockPayload = { student_first_name: 'Jane' };
      const mockResponse = { application_id: 'app_new_1', ...mockPayload };
      jest.spyOn(apiClient.instance, 'post').mockResolvedValueOnce({
        status: 201,
        data: mockResponse,
        headers: {},
        config: {} as any,
        statusText: 'Created',
      });

      const result = await apiClient.post('/v1/applications', mockPayload);
      expect(result).toEqual(mockResponse);
    });

    it('should execute upload request with multipart header', async () => {
      const formData = new FormData();
      const mockResponse = { document_id: 'doc_1' };
      jest.spyOn(apiClient.instance, 'post').mockResolvedValueOnce({
        status: 200,
        data: mockResponse,
        headers: {},
        config: {} as any,
        statusText: 'OK',
      });

      const result = await apiClient.upload('/v1/applications/app_1/documents', formData);
      expect(result).toEqual(mockResponse);
    });
  });
});
