import { BaseException } from './base.exception';
import { ErrorCode } from '../enums/error-code.enum';

export class AuthenticationException extends BaseException {
  public readonly statusCode = 401;
  public readonly errorCode = ErrorCode.UNAUTHORIZED;

  constructor(message = 'Authentication required', details?: Record<string, any>) {
    super(message, details);
  }
}

export class AuthorizationException extends BaseException {
  public readonly statusCode = 403;
  public readonly errorCode = ErrorCode.FORBIDDEN;

  constructor(message = 'Access forbidden', details?: Record<string, any>) {
    super(message, details);
  }
}

export class NotFoundException extends BaseException {
  public readonly statusCode = 404;
  public readonly errorCode = ErrorCode.NOT_FOUND;

  constructor(message = 'Resource not found', details?: Record<string, any>) {
    super(message, details);
  }
}

export class ConflictException extends BaseException {
  public readonly statusCode = 409;
  public readonly errorCode = ErrorCode.CONFLICT;

  constructor(message = 'Resource conflict', details?: Record<string, any>) {
    super(message, details);
  }
}

export class BusinessRuleException extends BaseException {
  public readonly statusCode = 422;
  public readonly errorCode = ErrorCode.BUSINESS_RULE_VIOLATION;

  constructor(message = 'Business rule violation', details?: Record<string, any>) {
    super(message, details);
  }
}

export class InfrastructureException extends BaseException {
  public readonly statusCode = 500;
  public readonly errorCode = ErrorCode.INFRASTRUCTURE_ERROR;

  constructor(message = 'Infrastructure service error', details?: Record<string, any>) {
    super(message, details);
  }
}
