export class ApiError extends Error {
  statusCode: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}
