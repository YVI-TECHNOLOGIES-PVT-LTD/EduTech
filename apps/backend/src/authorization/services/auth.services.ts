import { IPolicy, PolicyContext } from '../interfaces/policy.interface';

export interface IRbacService {
  hasRole(userRoles: string[], requiredRoles: string[]): boolean;
  hasPermission(userPermissions: string[], requiredPermission: string): boolean;
}

export class RbacService implements IRbacService {
  public hasRole(userRoles: string[], requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  public hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (!requiredPermission) return true;
    return userPermissions.includes(requiredPermission);
  }
}

export interface IAbacEngine {
  registerPolicy(policy: IPolicy): void;
  evaluate(policyName: string, context: PolicyContext): Promise<boolean>;
}

export class AbacEngine implements IAbacEngine {
  private policies = new Map<string, IPolicy>();

  public registerPolicy(policy: IPolicy): void {
    this.policies.set(policy.name, policy);
  }

  public async evaluate(policyName: string, context: PolicyContext): Promise<boolean> {
    const policy = this.policies.get(policyName);
    if (!policy) return false;
    return policy.evaluate(context);
  }
}
