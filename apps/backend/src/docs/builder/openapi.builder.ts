import { API_VERSION } from '../version/api.version';
import {
  SchemaRegistry,
  SecurityRegistry,
  TagRegistry,
  ResponseRegistry,
  ParameterRegistry,
} from '../registry/doc.registries';
import { AuthExamples, HealthExamples, ErrorExamples } from '../examples/doc.examples';

export class OpenApiBuilder {
  public static buildSpec(): Record<string, any> {
    ResponseRegistry.initDefaultResponses();

    // Register Security
    SecurityRegistry.register('BearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Provide JWT Access Token in standard format: Bearer <token>',
    });

    // Register Tags
    TagRegistry.register(
      'Authentication',
      'Identity verification, login, token refresh, and logout endpoints',
    );
    TagRegistry.register(
      'Health Platform',
      'System liveness, readiness, and connectivity health probes',
    );
    TagRegistry.register('System', 'System configuration and metadata');
    TagRegistry.register(
      'Admission',
      'Student admissions, CRM leads, application, and enrollment pipeline',
    );
    TagRegistry.register('Academic', 'Academic year, courses, classes, and section management');
    TagRegistry.register('Student', 'Student profile, enrollment, and section assignments');
    TagRegistry.register('Staff & HR', 'Faculty and staff profile management');
    TagRegistry.register(
      'Fees & Finance',
      'Fee structures, demand generation, and payment collections',
    );

    return {
      openapi: '3.1.0',
      info: {
        title: API_VERSION.title,
        version: API_VERSION.version,
        description: API_VERSION.description,
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Development Server' },
        { url: 'http://127.0.0.1:3000', description: 'Local Loopback Server' },
      ],
      tags: TagRegistry.getTags(),
      components: {
        schemas: SchemaRegistry.getSchemas(),
        securitySchemes: SecurityRegistry.getSchemes(),
        parameters: ParameterRegistry.getCommonParameters(),
      },
      paths: {
        '/health': {
          get: {
            tags: ['Health Platform'],
            summary: 'System Health Check',
            description:
              'Returns overall system health status including configuration and database connectivity',
            operationId: 'getHealth',
            responses: {
              '200': {
                description: 'System healthy',
                content: { 'application/json': { example: HealthExamples.healthOk.value } },
              },
            },
          },
        },
        '/health/live': {
          get: {
            tags: ['Health Platform'],
            summary: 'Liveness Probe',
            description:
              'Kubernetes/Docker liveness probe returning 200 if server process is running',
            operationId: 'getHealthLive',
            responses: {
              '200': { description: 'Server process alive' },
            },
          },
        },
        '/health/ready': {
          get: {
            tags: ['Health Platform'],
            summary: 'Readiness Probe',
            description:
              'Kubernetes readiness probe checking database connectivity and configuration initialization',
            operationId: 'getHealthReady',
            responses: {
              '200': { description: 'Server ready to serve traffic' },
              '503': { description: 'Server unready or database disconnected' },
            },
          },
        },
        '/api/auth/login': {
          post: {
            tags: ['Authentication'],
            summary: 'User Login',
            description:
              'Authenticates user with email and password, returning Access JWT and Refresh Token',
            operationId: 'loginUser',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                      email: { type: 'string', format: 'email', example: 'admin@edutrack.edu' },
                      password: { type: 'string', format: 'password', example: 'Secret123!' },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Login successful',
                content: { 'application/json': { example: AuthExamples.loginSuccess.value } },
              },
              '401': {
                description: 'Invalid credentials',
                content: { 'application/json': { example: ErrorExamples.unauthorized.value } },
              },
            },
          },
        },
        '/api/auth/refresh': {
          post: {
            tags: ['Authentication'],
            summary: 'Refresh Access Token',
            description: 'Generates a new Access JWT using a valid Refresh Token',
            operationId: 'refreshToken',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
            responses: {
              '200': { description: 'Token refreshed successfully' },
              '401': { description: 'Invalid or expired refresh token' },
            },
          },
        },
        '/api/auth/logout': {
          post: {
            tags: ['Authentication'],
            summary: 'User Logout',
            description: 'Revokes active refresh session and invalidates tokens',
            operationId: 'logoutUser',
            responses: {
              '200': { description: 'Logout successful' },
            },
          },
        },
        '/api/auth/me': {
          get: {
            tags: ['Authentication'],
            summary: 'Current User Profile',
            description: 'Returns identity profile of authenticated user',
            operationId: 'getCurrentUser',
            security: [{ BearerAuth: [] }],
            responses: {
              '200': { description: 'Current user profile retrieved' },
              '401': { description: 'Unauthorized access' },
            },
          },
        },
      },
    };
  }
}
