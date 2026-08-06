export interface RequestUser {
  id: string;
  orgId: string;
  email: string;
  role: string;
  permissions: string[];
}

export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function sanitizeString(input?: string): string {
  if (!input) return '';
  return input.trim().replace(/<[^>]*>?/gm, '');
}

export class CommonValidators {
  public static isNonEmptyString(val: any): boolean {
    return typeof val === 'string' && val.trim().length > 0;
  }

  public static isPositiveNumber(val: any): boolean {
    return typeof val === 'number' && !isNaN(val) && val > 0;
  }
}
