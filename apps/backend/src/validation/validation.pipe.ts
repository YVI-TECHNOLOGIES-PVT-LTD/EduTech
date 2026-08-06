import { ValidationException } from '../common/exceptions/validation.exception';

export interface IValidationPipe<T = any> {
  transform(value: any): T;
}

export class ZodValidationPipe<T = any> implements IValidationPipe<T> {
  constructor(private schema: { parse: (val: any) => T }) {}

  public transform(value: any): T {
    try {
      return this.schema.parse(value);
    } catch (err: any) {
      throw new ValidationException('Input validation failed', {
        errors: err.errors || err.message,
      });
    }
  }
}

export class LegacyValidationFactory {
  public static createZodPipe<T>(schema: { parse: (val: any) => T }): ZodValidationPipe<T> {
    return new ZodValidationPipe<T>(schema);
  }
}
