/**
 * @file prismaClient.ts
 * @description Singleton PrismaClient with strict PostgreSQL durability enforcement.
 *
 * Stage 3 Phase 2 Hardening:
 * - Zero silent in-memory fallback Maps or synthetic delegates.
 * - Real generated delegates (including financial delegates) execute directly against PostgreSQL.
 * - Unmapped/unsynchronized Prisma model delegates fail fast with an explicit PersistenceError.
 */

import { PrismaClient } from '@prisma/client';

export class PersistenceError extends Error {
  public readonly code = 'PRISMA_DELEGATE_UNAVAILABLE';
  public readonly statusCode = 500;
  public readonly model: string;
  public readonly operation?: string;

  constructor(model: string, operation?: string, cause?: unknown) {
    const opSuffix = operation ? `.${operation}` : '';
    super(
      `[PersistenceError] Prisma delegate '${model}${opSuffix}' is not available in the generated @prisma/client DMMF. Silent in-memory fallback is disabled; synchronize Prisma Client or use explicit parameterized SQL persistence.`,
    );
    this.name = 'PersistenceError';
    this.model = model;
    this.operation = operation;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
    Object.setPrototypeOf(this, PersistenceError.prototype);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const READ_ONLY_DELEGATE_METHODS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const RETRYABLE_CLIENT_METHODS = new Set(['$queryRaw', '$queryRawUnsafe', '$connect']);

const TRANSIENT_ERROR_CODES = new Set([
  'P1001',
  'P1008',
  'P1017',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
]);

function isTransientConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const record = err as { code?: unknown; message?: unknown };
  if (typeof record.code === 'string' && TRANSIENT_ERROR_CODES.has(record.code)) {
    return true;
  }
  const msg = typeof record.message === 'string' ? record.message : '';
  return (
    msg.includes('Server has closed the connection') ||
    msg.includes('Connection terminated unexpectedly') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes("Can't reach database server")
  );
}

async function withTransientRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > maxRetries || !isTransientConnectionError(err)) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
}

function createUnavailableDelegateProxy(modelName: string) {
  const throwMissing = (operation?: string) => {
    throw new PersistenceError(modelName, operation);
  };

  return new Proxy(() => undefined, {
    get(_target, opProp) {
      if (typeof opProp === 'symbol') return undefined;
      if (opProp === 'then' || opProp === 'catch' || opProp === 'finally') return undefined;
      if (opProp === 'toJSON') return () => ({ unavailableModel: modelName });
      return async () => {
        throwMissing(opProp);
      };
    },
    apply() {
      throwMissing();
    },
  });
}

function wrapModelDelegate(delegate: any) {
  return new Proxy(delegate, {
    get(modelObj, methodProp) {
      const value = modelObj[methodProp as any];
      if (typeof methodProp !== 'string' || typeof value !== 'function') {
        return value;
      }
      if (!READ_ONLY_DELEGATE_METHODS.has(methodProp)) {
        return value.bind(modelObj);
      }
      return (...args: any[]) => withTransientRetry(() => value.apply(modelObj, args));
    },
  });
}

const unmappedDelegateProxies = new Map<string, any>();

function wrapPrismaWithStrictPersistence<T extends object>(target: T): T {
  if ((target as any)?.__isStrictPrismaProxy) {
    return target;
  }

  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      if (prop === '__isStrictPrismaProxy') {
        return true;
      }

      if (typeof prop === 'symbol') {
        return obj[prop];
      }

      if (prop in obj && obj[prop] !== undefined) {
        if (prop === '$transaction') {
          const txMethod = obj[prop];
          return function (arg: any, ...rest: any[]) {
            if (typeof arg === 'function') {
              return txMethod.call(
                obj,
                async (tx: any) => arg(wrapPrismaWithStrictPersistence(tx)),
                ...rest,
              );
            }
            return txMethod.call(obj, arg, ...rest);
          };
        }

        const val = obj[prop];
        if (typeof val === 'function') {
          if (RETRYABLE_CLIENT_METHODS.has(prop)) {
            return (...args: any[]) => withTransientRetry(() => val.apply(obj, args));
          }
          return val.bind(obj);
        }

        if (
          val !== null &&
          typeof val === 'object' &&
          !prop.startsWith('$') &&
          !prop.startsWith('_')
        ) {
          return wrapModelDelegate(val);
        }

        return val;
      }

      if (
        !prop.startsWith('$') &&
        !prop.startsWith('_') &&
        prop !== 'then' &&
        prop !== 'catch' &&
        prop !== 'finally' &&
        prop !== 'toJSON'
      ) {
        let proxy = unmappedDelegateProxies.get(prop);
        if (!proxy) {
          proxy = createUnavailableDelegateProxy(prop);
          unmappedDelegateProxies.set(prop, proxy);
        }
        return proxy;
      }

      return undefined;
    },
  });
}

const rawPrisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = rawPrisma;
}

const prisma = wrapPrismaWithStrictPersistence(rawPrisma);

export { rawPrisma };
export default prisma;
