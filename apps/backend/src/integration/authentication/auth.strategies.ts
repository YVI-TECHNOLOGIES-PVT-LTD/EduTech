import { AuthStrategyType } from '../contracts/integration.contracts';

export class AuthStrategies {
  public static apply(
    type: AuthStrategyType,
    credentials?: Record<string, string>,
    headers: Record<string, string> = {},
  ): Record<string, string> {
    const updatedHeaders = { ...headers };

    if (!credentials) return updatedHeaders;

    switch (type) {
      case 'bearer':
        if (credentials.token) updatedHeaders['Authorization'] = `Bearer ${credentials.token}`;
        break;
      case 'api-key':
        if (credentials.apiKey)
          updatedHeaders[credentials.headerName || 'X-API-Key'] = credentials.apiKey;
        break;
      case 'basic':
        if (credentials.username && credentials.password) {
          const authStr = Buffer.from(`${credentials.username}:${credentials.password}`).toString(
            'base64',
          );
          updatedHeaders['Authorization'] = `Basic ${authStr}`;
        }
        break;
      case 'oauth2':
        if (credentials.accessToken)
          updatedHeaders['Authorization'] = `Bearer ${credentials.accessToken}`;
        break;
      case 'hmac':
        if (credentials.signature) updatedHeaders['X-Signature'] = credentials.signature;
        break;
      default:
        break;
    }

    return updatedHeaders;
  }
}
