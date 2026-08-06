export interface OpenApiSchema {
  type?: string;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  items?: OpenApiSchema;
  example?: any;
  description?: string;
  [key: string]: any;
}

export class SchemaRegistry {
  private static schemas = new Map<string, OpenApiSchema>();

  public static register(name: string, schema: OpenApiSchema): void {
    this.schemas.set(name, schema);
  }

  public static getSchemas(): Record<string, OpenApiSchema> {
    const result: Record<string, OpenApiSchema> = {};
    for (const [key, value] of this.schemas.entries()) {
      result[key] = value;
    }
    return result;
  }
}

export class SecurityRegistry {
  private static schemes = new Map<string, any>();

  public static register(name: string, scheme: any): void {
    this.schemes.set(name, scheme);
  }

  public static getSchemes(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.schemes.entries()) {
      result[key] = value;
    }
    return result;
  }
}

export class TagRegistry {
  private static tags = new Map<string, { name: string; description: string }>();

  public static register(name: string, description: string): void {
    this.tags.set(name, { name, description });
  }

  public static getTags(): { name: string; description: string }[] {
    return Array.from(this.tags.values());
  }
}

export class ParameterRegistry {
  public static getCommonParameters() {
    return [
      {
        name: 'page',
        in: 'query',
        description: 'Page number (default 1)',
        required: false,
        schema: { type: 'integer', default: 1 },
      },
      {
        name: 'limit',
        in: 'query',
        description: 'Items per page (default 25, max 100)',
        required: false,
        schema: { type: 'integer', default: 25 },
      },
      {
        name: 'sort',
        in: 'query',
        description: 'Sort criteria (e.g. name,-createdAt)',
        required: false,
        schema: { type: 'string' },
      },
      {
        name: 'filter',
        in: 'query',
        description: 'Filter criteria (e.g. status:ACTIVE)',
        required: false,
        schema: { type: 'string' },
      },
      {
        name: 'q',
        in: 'query',
        description: 'Search query string',
        required: false,
        schema: { type: 'string' },
      },
    ];
  }
}

export class ResponseRegistry {
  public static initDefaultResponses(): void {
    SchemaRegistry.register('StandardApiResponse', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: 'Operation successful' },
        meta: { type: 'object' },
        requestId: { type: 'string', example: 'req-12345' },
        timestamp: { type: 'string', example: '2026-08-06T07:08:20.000Z' },
      },
    });

    SchemaRegistry.register('StandardPagedResponse', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'array', items: { type: 'object' } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            totalCount: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 4 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },
        requestId: { type: 'string', example: 'req-12345' },
        timestamp: { type: 'string', example: '2026-08-06T07:08:20.000Z' },
      },
    });

    SchemaRegistry.register('StandardErrorResponse', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Unauthorized access' },
        code: { type: 'string', example: 'UNAUTHORIZED' },
        message: { type: 'string', example: 'Missing or invalid authentication token' },
        requestId: { type: 'string', example: 'req-12345' },
        timestamp: { type: 'string', example: '2026-08-06T07:08:20.000Z' },
      },
    });

    SchemaRegistry.register('StandardValidationResponse', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        validationErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'email' },
              code: { type: 'string', example: 'invalid_string' },
              message: { type: 'string', example: 'Invalid email address' },
            },
          },
        },
        requestId: { type: 'string', example: 'req-12345' },
        timestamp: { type: 'string', example: '2026-08-06T07:08:20.000Z' },
      },
    });
  }
}
