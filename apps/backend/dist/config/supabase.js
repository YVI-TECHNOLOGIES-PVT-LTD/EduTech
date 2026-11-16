"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ws_1 = __importDefault(require("ws"));
const env_1 = require("./env");
if (!env_1.env.SUPABASE_URL || !env_1.env.SUPABASE_KEY) {
    throw new Error('Missing Supabase credentials');
}
// Polyfill global WebSocket for Supabase Realtime in Node.js runtime if not present
if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = ws_1.default;
}
exports.supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
