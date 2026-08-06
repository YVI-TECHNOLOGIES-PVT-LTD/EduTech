import { loggerService } from '../logger.service';

export enum ErrorCategory {
  VALIDATION = 'ValidationError',
  AUTHENTICATION = 'AuthenticationError',
  AUTHORIZATION = 'AuthorizationError',
  BUSINESS = 'BusinessError',
  INFRASTRUCTURE = 'InfrastructureError',
  UNKNOWN = 'UnknownError',
}

export class ClassifiedErrorLogger {
  public static log(
    error: any,
    category = ErrorCategory.UNKNOWN,
    meta?: Record<string, any>,
  ): void {
    const errorMeta = {
      category,
      name: error?.name || 'Error',
      message: error?.message || String(error),
      stack: error?.stack,
      ...meta,
    };
    loggerService.error(`[${category}] ${error?.message || String(error)}`, error, errorMeta);
  }
}
