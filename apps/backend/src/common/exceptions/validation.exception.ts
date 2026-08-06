import { BaseException } from './base.exception';
import { ErrorCode } from '../enums/error-code.enum';

export class ValidationException extends BaseException {
  public readonly statusCode = 400;
  public readonly errorCode = ErrorCode.VALIDATION_ERROR;

  constructor(message = 'Validation failed', details?: Record<string, any>) {
    super(message, details);
  }
}
