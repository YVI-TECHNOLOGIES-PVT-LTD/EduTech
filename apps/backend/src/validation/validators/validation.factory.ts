import { Request, Response, NextFunction } from 'express';
import { IValidationSchema } from './validation.types';
import { ValidationErrorNormalizer } from './validation.normalizer';
import { ValidationException } from '../../common/exceptions/validation.exception';

export class ValidationRegistry {
  private static schemas = new Map<string, IValidationSchema>();

  public static register<T>(key: string, schema: IValidationSchema<T>): void {
    this.schemas.set(key, schema);
  }

  public static resolve<T>(key: string): IValidationSchema<T> | undefined {
    return this.schemas.get(key);
  }
}

export class ValidationFactory {
  public static validateBody<T>(schema: IValidationSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (err: any) {
        const normalized = ValidationErrorNormalizer.normalize(err);
        next(new ValidationException('Body validation failed', { errors: normalized }));
      }
    };
  }

  public static validateQuery<T>(schema: IValidationSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.query = schema.parse(req.query) as any;
        next();
      } catch (err: any) {
        const normalized = ValidationErrorNormalizer.normalize(err);
        next(new ValidationException('Query validation failed', { errors: normalized }));
      }
    };
  }

  public static validateParams<T>(schema: IValidationSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.params = schema.parse(req.params) as any;
        next();
      } catch (err: any) {
        const normalized = ValidationErrorNormalizer.normalize(err);
        next(new ValidationException('Params validation failed', { errors: normalized }));
      }
    };
  }
}
