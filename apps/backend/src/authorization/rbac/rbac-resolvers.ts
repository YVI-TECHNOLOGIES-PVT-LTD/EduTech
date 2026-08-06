const ROLE_ALIASES: Record<string, string[]> = {
  HEAD_OF_INSTITUTE: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  HOI: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  PRINCIPAL: ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
  COUNSELLOR: ['COUNSELOR', 'COUNSELLOR'],
  COUNSELOR: ['COUNSELOR', 'COUNSELLOR'],
  ACCOUNTANT: ['FINANCE_OFFICER', 'ACCOUNTANT'],
  FINANCE_OFFICER: ['FINANCE_OFFICER', 'ACCOUNTANT'],
  DRIVER: ['BUS_DRIVER', 'DRIVER'],
  BUS_DRIVER: ['BUS_DRIVER', 'DRIVER'],
  EXAM_CELL: ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
  EXAM_CELL_ADMIN: ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
  SUPERADMIN: ['SUPERADMIN', 'ADMIN'],
};

const ROLE_HIERARCHY: Record<string, string[]> = {
  SUPERADMIN: ['ADMIN', 'HOI', 'PRINCIPAL', 'TEACHER', 'STAFF', 'USER'],
  ADMIN: ['HOI', 'PRINCIPAL', 'TEACHER', 'STAFF', 'USER'],
  HOI: ['TEACHER', 'STAFF', 'USER'],
  PRINCIPAL: ['TEACHER', 'STAFF', 'USER'],
  TEACHER: ['USER'],
  STAFF: ['USER'],
};

export class HierarchyResolver {
  public static getInheritedRoles(roles: string[]): string[] {
    const inherited = new Set<string>(roles);
    for (const role of roles) {
      const children = ROLE_HIERARCHY[role];
      if (children) {
        children.forEach((child) => inherited.add(child));
      }
    }
    return Array.from(inherited);
  }
}

export class RoleResolver {
  public static getEffectiveRoles(roles: string[]): string[] {
    const effective = new Set<string>();
    for (const role of roles) {
      effective.add(role);
      const aliases = ROLE_ALIASES[role];
      if (aliases) {
        aliases.forEach((alias) => effective.add(alias));
      }
    }
    const fullRoles = HierarchyResolver.getInheritedRoles(Array.from(effective));
    return fullRoles;
  }
}

export class PermissionResolver {
  public static hasPermission(
    userPermissions: readonly string[],
    requiredPermission: string,
  ): boolean {
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Permission hierarchy evaluation (e.g., view_all grants view_own)
    if (requiredPermission.endsWith('.view_own')) {
      const viewAllPerm = requiredPermission.replace('.view_own', '.view_all');
      const reviewPerm = requiredPermission.replace('.view_own', '.review');
      if (userPermissions.includes(viewAllPerm) || userPermissions.includes(reviewPerm)) {
        return true;
      }
    }

    return false;
  }
}
