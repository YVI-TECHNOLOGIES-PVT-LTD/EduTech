"use strict";
/**
 * @file prismaClient.ts
 * @description Singleton PrismaClient with strict PostgreSQL durability enforcement.
 *
 * Stage 3 Phase 2 Hardening:
 * - Zero silent in-memory fallback Maps or synthetic delegates.
 * - Real generated delegates (including financial delegates) execute directly against PostgreSQL.
 * - Unmapped/unsynchronized Prisma model delegates fail fast with an explicit PersistenceError.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawPrisma = exports.PersistenceError = void 0;
const client_1 = require("@prisma/client");
class PersistenceError extends Error {
    constructor(model, operation, cause) {
        const opSuffix = operation ? `.${operation}` : '';
        super(`[PersistenceError] Prisma delegate '${model}${opSuffix}' is not available in the generated @prisma/client DMMF. Silent in-memory fallback is disabled; synchronize Prisma Client or use explicit parameterized SQL persistence.`);
        this.code = 'PRISMA_DELEGATE_UNAVAILABLE';
        this.statusCode = 500;
        this.name = 'PersistenceError';
        this.model = model;
        this.operation = operation;
        if (cause !== undefined) {
            this.cause = cause;
        }
        Object.setPrototypeOf(this, PersistenceError.prototype);
    }
}
exports.PersistenceError = PersistenceError;
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
function isTransientConnectionError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const record = err;
    if (typeof record.code === 'string' && TRANSIENT_ERROR_CODES.has(record.code)) {
        return true;
    }
    const msg = typeof record.message === 'string' ? record.message : '';
    return (msg.includes('Server has closed the connection') ||
        msg.includes('Connection terminated unexpectedly') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes("Can't reach database server"));
}
async function withTransientRetry(fn, maxRetries = 2) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        }
        catch (err) {
            attempt += 1;
            if (attempt > maxRetries || !isTransientConnectionError(err)) {
                throw err;
            }
            await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        }
    }
}
function createUnavailableDelegateProxy(modelName) {
    const throwMissing = (operation) => {
        throw new PersistenceError(modelName, operation);
    };
    return new Proxy(() => undefined, {
        get(_target, opProp) {
            if (typeof opProp === 'symbol')
                return undefined;
            if (opProp === 'then' || opProp === 'catch' || opProp === 'finally')
                return undefined;
            if (opProp === 'toJSON')
                return () => ({ unavailableModel: modelName });
            return async () => {
                throwMissing(opProp);
            };
        },
        apply() {
            throwMissing();
        },
    });
}
function wrapModelDelegate(delegate) {
    return new Proxy(delegate, {
        get(modelObj, methodProp) {
            const value = modelObj[methodProp];
            if (typeof methodProp !== 'string' || typeof value !== 'function') {
                return value;
            }
            if (!READ_ONLY_DELEGATE_METHODS.has(methodProp)) {
                return value.bind(modelObj);
            }
            return (...args) => withTransientRetry(() => value.apply(modelObj, args));
        },
    });
}
const unmappedDelegateProxies = new Map();
function wrapPrismaWithStrictPersistence(target) {
    if (target?.__isStrictPrismaProxy) {
        return target;
    }
    return new Proxy(target, {
        get(obj, prop) {
            if (prop === '__isStrictPrismaProxy') {
                return true;
            }
            if (typeof prop === 'symbol') {
                return obj[prop];
            }
            if (prop in obj && obj[prop] !== undefined) {
                if (prop === '$transaction') {
                    const txMethod = obj[prop];
                    return function (arg, ...rest) {
                        if (typeof arg === 'function') {
                            return txMethod.call(obj, async (tx) => arg(wrapPrismaWithStrictPersistence(tx)), ...rest);
                        }
                        return txMethod.call(obj, arg, ...rest);
                    };
                }
                const val = obj[prop];
                if (typeof val === 'function') {
                    if (RETRYABLE_CLIENT_METHODS.has(prop)) {
                        return (...args) => withTransientRetry(() => val.apply(obj, args));
                    }
                    return val.bind(obj);
                }
                if (val !== null &&
                    typeof val === 'object' &&
                    !prop.startsWith('$') &&
                    !prop.startsWith('_')) {
                    return wrapModelDelegate(val);
                }
                return val;
            }
            if (!prop.startsWith('$') &&
                !prop.startsWith('_') &&
                prop !== 'then' &&
                prop !== 'catch' &&
                prop !== 'finally' &&
                prop !== 'toJSON') {
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
const rawPrisma = globalThis.__prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
    });
exports.rawPrisma = rawPrisma;
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = rawPrisma;
}
const prisma = wrapPrismaWithStrictPersistence(rawPrisma);
exports.default = prisma;
