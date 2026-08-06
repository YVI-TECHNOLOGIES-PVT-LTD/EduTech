export const AuthExamples = {
  loginSuccess: {
    value: {
      success: true,
      data: {
        user: {
          id: 'usr_12345',
          email: 'admin@edutrack.edu',
          orgId: 'org_001',
          role: 'ADMIN',
          roles: ['ADMIN'],
          permissions: ['*'],
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'usr_12345.jti_99.abc123def456...',
        expiresInSeconds: 900,
      },
      message: 'Authentication successful',
      requestId: 'req-login-001',
      timestamp: '2026-08-06T07:08:20.000Z',
    },
  },
};

export const HealthExamples = {
  healthOk: {
    value: {
      status: 'ok',
      timestamp: '2026-08-06T07:08:20.000Z',
      checks: {
        config: { status: 'up' },
        database: { status: 'up' },
      },
    },
  },
};

export const ErrorExamples = {
  unauthorized: {
    value: {
      success: false,
      error: 'Authentication failed',
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header',
      requestId: 'req-err-001',
      timestamp: '2026-08-06T07:08:20.000Z',
    },
  },
  forbidden: {
    value: {
      success: false,
      error: 'Access denied',
      code: 'FORBIDDEN',
      message: 'Forbidden: Insufficient permissions for requested resource',
      requestId: 'req-err-002',
      timestamp: '2026-08-06T07:08:20.000Z',
    },
  },
};
