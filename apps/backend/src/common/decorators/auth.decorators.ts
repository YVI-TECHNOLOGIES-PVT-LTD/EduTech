import { METADATA_KEYS } from '../constants/app.constants';

export function Public(): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(METADATA_KEYS.IS_PUBLIC, true, descriptor?.value || target);
  };
}

export function Roles(...roles: string[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(METADATA_KEYS.ROLES, roles, descriptor?.value || target);
  };
}

export function Permissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(METADATA_KEYS.PERMISSIONS, permissions, descriptor?.value || target);
  };
}

export function CurrentUser(): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // Parameter metadata placeholder for request user extraction
  };
}
