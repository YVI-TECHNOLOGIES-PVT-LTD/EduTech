"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigration() {
    console.log('--- Applying Migration 088 (Workflow Platform) ---');
    const sqlPath = path.join(__dirname, '../database/migrations/088_workflow_automation_engine.sql');
    const rawSql = fs.readFileSync(sqlPath, 'utf8');
    // 1. Strip all SQL single-line comments
    const cleanSql = rawSql.replace(/--.*$/gm, '');
    // 2. Split by semicolon, clean spaces and transaction boundaries
    const sqlQueries = cleanSql
        .split(';')
        .map(q => q.trim())
        .filter(q => {
        if (!q)
            return false;
        const lower = q.toLowerCase();
        if (lower === 'begin' || lower === 'commit' || lower === 'rollback') {
            return false;
        }
        return true;
    });
    console.log(`Executing ${sqlQueries.length} SQL statements via RPC exec_transaction_queries...`);
    // Log the queries to verify
    for (let i = 0; i < sqlQueries.length; i++) {
        console.log(`[Query ${i + 1}]: ${sqlQueries[i].substring(0, 80)}...`);
    }
    const { data, error } = await supabase_1.supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });
    if (error) {
        console.error('Migration Failed:', error.message);
        process.exit(1);
    }
    else {
        console.log('✅ Migration Applied Successfully!');
        console.log('RPC Response:', data);
    }
}
runMigration().catch(console.error);
