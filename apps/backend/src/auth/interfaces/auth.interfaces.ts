export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly orgId: string;
  readonly role: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly loginStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
}

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly orgId: string;
  readonly role: string;
  readonly jti: string;
  readonly iat: number;
  readonly exp: number;
  readonly type: 'access' | 'refresh';
}

export interface RefreshTokenPayload {
  readonly tokenId: string;
  readonly userId: string;
  readonly orgId: string;
  readonly expiresAt: number;
}

export interface UserSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly orgId: string;
  readonly tokenId: string;
  readonly refreshTokenHash: string;
  readonly deviceId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly lastUsedAt: Date;
  readonly isRevoked: boolean;
}
