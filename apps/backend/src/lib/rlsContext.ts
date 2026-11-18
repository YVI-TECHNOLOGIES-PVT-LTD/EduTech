import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from './prismaClient';
import { sessionService, type UserProfile } from '../auth/session.service';
import type {} from '../auth/auth.middleware';
import { UnauthorizedError } from '../utils/errors';

/**
 * Validated identity principal allowed to assume transaction-scoped PostgreSQL RLS.
 */
export interface RlsPrincipal {
  readonly userId: string;
  readonly orgId: string;
  readonly roles?: readonly string[];
  readonly email?: string;
}

export interface RlsTransactionOptions {
  /** Prisma interactive transaction timeout in ms (default: Prisma default / 10000ms). */
  timeout?: number;
  /** Prisma interactive transaction maxWait in ms. */
  maxWait?: number;
  /** When true, marks the PostgreSQL transaction `READ ONLY`. */
  readOnly?: boolean;
  /** Override transaction client (intended strictly for isolated unit testing). */
  client?: RlsPrismaClientLike;
}

/** Minimal transaction surface required to establish PostgreSQL RLS claims. */
export interface RlsTransactionClient {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $executeRaw: (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ) => Promise<T>;
  [key: string]: any;
}

export interface RlsPrismaClientLike {
  $transaction: <T>(
    fn: (tx: RlsTransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ) => Promise<T>;
}

declare global {
  namespace Express {
    interface Request {
      runWithRls?: <T>(
        fn: (tx: RlsTransactionClient) => Promise<T>,
        options?: Omit<RlsTransactionOptions, 'client'>,
      ) => Promise<T>;
    }
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidUuid(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new UnauthorizedError(`Invalid RLS principal: missing or non-string ${fieldName}`);
  }
  const normalized = value.trim().toLowerCase();
  if (!UUID_REGEX.test(normalized)) {
    throw new UnauthorizedError(`Invalid RLS principal: malformed UUID for ${fieldName}`);
  }
  return normalized;
}

function assertPrincipal(principal: RlsPrincipal | null | undefined): {
  userId: string;
  orgId: string;
  roles: string[];
  email?: string;
} {
  if (!principal || typeof principal !== 'object') {
    throw new UnauthorizedError('Verified authentication context is required for RLS execution');
  }
  const userId = assertValidUuid(principal.userId, 'userId');
  const orgId = assertValidUuid(principal.orgId, 'orgId');
  const roles = Array.isArray(principal.roles)
    ? principal.roles.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    : [];
  return { userId, orgId, roles, email: principal.email };
}

/**
 * Extracts a verified principal exclusively from Express `req.context.user`,
 * which is populated by `authenticate` after NativeJwt + DB session validation.
 * Never reads client-controlled headers, query params, or request bodies.
 */
export function extractPrincipalFromRequest(req: Request): RlsPrincipal {
  const user = (req as Request & { context?: { user?: UserProfile } }).context?.user;
  if (!user) {
    throw new UnauthorizedError('Missing verified req.context.user session');
  }
  if (user.login_status && user.login_status !== 'APPROVED') {
    throw new UnauthorizedError('User session is not approved for authenticated access');
  }
  if (!Array.isArray(user.roles) || user.roles.length === 0) {
    throw new UnauthorizedError('Authenticated user has no active role assignments');
  }

  return {
    userId: assertValidUuid(user.id, 'user.id'),
    orgId: assertValidUuid(user.org_id || user.school_id, 'user.org_id'),
    roles: [...user.roles],
    email: user.email,
  };
}

/**
 * Verifies a raw NativeJwt bearer token via `sessionService.validateSession`
 * before building an `RlsPrincipal`. Fails closed on invalid/expired/inactive tokens.
 */
export async function resolvePrincipalFromToken(token: string): Promise<RlsPrincipal> {
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new UnauthorizedError('Missing NativeJwt token');
  }
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  if (!cleanToken) {
    throw new UnauthorizedError('Empty NativeJwt bearer token');
  }

  const profile = await sessionService.validateSession(cleanToken);
  if (!profile) {
    throw new UnauthorizedError('Invalid, expired, or inactive NativeJwt session');
  }

  return {
    userId: assertValidUuid(profile.id, 'profile.id'),
    orgId: assertValidUuid(profile.org_id || profile.school_id, 'profile.org_id'),
    roles: [...profile.roles],
    email: profile.email,
  };
}

/**
 * Executes `fn` inside a single PostgreSQL transaction with transaction-local
 * `authenticated` role and Supabase/RLS JWT claims (`is_local = true`).
 *
 * At transaction completion (`COMMIT` or `ROLLBACK`), PostgreSQL automatically resets
 * `ROLE` and clears all three `request.jwt.*` settings before returning the socket
 * to Prisma's connection pool, eliminating cross-request identity leakage.
 */
export async function withRlsContext<T>(
  principal: RlsPrincipal,
  fn: (tx: RlsTransactionClient) => Promise<T>,
  options: RlsTransactionOptions = {},
): Promise<T> {
  const verified = assertPrincipal(principal);
  const claimsJson = JSON.stringify({
    sub: verified.userId,
    role: 'authenticated',
    org_id: verified.orgId,
    app_roles: verified.roles,
  });

  const dbClient: RlsPrismaClientLike =
    options.client ?? (prisma as unknown as RlsPrismaClientLike);
  const txOpts: { maxWait?: number; timeout?: number } = {};
  if (typeof options.timeout === 'number') txOpts.timeout = options.timeout;
  if (typeof options.maxWait === 'number') txOpts.maxWait = options.maxWait;

  return dbClient.$transaction(async (tx) => {
    if (options.readOnly === true) {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    }

    // Drop BYPASSRLS/table-owner privilege strictly within this transaction.
    await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');

    // Parameterized transaction-local GUCs (third argument `true` = is_local).
    await tx.$executeRaw(
      Prisma.sql`
        SELECT
          set_config('request.jwt.claim.sub', ${verified.userId}::text, true),
          set_config('request.jwt.claim.role', 'authenticated', true),
          set_config('request.jwt.claims', ${claimsJson}::text, true)
      `,
    );

    return await fn(tx);
  }, txOpts);
}

/**
 * Runs a database unit of work under PostgreSQL RLS using the verified user
 * already attached to `req.context` by `authenticate`.
 */
export async function withRlsFromRequest<T>(
  req: Request,
  fn: (tx: RlsTransactionClient) => Promise<T>,
  options: Omit<RlsTransactionOptions, 'client'> = {},
): Promise<T> {
  const principal = extractPrincipalFromRequest(req);
  return withRlsContext(principal, fn, options);
}

/**
 * Verifies a NativeJwt token and immediately executes `fn` inside an RLS-scoped
 * PostgreSQL transaction for that user.
 */
export async function withRlsFromToken<T>(
  token: string,
  fn: (tx: RlsTransactionClient) => Promise<T>,
  options: RlsTransactionOptions = {},
): Promise<T> {
  const principal = await resolvePrincipalFromToken(token);
  return withRlsContext(principal, fn, options);
}

/**
 * Explicit boundary for privileged system operations (cron, webhooks, login lookup,
 * provisioning) that intentionally execute with Prisma's service/postgres role
 * rather than user-scoped RLS.
 */
export async function withSystemContext<T>(fn: (client: typeof prisma) => Promise<T>): Promise<T> {
  return fn(prisma);
}

/**
 * Optional Express middleware to mount AFTER `authenticate`. Exposes `req.runWithRls`
 * while rejecting requests without a valid verified session context.
 */
export function attachRlsRunner(req: Request, _res: Response, next: NextFunction): void {
  try {
    extractPrincipalFromRequest(req);
    req.runWithRls = (fn, options) => withRlsFromRequest(req, fn, options);
    next();
  } catch (err) {
    next(err);
  }
}
