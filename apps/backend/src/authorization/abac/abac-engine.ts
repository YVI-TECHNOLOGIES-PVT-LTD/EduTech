import { Request } from 'express';
import {
  IPolicy,
  AuthorizationContext,
  ResourceAttributes,
  AuthorizationDecision,
} from '../interfaces/authz.interfaces';
import {
  OwnershipPolicy,
  OrganizationPolicy,
  TenantPolicy,
  AttributeConditionPolicy,
} from '../policies/generic-policies';

export class AttributeResolver {
  public static extractAttributes(req: Request): ResourceAttributes {
    const params = req.params || {};
    const query = req.query || {};
    const body = req.body || {};

    return {
      resourceId: params.id || query.id || body.id,
      resourceType: (req as any).resourceType || req.baseUrl?.split('/').pop() || 'resource',
      ownerId: body.created_by || body.userId || query.userId,
      orgId:
        (req.headers['x-org-id'] as string) ||
        (req as any).user?.orgId ||
        (req as any).user?.school_id ||
        query.school_id,
      tenantId: (req.headers['x-tenant-id'] as string) || (req as any).user?.tenantId,
      departmentId: body.departmentId || query.departmentId,
      sectionId: body.sectionId || query.sectionId,
      academicYearId: body.academicYearId || query.academicYearId,
      status: body.status || query.status,
    };
  }
}

export class PolicyRegistry {
  private static instance: PolicyRegistry;
  private policies = new Map<string, IPolicy>();

  private constructor() {
    this.register(new OwnershipPolicy());
    this.register(new OrganizationPolicy());
    this.register(new TenantPolicy());
    this.register(new AttributeConditionPolicy());
  }

  public static getInstance(): PolicyRegistry {
    if (!PolicyRegistry.instance) {
      PolicyRegistry.instance = new PolicyRegistry();
    }
    return PolicyRegistry.instance;
  }

  public register(policy: IPolicy): void {
    this.policies.set(policy.name, policy);
  }

  public getPolicies(): IPolicy[] {
    return Array.from(this.policies.values());
  }
}

export class AbacEngine {
  private registry = PolicyRegistry.getInstance();

  public async evaluate(
    context: AuthorizationContext,
    attributes?: ResourceAttributes,
  ): Promise<AuthorizationDecision> {
    const policies = this.registry.getPolicies();

    for (const policy of policies) {
      const decision = await policy.evaluate(context, attributes);
      if (decision === 'DENY') {
        return 'DENY';
      }
    }

    return 'ALLOW';
  }
}
