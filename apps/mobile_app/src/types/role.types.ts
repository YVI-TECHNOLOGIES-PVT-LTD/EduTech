export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'ADMISSION_OFFICER'
  | 'COUNSELOR'
  | 'PRINCIPAL'
  | 'ACADEMIC_COORDINATOR'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT'
  | 'ACCOUNTANT'
  | 'HR'
  | 'TRANSPORT_MANAGER'
  | 'LIBRARIAN'
  | 'HOSTEL_WARDEN'
  | 'RECEPTION'
  | 'SECURITY'
  | 'MANAGEMENT';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'APPROVE';

export type PermissionResource =
  | 'ADMISSION'
  | 'STUDENT'
  | 'TEACHER'
  | 'FINANCE'
  | 'HR'
  | 'LIBRARY'
  | 'TRANSPORT'
  | 'INVENTORY'
  | 'HOSTEL'
  | 'CERTIFICATE'
  | 'COMMUNICATION'
  | 'REPORTS'
  | 'SETTINGS';

export interface UserPermission {
  resource: PermissionResource;
  actions: PermissionAction[];
}
