import { ErrorCode } from '../enums/error-code.enum';

export abstract class BaseException extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly errorCode: ErrorCode;

  constructor(
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
