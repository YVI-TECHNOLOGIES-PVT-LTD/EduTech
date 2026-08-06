export interface ValidationErrorItem {
  readonly field: string;
  readonly code: string;
  readonly message: string;
  readonly path?: string[];
}

export interface IValidationSchema<T = any> {
  parse(input: any): T;
  safeParse?(input: any): { success: boolean; data?: T; error?: any };
}

export const VALIDATION_REGEX = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
