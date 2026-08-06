import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { PasswordHasher } from './password/password.service';

export interface UserProfile {
  id: string;
  email: string;
  school_id: string;
  full_name: string;
  roles: string[];
  permissions: string[];
  login_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
}

export interface StoredSession {
  sessionId: string;
  userId: string;
  orgId: string;
  tokenId: string;
  refreshTokenHash: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  isRevoked: boolean;
}

interface CachedSession {
  profile: UserProfile;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const activeSessionsStore = new Map<string, StoredSession>(); // Session store mapping sessionId -> StoredSession
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export class SessionService {
  public async createSession(params: {
    userId: string;
    orgId: string;
    tokenId: string;
    refreshToken: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<StoredSession> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const refreshTokenHash = PasswordHasher.hashToken(params.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: StoredSession = {
      sessionId,
      userId: params.userId,
      orgId: params.orgId,
      tokenId: params.tokenId,
      refreshTokenHash,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: new Date(),
      expiresAt,
      lastUsedAt: new Date(),
      isRevoked: false,
    };

    activeSessionsStore.set(sessionId, session);
    return session;
  }

  public async validateRefreshToken(refreshToken: string): Promise<StoredSession | null> {
    const tokenHash = PasswordHasher.hashToken(refreshToken);
    for (const session of activeSessionsStore.values()) {
      if (
        !session.isRevoked &&
        session.expiresAt > new Date() &&
        session.refreshTokenHash === tokenHash
      ) {
        return session;
      }
    }
    return null;
  }

  public async revokeSession(sessionId: string): Promise<void> {
    const session = activeSessionsStore.get(sessionId);
    if (session) {
      session.isRevoked = true;
    }
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    for (const session of activeSessionsStore.values()) {
      if (session.userId === userId) {
        session.isRevoked = true;
      }
    }
  }

  async validateSession(token: string): Promise<UserProfile | null> {
    const cached = sessionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.profile;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData.user) {
        return null;
      }

      const userId = authData.user.id;
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user || user.status !== 'active') {
        return null;
      }

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select(
          `
                    roles!inner (
                        name,
                        role_permissions (
                            permissions (
                                code
                            )
                        )
                    )
                `,
        )
        .eq('user_id', userId);

      const roles: string[] = [];
      const permissions = new Set<string>();

      rolesData?.forEach((ur: any) => {
        const role = ur.roles;
        if (role) {
          roles.push(role.name);
          role.role_permissions?.forEach((rp: any) => {
            if (rp.permissions?.code) {
              permissions.add(rp.permissions.code);
            }
          });
        }
      });

      const finalProfile: UserProfile = {
        id: user.id,
        email: user.email,
        school_id: user.org_id || user.school_id || '',
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        roles,
        permissions: Array.from(permissions),
        login_status: user.status === 'active' ? 'APPROVED' : 'PENDING',
      };

      sessionCache.set(token, {
        profile: finalProfile,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return finalProfile;
    } catch (err) {
      console.error('[Session] Unexpected validation error:', err);
      return null;
    }
  }

  getUserClient(token: string): SupabaseClient {
    return createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
}

export const sessionService = new SessionService();
