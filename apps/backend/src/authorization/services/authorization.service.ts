import {
  AuthorizationContext,
  ResourceAttributes,
  AuthorizationDecision,
  MemoryAuthorizationCache,
} from '../interfaces/authz.interfaces';
import { RoleResolver, PermissionResolver } from '../rbac/rbac-resolvers';
import { AbacEngine } from '../abac/abac-engine';

export interface AuthorizationParams {
  context?: AuthorizationContext;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  attributes?: ResourceAttributes;
}

export class AuthorizationService {
  private abacEngine = new AbacEngine();
  private cache = new MemoryAuthorizationCache();

  public async authorize(params: AuthorizationParams): Promise<AuthorizationDecision> {
    const { context, requiredRoles, requiredPermissions, attributes } = params;

    // Fail-Closed Rule 1: Missing context yields DENY
    if (!context || !context.userId) {
      console.warn('[Authorization] FAIL-CLOSED: Missing or invalid AuthorizationContext');
      return 'DENY';
    }

    // Generate decision cache key
    const cacheKey = `${context.userId}:${requiredRoles?.join(',')}:${requiredPermissions?.join(',')}:${attributes?.resourceId || 'global'}`;
    const cachedDecision = this.cache.get(cacheKey);
    if (cachedDecision) {
      return cachedDecision;
    }

    const effectiveRoles = RoleResolver.getEffectiveRoles([...context.roles]);

    // Super Admin bypass
    if (effectiveRoles.includes('SUPERADMIN')) {
      this.cache.set(cacheKey, 'ALLOW');
      return 'ALLOW';
    }

    // Role check
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => effectiveRoles.includes(role));
      if (!hasRequiredRole) {
        console.warn(
          `[Authorization] FAIL-CLOSED: User ${context.userId} missing required roles: ${requiredRoles.join(',')}`,
        );
        this.cache.set(cacheKey, 'DENY');
        return 'DENY';
      }
    }

    // Permission check
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        PermissionResolver.hasPermission(context.permissions, perm),
      );
      if (!hasAllPermissions) {
        console.warn(
          `[Authorization] FAIL-CLOSED: User ${context.userId} missing required permissions: ${requiredPermissions.join(',')}`,
        );
        this.cache.set(cacheKey, 'DENY');
        return 'DENY';
      }
    }

    // ABAC Policy Evaluation
    const abacDecision = await this.abacEngine.evaluate(context, attributes);
    if (abacDecision === 'DENY') {
      console.warn(
        `[Authorization] FAIL-CLOSED: ABAC policy evaluated to DENY for user ${context.userId}`,
      );
      this.cache.set(cacheKey, 'DENY');
      return 'DENY';
    }

    this.cache.set(cacheKey, 'ALLOW');
    return 'ALLOW';
  }
}
