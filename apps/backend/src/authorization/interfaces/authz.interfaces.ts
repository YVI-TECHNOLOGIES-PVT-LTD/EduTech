export type AuthorizationDecision = 'ALLOW' | 'DENY';

export interface ResourceAttributes {
  readonly resourceId?: string;
  readonly resourceType?: string;
  readonly ownerId?: string;
  readonly orgId?: string;
  readonly tenantId?: string;
  readonly departmentId?: string;
  readonly sectionId?: string;
  readonly academicYearId?: string;
  readonly status?: string;
  readonly [key: string]: any;
}

export interface AuthorizationContext {
  readonly userId: string;
  readonly email: string;
  readonly orgId?: string;
  readonly tenantId?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly attributes?: ResourceAttributes;
  readonly timestamp: Date;
}

export interface IPolicy {
  readonly name: string;
  evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision>;
}

export interface IAuthorizationCache {
  get(key: string): AuthorizationDecision | undefined;
  set(key: string, decision: AuthorizationDecision, ttlMs?: number): void;
  clear(): void;
}

export class MemoryAuthorizationCache implements IAuthorizationCache {
  private cache = new Map<string, { decision: AuthorizationDecision; expiresAt: number }>();
  private defaultTtlMs = 60 * 1000; // 1 minute in-memory cache

  public get(key: string): AuthorizationDecision | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.decision;
  }

  public set(key: string, decision: AuthorizationDecision, ttlMs = this.defaultTtlMs): void {
    this.cache.set(key, {
      decision,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}
