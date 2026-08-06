import crypto from 'crypto';
import { JwtPayload } from '../interfaces/auth.interfaces';
import { PasswordHasher } from '../password/password.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export class AccessTokenService {
  public createToken(payload: { userId: string; email: string; orgId: string; role: string }): {
    token: string;
    jti: string;
  } {
    const jti = crypto.randomUUID();
    const tokenPayload: JwtPayload = {
      sub: payload.userId,
      email: payload.email,
      orgId: payload.orgId,
      role: payload.role,
      jti,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 mins
      type: 'access',
    };

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    return { token, jti };
  }

  public verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as JwtPayload;
      if (!decoded || decoded.type !== 'access') return null;
      if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
      return decoded;
    } catch {
      return null;
    }
  }
}

export class RefreshTokenService {
  public createRefreshToken(userId: string): {
    refreshToken: string;
    tokenHash: string;
    jti: string;
  } {
    const jti = crypto.randomUUID();
    const refreshToken = `${userId}.${jti}.${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = PasswordHasher.hashToken(refreshToken);
    return { refreshToken, tokenHash, jti };
  }

  public verifyHash(refreshToken: string, storedHash: string): boolean {
    const computedHash = PasswordHasher.hashToken(refreshToken);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  }
}

export class TokenService {
  private accessTokenService = new AccessTokenService();
  private refreshTokenService = new RefreshTokenService();

  public generateTokenPair(user: {
    id: string;
    email: string;
    orgId: string;
    role: string;
  }): TokenPair & { refreshTokenHash: string; jti: string } {
    const { token: accessToken, jti } = this.accessTokenService.createToken({
      userId: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
    });

    const { refreshToken, tokenHash } = this.refreshTokenService.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash: tokenHash,
      jti,
      expiresInSeconds: 900,
    };
  }

  public verifyAccessToken(token: string): JwtPayload | null {
    return this.accessTokenService.verifyToken(token);
  }

  public verifyRefreshTokenHash(refreshToken: string, storedHash: string): boolean {
    return this.refreshTokenService.verifyHash(refreshToken, storedHash);
  }
}
