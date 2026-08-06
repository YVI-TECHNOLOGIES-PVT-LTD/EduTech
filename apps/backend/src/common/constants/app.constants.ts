export const APP_CONSTANTS = {
  NAME: 'EduTrack ERP',
  API_PREFIX: '/api',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CORRELATION_ID_HEADER: 'x-request-id',
  TENANT_ID_HEADER: 'x-tenant-id',
} as const;

export const METADATA_KEYS = {
  IS_PUBLIC: 'isPublic',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  POLICY: 'policy',
} as const;
