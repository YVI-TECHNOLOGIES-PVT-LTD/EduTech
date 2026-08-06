import { sessionService } from '../session.service';
import { PasswordService } from '../password/password.service';
import { TokenService, TokenPair } from '../tokens/token.service';
import {
  AuthenticationException,
  NotFoundException,
} from '../../common/exceptions/domain.exceptions';
import { LoginRequest, LoginResponseData, CurrentUserResponseData } from '../dto/auth.dto';
import { prisma } from '../../lib/prismaClient';

export class IdentityService {
  public async findUserByEmail(email: string) {
    const user = await prisma.users.findFirst({
      where: { email },
    });
    return user;
  }
}

export class AuthService {
  private identityService = new IdentityService();
  private passwordService = new PasswordService();
  private tokenService = new TokenService();

  public async login(
    req: LoginRequest,
    metadata?: { ip?: string; userAgent?: string },
  ): Promise<LoginResponseData> {
    const user = await this.identityService.findUserByEmail(req.email);
    if (!user) {
      throw new AuthenticationException('Invalid credentials');
    }

    if (user.password_hash) {
      const isValid = await this.passwordService.verifyPassword(req.password, user.password_hash);
      if (!isValid) {
        throw new AuthenticationException('Invalid credentials');
      }
    }

    const tokenPair = this.tokenService.generateTokenPair({
      id: user.user_id,
      email: user.email,
      orgId: user.org_id,
      role: 'user',
    });

    await sessionService.createSession({
      userId: user.user_id,
      orgId: user.org_id,
      tokenId: tokenPair.jti,
      refreshToken: tokenPair.refreshToken,
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
    });

    return {
      user: {
        id: user.user_id,
        email: user.email,
        orgId: user.org_id,
        role: 'user',
        roles: ['user'],
        permissions: [],
      },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresInSeconds: tokenPair.expiresInSeconds,
    };
  }

  public async refresh(refreshToken: string): Promise<TokenPair> {
    const session = await sessionService.validateRefreshToken(refreshToken);
    if (!session) {
      throw new AuthenticationException('Invalid or expired refresh token');
    }

    const user = await prisma.users.findUnique({ where: { user_id: session.userId } });
    if (!user) {
      throw new NotFoundException('User identity not found');
    }

    const tokenPair = this.tokenService.generateTokenPair({
      id: user.user_id,
      email: user.email,
      orgId: user.org_id,
      role: 'user',
    });

    await sessionService.revokeSession(session.sessionId);
    await sessionService.createSession({
      userId: user.user_id,
      orgId: user.org_id,
      tokenId: tokenPair.jti,
      refreshToken: tokenPair.refreshToken,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresInSeconds: tokenPair.expiresInSeconds,
    };
  }

  public async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const session = await sessionService.validateRefreshToken(refreshToken);
      if (session) {
        await sessionService.revokeSession(session.sessionId);
      }
    }
  }

  public async getCurrentUser(userId: string): Promise<CurrentUserResponseData> {
    const user = await prisma.users.findUnique({ where: { user_id: userId } });
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.user_id,
      email: user.email,
      orgId: user.org_id,
      role: 'user',
      roles: ['user'],
      permissions: [],
    };
  }
}
