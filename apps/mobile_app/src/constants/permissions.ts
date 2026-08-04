import { PermissionAction, PermissionResource } from '../types/role.types';

export const PERMISSION_ACTIONS: Record<PermissionAction, PermissionAction> = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  APPROVE: 'APPROVE',
};

export const PERMISSION_RESOURCES: Record<PermissionResource, PermissionResource> = {
  ADMISSION: 'ADMISSION',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  FINANCE: 'FINANCE',
  HR: 'HR',
  LIBRARY: 'LIBRARY',
  TRANSPORT: 'TRANSPORT',
  INVENTORY: 'INVENTORY',
  HOSTEL: 'HOSTEL',
  CERTIFICATE: 'CERTIFICATE',
  COMMUNICATION: 'COMMUNICATION',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
};
