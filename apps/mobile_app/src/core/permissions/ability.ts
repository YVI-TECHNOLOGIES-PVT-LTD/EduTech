import { PermissionEngine } from './permission-engine';
import { PermissionAction, PermissionResource } from '../../types/role.types';

export function defineAbility(action: PermissionAction, resource: PermissionResource): boolean {
  return PermissionEngine.can(action, resource);
}
