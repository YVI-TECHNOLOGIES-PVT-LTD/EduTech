import { Request, Response, NextFunction } from 'express';

export class XssSanitizer {
  public static sanitizeString(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/script/gi, 'scr_ipt')
      .replace(/javascript:/gi, 'java_script:');
  }

  public static sanitizeObject(input: any): any {
    if (typeof input === 'string') return this.sanitizeString(input);
    if (typeof input !== 'object' || input === null) return input;
    if (Array.isArray(input)) return input.map((item) => this.sanitizeObject(item));

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized;
  }
}

export function inputSanitizerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = XssSanitizer.sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = XssSanitizer.sanitizeObject(req.query);
  }
  next();
}
