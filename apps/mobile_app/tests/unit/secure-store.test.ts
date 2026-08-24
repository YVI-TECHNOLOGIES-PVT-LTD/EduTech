import { SecureStorage } from '../../src/storage/secure-store';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('SecureStorage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should store and retrieve access token securely', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('test_jwt_access_token');

    await SecureStorage.setAccessToken('test_jwt_access_token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'edutrack_access_token',
      'test_jwt_access_token',
    );

    const token = await SecureStorage.getAccessToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('edutrack_access_token');
    expect(token).toBe('test_jwt_access_token');
  });

  it('should store and retrieve refresh token securely', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('test_jwt_refresh_token');

    await SecureStorage.setRefreshToken('test_jwt_refresh_token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'edutrack_refresh_token',
      'test_jwt_refresh_token',
    );

    const token = await SecureStorage.getRefreshToken();
    expect(token).toBe('test_jwt_refresh_token');
  });

  it('should clear all session secrets on logout', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    await SecureStorage.clearSession();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edutrack_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edutrack_refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edutrack_workspace_id');
  });
});
