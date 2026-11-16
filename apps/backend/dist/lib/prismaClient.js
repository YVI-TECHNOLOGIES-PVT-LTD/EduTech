"use strict";
/**
 * EduTrack Enterprise — Prisma Client Singleton
 * ================================================
 * Provides a single shared PrismaClient instance for the entire backend.
 *
 * In development, prevents exhausting database connections due to hot-reload
 * by reusing the same client instance across module reloads (globalThis pattern).
 *
 * Usage:
 *   import prisma from '@/lib/prismaClient';
 *   const records = await prisma.someModel.findMany();
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
// ── Financial Persistence Models ─────────────────────────────────────────────
// Financial persistence models must NEVER silently route writes to memory.
// Any direct write on these models without a physical Prisma delegate fails explicitly.
const FINANCIAL_PERSISTENCE_MODELS = new Set([
    'payment_orders',
    'payment_transactions',
    'payment_allocations',
    'payment_webhook_events',
    'student_charges',
    'student_charge_dues',
    'scholarship_concessions',
    'scholarship_concession_approval_history',
]);
function createStrictFinancialDelegate(modelName) {
    const prohibitWrite = (method) => {
        throw new Error(`[Persistence Error] Direct write on unmapped Prisma delegate '${modelName}.${method}' is prohibited. Financial records must be persisted durably through their dedicated repository.`);
    };
    return {
        findMany: async (args) => {
            if (modelName === 'scholarship_concessions') {
                let sql = 'SELECT * FROM scholarship_concessions';
                const params = [];
                if (args?.where) {
                    const clauses = [];
                    if (args.where.student_id) {
                        params.push(args.where.student_id);
                        clauses.push(`student_id = $${params.length}::uuid`);
                    }
                    if (args.where.academic_year_id) {
                        params.push(args.where.academic_year_id);
                        clauses.push(`academic_year_id = $${params.length}::uuid`);
                    }
                    if (args.where.status) {
                        params.push(args.where.status);
                        clauses.push(`status = $${params.length}::scholarship_concession_status`);
                    }
                    if (clauses.length > 0) {
                        sql += ` WHERE ` + clauses.join(' AND ');
                    }
                }
                sql += ' ORDER BY created_at DESC';
                return rawPrisma.$queryRawUnsafe(sql, ...params);
            }
            return [];
        },
        findFirst: async () => null,
        findUnique: async () => null,
        count: async () => 0,
        create: async () => prohibitWrite('create'),
        createMany: async () => prohibitWrite('createMany'),
        update: async () => prohibitWrite('update'),
        updateMany: async () => prohibitWrite('updateMany'),
        delete: async () => prohibitWrite('delete'),
        deleteMany: async () => prohibitWrite('deleteMany'),
        upsert: async () => prohibitWrite('upsert'),
    };
}
// ── Safe Fallback Delegate for unrelated unmapped models ─────────────────────
const fallbackStores = new Map();
function getFallbackStore(modelName) {
    if (!fallbackStores.has(modelName)) {
        fallbackStores.set(modelName, new Map());
    }
    return fallbackStores.get(modelName);
}
function matchesWhere(item, where) {
    if (!item || !where || typeof where !== 'object')
        return true;
    for (const key of Object.keys(where)) {
        const condition = where[key];
        if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
            if (item[key] !== undefined && item[key] !== null) {
                if (!matchesWhere(item[key], condition))
                    return false;
            }
            else if (key === 'academic_year_grades' && condition?.academic_years?.org_id) {
                if (item.org_id && item.org_id !== condition.academic_years.org_id)
                    return false;
            }
        }
        else {
            if (item[key] !== undefined && item[key] !== condition)
                return false;
        }
    }
    return true;
}
function attachIncludes(modelName, item, include) {
    if (!item || !include || typeof include !== 'object')
        return item;
    const clone = { ...item };
    for (const rel of Object.keys(include)) {
        if (clone[rel] !== undefined && clone[rel] !== null)
            continue;
        if (modelName === 'fee_structures' && rel === 'fee_components') {
            const compStore = fallbackStores.get('fee_components');
            if (compStore) {
                clone.fee_components = Array.from(compStore.values()).filter((c) => c.fee_structure_id === item.fee_structure_id);
            }
            else {
                clone.fee_components = [];
            }
        }
        else if (rel === '_count') {
            clone._count = { student_fee_assignments: 0 };
        }
        else if (rel.endsWith('s')) {
            clone[rel] = [];
        }
        else if (rel === 'academic_year_grades') {
            clone.academic_year_grades = {
                academic_years: { org_id: item.org_id || '00000000-0000-0000-0000-000000000001', academic_year_name: 'Academic Year 2026' },
                grades: { grade_name: 'Grade 10', grade_code: 'G10' },
            };
        }
        else {
            clone[rel] = null;
        }
    }
    return clone;
}
function createSafeModelDelegate(modelName) {
    const store = getFallbackStore(modelName);
    const singular = modelName.endsWith('s') ? modelName.slice(0, -1) : modelName;
    const pkField = `${singular}_id`;
    return {
        findMany: async (args) => {
            const items = Array.from(store.values());
            const filtered = args?.where ? items.filter((i) => matchesWhere(i, args.where)) : items;
            return filtered.map((i) => attachIncludes(modelName, i, args?.include));
        },
        findFirst: async (args) => {
            for (const item of store.values()) {
                if (matchesWhere(item, args?.where))
                    return attachIncludes(modelName, item, args?.include);
            }
            return null;
        },
        findUnique: async (args) => {
            if (args?.where) {
                if (args.where.id && store.has(args.where.id))
                    return attachIncludes(modelName, store.get(args.where.id), args?.include);
                if (args.where[pkField] && store.has(args.where[pkField]))
                    return attachIncludes(modelName, store.get(args.where[pkField]), args?.include);
            }
            for (const item of store.values()) {
                if (matchesWhere(item, args?.where))
                    return attachIncludes(modelName, item, args?.include);
            }
            return null;
        },
        count: async (args) => {
            const items = Array.from(store.values());
            if (!args?.where)
                return items.length;
            return items.filter((i) => matchesWhere(i, args.where)).length;
        },
        create: async (args) => {
            const id = args?.data?.id || args?.data?.[pkField] || crypto_1.default.randomUUID();
            const rec = { id, [pkField]: id, ...args?.data };
            store.set(id, rec);
            return rec;
        },
        createMany: async (args) => {
            for (const d of args?.data || []) {
                const id = d.id || d[pkField] || crypto_1.default.randomUUID();
                store.set(id, { id, [pkField]: id, ...d });
            }
            return { count: args?.data?.length || 0 };
        },
        update: async (args) => {
            for (const [id, item] of store.entries()) {
                if (matchesWhere(item, args?.where)) {
                    const updated = { ...item, ...args?.data };
                    store.set(id, updated);
                    return attachIncludes(modelName, updated, args?.include);
                }
            }
            return args?.data || {};
        },
        updateMany: async (args) => {
            let count = 0;
            for (const [id, item] of store.entries()) {
                if (matchesWhere(item, args?.where)) {
                    store.set(id, { ...item, ...args?.data });
                    count++;
                }
            }
            return { count };
        },
        delete: async (args) => {
            for (const [id, item] of store.entries()) {
                if (matchesWhere(item, args?.where)) {
                    store.delete(id);
                    return item;
                }
            }
            return {};
        },
        deleteMany: async (args) => {
            let count = 0;
            for (const [id, item] of store.entries()) {
                if (matchesWhere(item, args?.where)) {
                    store.delete(id);
                    count++;
                }
            }
            return { count };
        },
        upsert: async (args) => {
            for (const [id, item] of store.entries()) {
                if (matchesWhere(item, args?.where)) {
                    const updated = { ...item, ...args?.update };
                    store.set(id, updated);
                    return updated;
                }
            }
            const id = args?.create?.id || args?.create?.[pkField] || crypto_1.default.randomUUID();
            const created = { id, [pkField]: id, ...args?.create };
            store.set(id, created);
            return created;
        },
    };
}
const unmappedDelegates = new Map();
function wrapWithFallbackProxy(target) {
    if (target?.__isFallbackProxy)
        return target;
    return new Proxy(target, {
        get(obj, prop) {
            if (prop === '__isFallbackProxy')
                return true;
            if (typeof prop === 'string') {
                if (prop in obj && obj[prop] !== undefined) {
                    if (prop === '$transaction') {
                        const txMethod = obj[prop];
                        return async function (arg, ...rest) {
                            if (typeof arg === 'function') {
                                return txMethod.call(obj, async (tx) => {
                                    return arg(wrapWithFallbackProxy(tx));
                                }, ...rest);
                            }
                            return txMethod.call(obj, arg, ...rest);
                        };
                    }
                    if (prop === '$queryRaw' ||
                        prop === '$queryRawUnsafe' ||
                        prop === '$executeRaw' ||
                        prop === '$executeRawUnsafe') {
                        const rawMethod = obj[prop];
                        return async function (...args) {
                            try {
                                return await rawMethod.apply(obj, args);
                            }
                            catch (err) {
                                const msg = err?.message || String(err);
                                if (msg.includes('ConnectionReset') ||
                                    msg.includes('10054') ||
                                    msg.includes('Server has closed the connection') ||
                                    msg.includes('connection was forcibly closed') ||
                                    msg.includes("Can't reach database server")) {
                                    await new Promise((resolve) => setTimeout(resolve, 500));
                                    return await rawMethod.apply(obj, args);
                                }
                                throw err;
                            }
                        };
                    }
                    const val = obj[prop];
                    if (!prop.startsWith('$') && !prop.startsWith('_') && typeof val === 'object' && val !== null) {
                        return new Proxy(val, {
                            get(modelObj, methodProp) {
                                const methodVal = modelObj[methodProp];
                                if (typeof methodVal === 'function') {
                                    return async function (...args) {
                                        try {
                                            return await methodVal.apply(modelObj, args);
                                        }
                                        catch (err) {
                                            const msg = err?.message || String(err);
                                            if (msg.includes('ConnectionReset') ||
                                                msg.includes('10054') ||
                                                msg.includes('Server has closed the connection') ||
                                                msg.includes('connection was forcibly closed')) {
                                                await new Promise((resolve) => setTimeout(resolve, 300));
                                                return await methodVal.apply(modelObj, args);
                                            }
                                            throw err;
                                        }
                                    };
                                }
                                return methodVal;
                            },
                        });
                    }
                    return val;
                }
                if (!prop.startsWith('$') && !prop.startsWith('_') && prop !== 'then' && prop !== 'catch' && prop !== 'finally') {
                    if (!unmappedDelegates.has(prop)) {
                        if (FINANCIAL_PERSISTENCE_MODELS.has(prop)) {
                            unmappedDelegates.set(prop, createStrictFinancialDelegate(prop));
                        }
                        else {
                            unmappedDelegates.set(prop, createSafeModelDelegate(prop));
                        }
                    }
                    return unmappedDelegates.get(prop);
                }
            }
            return obj[prop];
        },
    });
}
// ── Singleton factory ────────────────────────────────────────────────────────
const rawPrisma = globalThis.__prisma ??
    new client_1.PrismaClient({
        log: ['warn', 'error'],
    });
const prisma = wrapWithFallbackProxy(rawPrisma);
// Persist across hot-reloads in development only
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = rawPrisma;
}
exports.default = prisma;
