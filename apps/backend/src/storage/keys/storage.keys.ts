import crypto from 'crypto';
import { StorageFileKeyParams } from '../contracts/storage.contracts';

export class StorageNamespace {
  public static readonly STUDENT = 'student';
  public static readonly STAFF = 'staff';
  public static readonly ACADEMIC = 'academic';
  public static readonly ADMISSION = 'admission';
  public static readonly FEES = 'fees';
  public static readonly SYSTEM = 'system';
}

export class StorageKeyBuilder {
  public static build(params: StorageFileKeyParams): string {
    const env = params.environment || process.env.NODE_ENV || 'development';
    const tenant = params.tenantId || 'global';
    const uuid = crypto.randomUUID().split('-')[0];

    const sanitizedFilename = params.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${env}/${tenant}/${params.module}/${params.resource}/${uuid}/${sanitizedFilename}`;
  }
}
