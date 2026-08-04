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
async function runFix() {
    console.log('--- Applying Migration 075 Fix ---');
    const sqlPath = path.join(__dirname, '../database/migrations/075_fix_seating_generation.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing SQL via RPC exec_sql...');
    const { data, error } = await supabase_1.supabase.rpc('exec_sql', { sql });
    if (error) {
        console.error('Migration Failed:', error.message);
        if (error.message.includes('permission denied')) {
            console.log('TIP: Try running this SQL manually in Supabase Dashboard.');
        }
    }
    else {
        console.log('Migration Applied Successfully!');
        console.log('RPC Response:', data);
    }
}
runFix().catch(console.error);
