export class AppError extends Error {
  code: string;

  constructor(message: string, code: string = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}
