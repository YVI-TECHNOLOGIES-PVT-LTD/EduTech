import { ValidationErrorItem } from '../../validation/validators/validation.types';

export interface StandardApiResponse<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly message?: string;
  readonly meta?: Record<string, any>;
  readonly requestId?: string;
  readonly timestamp: string;
}

export interface StandardPagedResponse<T = any> extends StandardApiResponse<T[]> {
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly totalCount: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPrevPage: boolean;
  };
}

export interface StandardErrorResponse extends StandardApiResponse<null> {
  readonly error: string;
  readonly code: string;
  readonly details?: any;
}

export interface StandardValidationResponse extends StandardApiResponse<null> {
  readonly validationErrors: readonly ValidationErrorItem[];
}

export class ApiResponseBuilder {
  public static success<T>(
    data: T,
    message = 'Operation successful',
    meta?: Record<string, any>,
    requestId?: string,
  ): StandardApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  public static created<T>(
    data: T,
    message = 'Resource created successfully',
    requestId?: string,
  ): StandardApiResponse<T> {
    return this.success(data, message, undefined, requestId);
  }

  public static updated<T>(
    data: T,
    message = 'Resource updated successfully',
    requestId?: string,
  ): StandardApiResponse<T> {
    return this.success(data, message, undefined, requestId);
  }

  public static deleted(
    message = 'Resource deleted successfully',
    requestId?: string,
  ): StandardApiResponse<null> {
    return this.success(null, message, undefined, requestId);
  }

  public static paged<T>(
    items: T[],
    page: number,
    limit: number,
    totalCount: number,
    message = 'Data retrieved successfully',
    requestId?: string,
  ): StandardPagedResponse<T> {
    const totalPages = Math.ceil(totalCount / (limit || 1));
    return {
      success: true,
      data: items,
      message,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  public static validation(
    errors: ValidationErrorItem[],
    message = 'Validation failed',
    requestId?: string,
  ): StandardValidationResponse {
    return {
      success: false,
      validationErrors: Object.freeze([...errors]),
      message,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  public static error(
    message: string,
    code = 'INTERNAL_ERROR',
    details?: any,
    requestId?: string,
  ): StandardErrorResponse {
    return {
      success: false,
      error: message,
      code,
      details,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }
}
