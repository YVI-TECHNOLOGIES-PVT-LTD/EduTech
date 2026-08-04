import { UserProfile } from './user.types';
import { WorkspaceOption } from './tenant.types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  tokens: AuthTokens | null;
  workspaces: WorkspaceOption[];
  selectedWorkspace: WorkspaceOption | null;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
  workspaces: WorkspaceOption[];
}
