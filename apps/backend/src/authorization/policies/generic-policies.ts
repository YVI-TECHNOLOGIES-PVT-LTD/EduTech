import {
  IPolicy,
  AuthorizationContext,
  ResourceAttributes,
  AuthorizationDecision,
} from '../interfaces/authz.interfaces';

export abstract class BasePolicy implements IPolicy {
  abstract readonly name: string;
  abstract evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision>;
}

export class OwnershipPolicy extends BasePolicy {
  readonly name = 'OwnershipPolicy';

  public async evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision> {
    if (!attributes || !attributes.ownerId) {
      return 'ALLOW'; // Ownership check skipped if resource has no owner attribute
    }
    return context.userId === attributes.ownerId ? 'ALLOW' : 'DENY';
  }
}

export class OrganizationPolicy extends BasePolicy {
  readonly name = 'OrganizationPolicy';

  public async evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision> {
    if (!attributes || !attributes.orgId) {
      return 'ALLOW'; // Org check skipped if resource is global
    }
    if (!context.orgId) {
      return 'DENY'; // User has no org context
    }
    return context.orgId === attributes.orgId ? 'ALLOW' : 'DENY';
  }
}

export class TenantPolicy extends BasePolicy {
  readonly name = 'TenantPolicy';

  public async evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision> {
    if (!attributes || !attributes.tenantId) {
      return 'ALLOW';
    }
    if (!context.tenantId) {
      return 'DENY';
    }
    return context.tenantId === attributes.tenantId ? 'ALLOW' : 'DENY';
  }
}

export class AttributeConditionPolicy extends BasePolicy {
  readonly name = 'AttributeConditionPolicy';

  public async evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision> {
    if (!attributes) return 'ALLOW';

    if (attributes.status && attributes.status === 'BLOCKED') {
      return 'DENY';
    }

    return 'ALLOW';
  }
}
