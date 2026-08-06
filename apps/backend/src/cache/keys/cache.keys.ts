import crypto from 'crypto';
import { CacheKeyParams } from '../contracts/cache.contracts';

export class VersionResolver {
  public static resolve(providedVersion?: string): string {
    return providedVersion || 'v1';
  }
}

export class CacheNamespace {
  public static readonly AUTH = 'auth';
  public static readonly CONFIG = 'config';
  public static readonly PERMISSIONS = 'permissions';
  public static readonly STUDENT = 'student';
  public static readonly ADMISSION = 'admission';
  public static readonly ACADEMIC = 'academic';
  public static readonly FEES = 'fees';
}

export class CacheKeyHash {
  public static hash(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }
}

export class CacheKeyBuilder {
  public static build(params: CacheKeyParams): string {
    const env = params.environment || process.env.NODE_ENV || 'development';
    const app = params.application || 'edutrack';
    const tenant = params.tenantId || 'global';
    const version = VersionResolver.resolve(params.version);

    return `${env}:${app}:${tenant}:${params.module}:${params.resource}:${params.identifier}:${version}`;
  }
}
