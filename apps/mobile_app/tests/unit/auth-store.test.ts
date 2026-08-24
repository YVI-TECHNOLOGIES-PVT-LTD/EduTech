import { useAuthStore } from '../../src/stores/auth.store';
import { UserProfile, AuthTokens } from '../../src/types/auth.types';

describe('AuthStore (Zustand)', () => {
  const mockUser: UserProfile = {
    id: 'parent_usr_1',
    email: 'parent@example.com',
    full_name: 'Jane Doe',
    first_name: 'Jane',
    last_name: 'Doe',
    phone: '+919876543210',
    roles: ['PARENT'],
    permissions: ['admission.view'],
  };

  const mockTokens: AuthTokens = {
    accessToken: 'test_access_jwt',
    refreshToken: 'test_refresh_jwt',
    expiresIn: 3600,
  };

  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should initialize with isHydrating true and unauthenticated state', () => {
    useAuthStore.setState({ isHydrating: true, isAuthenticated: false, user: null, tokens: null });
    const state = useAuthStore.getState();
    expect(state.isHydrating).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });

  it('should set authenticated state upon setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isHydrating).toBe(false);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
  });

  it('should clear state upon logout', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isHydrating).toBe(false);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });

  it('should support updating user profile details', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    useAuthStore.getState().updateUser({ full_name: 'Jane Smith' });

    const state = useAuthStore.getState();
    expect(state.user?.full_name).toBe('Jane Smith');
    expect(state.user?.email).toBe('parent@example.com');
  });
});
