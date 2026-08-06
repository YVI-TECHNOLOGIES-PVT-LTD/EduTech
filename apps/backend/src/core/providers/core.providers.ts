import { IClock, IIdGenerator } from '../../common/interfaces/common-infra.interfaces';
import { v4 as uuidv4 } from 'uuid';

export class TimeProvider implements IClock {
  public now(): Date {
    return new Date();
  }
  public isoString(): string {
    return new Date().toISOString();
  }
  public timestamp(): number {
    return Date.now();
  }
}

export class UUIDProvider implements IIdGenerator {
  public generateUuid(): string {
    return uuidv4();
  }
}

export interface RequestContextData {
  requestId: string;
  tenantId?: string;
  userId?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
}

export class RequestContextProvider {
  private static storage = new Map<string, RequestContextData>();

  public static set(requestId: string, context: RequestContextData): void {
    this.storage.set(requestId, context);
  }

  public static get(requestId: string): RequestContextData | undefined {
    return this.storage.get(requestId);
  }

  public static clear(requestId: string): void {
    this.storage.delete(requestId);
  }
}
