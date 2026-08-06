export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';
export const OWNER_KEY = 'owner';

export function Roles(...roles: string[]) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor ? descriptor.value : target);
  };
}

export function Permissions(...permissions: string[]) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor ? descriptor.value : target);
  };
}

export function Public() {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor ? descriptor.value : target);
  };
}

export function Owner(attributeKey = 'createdBy') {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    Reflect.defineMetadata(OWNER_KEY, attributeKey, descriptor ? descriptor.value : target);
  };
}
