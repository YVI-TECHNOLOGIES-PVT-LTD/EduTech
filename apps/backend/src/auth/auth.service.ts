import { PrismaClient } from '@prisma/client';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { NativePassword, NativeJwt } from './crypto.utils';
import { normalizePhone } from '../utils/phone.utils';

const prisma = new PrismaClient();

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN_SECONDS = 86400; // 1 day
const JWT_REFRESH_EXPIRES_IN_SECONDS = 604800; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  orgId: string;
  roles: string[];
}

export class AuthService {
  static async login(emailOrPhone: string, passwordInput: string) {
    console.log('>>> AUTH SERVICE HIT');
    console.log('========== LOGIN DIAGNOSTICS ==========');
    console.log('Incoming Identifier:', emailOrPhone);

    let identifierStr = '';
    if (typeof emailOrPhone === 'object' && emailOrPhone !== null) {
      identifierStr =
        (emailOrPhone as any).identifier ||
        (emailOrPhone as any).email ||
        (emailOrPhone as any).phone ||
        '';
      if (!passwordInput) passwordInput = (emailOrPhone as any).password;
    } else {
      identifierStr = String(emailOrPhone || '');
    }

    const cleanInput = identifierStr.trim().toLowerCase();
    const normPhone = normalizePhone(cleanInput);

    // 1. Query public.users via Prisma ORM by email or phone
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: cleanInput }, { phone: cleanInput }, { phone: normPhone }],
      },
    });

    console.log('User Exists:', !!user);

    if (user) {
      console.log('User ID:', user.user_id);
      console.log('Email:', user.email);
      console.log('Status:', user.status);
    }

    if (!user) {
      console.log('LOGIN FAILED -> USER NOT FOUND');
      console.log('======================================');
      throw new Error('Invalid login credentials');
    }

    if (user.status !== 'active') {
      console.log(`LOGIN FAILED -> USER NOT ACTIVE (Status: ${user.status})`);
      console.log('======================================');
      throw new Error(`Account is currently ${user.status}. Access denied.`);
    }

    if (!user.password_hash) {
      console.log('LOGIN FAILED -> NO PASSWORD HASH SET');
      console.log('======================================');
      throw new Error('User has no password set. Please reset your password.');
    }

    // 2. Compare password hash
    const match = await NativePassword.compare(passwordInput, user.password_hash);
    console.log('bcrypt Match:', match);

    if (!match) {
      console.log('LOGIN FAILED -> PASSWORD MISMATCH');
      console.log('======================================');
      throw new Error('Invalid login credentials');
    }

    // 3. Fetch User Roles via Prisma ORM
    console.log('Fetching roles via Prisma...');
    const userRolesData = await prisma.user_roles.findMany({
      where: { user_id: user.user_id },
      include: {
        roles: true,
      },
    });

    const roles: string[] = userRolesData
      .map((ur) => ur.roles?.role_name)
      .filter((r): r is string => Boolean(r));

    const permissions: string[] = [];

    // 4. Update last_login_at timestamp via Prisma
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    // 5. Generate Native JWT Access & Refresh Tokens
    console.log('Generating JWT...');
    const payload: TokenPayload = {
      userId: user.user_id,
      email: user.email,
      orgId: user.org_id,
      roles,
    };

    const accessToken = NativeJwt.sign(payload, JWT_SECRET, JWT_EXPIRES_IN_SECONDS);
    const refreshToken = NativeJwt.sign(
      payload,
      JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN_SECONDS,
    );
    console.log('JWT Generated Successfully');
    console.log('======================================');

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN_SECONDS,
      user: {
        id: user.user_id,
        email: user.email,
        school_id: user.org_id,
        full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
        roles,
        permissions,
        login_status: 'APPROVED',
      },
    };
  }

  static async refresh(refreshTokenInput: string) {
    try {
      const decoded = NativeJwt.verify<TokenPayload>(refreshTokenInput, JWT_REFRESH_SECRET);

      const user = await prisma.users.findUnique({
        where: { user_id: decoded.userId },
      });

      if (!user || user.status !== 'active') {
        throw new Error('Invalid or expired refresh token');
      }

      const payload: TokenPayload = {
        userId: user.user_id,
        email: user.email,
        orgId: user.org_id,
        roles: decoded.roles,
      };

      const accessToken = NativeJwt.sign(payload, JWT_SECRET, JWT_EXPIRES_IN_SECONDS);
      const newRefreshToken = NativeJwt.sign(
        payload,
        JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN_SECONDS,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_EXPIRES_IN_SECONDS,
      };
    } catch (err: any) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static verifyToken(token: string): TokenPayload {
    return NativeJwt.verify<TokenPayload>(token, JWT_SECRET);
  }
}
