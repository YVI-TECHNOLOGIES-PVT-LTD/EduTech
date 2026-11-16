export class ChatbotError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'CHATBOT_ERROR') {
    super(message);
    this.name = 'ChatbotError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ChatbotSessionNotFoundError extends ChatbotError {
  constructor(sessionId: string) {
    super(`Chatbot session '${sessionId}' was not found or has expired.`, 404, 'SESSION_NOT_FOUND');
    this.name = 'ChatbotSessionNotFoundError';
  }
}

export class ChatbotTenantMismatchError extends ChatbotError {
  constructor() {
    super(
      'The requested session does not belong to the resolved tenant organization.',
      403,
      'TENANT_MISMATCH',
    );
    this.name = 'ChatbotTenantMismatchError';
  }
}

export class ChatbotValidationError extends ChatbotError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ChatbotValidationError';
  }
}
