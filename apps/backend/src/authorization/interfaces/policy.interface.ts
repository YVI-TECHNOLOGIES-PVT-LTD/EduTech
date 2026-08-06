export const AUTH_METADATA_KEYS = {
  ROLES: 'auth:roles',
  PERMISSIONS: 'auth:permissions',
  IS_PUBLIC: 'auth:isPublic',
  POLICY: 'auth:policy',
} as const;

export interface PolicyContext {
  user: {
    id: string;
    orgId: string;
    role: string;
    permissions?: string[];
  };
  resource?: any;
  action: string;
}

export interface IPolicy {
  name: string;
  evaluate(context: PolicyContext): boolean | Promise<boolean>;
}
