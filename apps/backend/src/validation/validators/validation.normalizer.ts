import { ValidationErrorItem } from './validation.types';

export class ValidationErrorNormalizer {
  public static normalize(error: any): ValidationErrorItem[] {
    if (!error) return [];

    if (Array.isArray(error.issues)) {
      return error.issues.map((issue: any) => ({
        field: issue.path ? issue.path.join('.') : 'unknown',
        code: issue.code || 'INVALID_INPUT',
        message: issue.message || 'Validation failed',
        path: issue.path || [],
      }));
    }

    if (Array.isArray(error.errors)) {
      return error.errors.map((err: any) => ({
        field: err.path ? err.path.join('.') : err.field || 'unknown',
        code: err.code || 'INVALID_INPUT',
        message: err.message || String(err),
        path: err.path || [],
      }));
    }

    if (typeof error === 'string') {
      return [{ field: 'root', code: 'INVALID_INPUT', message: error }];
    }

    return [{ field: error.field || 'root', code: error.code || 'INVALID_INPUT', message: error.message || 'Validation error' }];
  }
}
