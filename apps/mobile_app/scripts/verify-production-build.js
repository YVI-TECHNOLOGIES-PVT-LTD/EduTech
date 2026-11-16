#!/usr/bin/env node
/**
 * Strict Production Build Guard Pre-Flight Verification Script
 * Validates that all production environment requirements are strictly met
 * before compiling the release Android APK.
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const VERIFIED_PRODUCTION_HOST = 'edutrack-backend-0fyq.onrender.com';
const EXPECTED_API_PATH = '/api';

console.log('====================================================');
console.log('  EDUTRACK MOBILE — STRICT PRODUCTION BUILD GUARD   ');
console.log('====================================================\n');

// 1. Resolve environment variables
// Read from process.env or .env / .env.production
const envPath = path.join(__dirname, '..', '.env.production');
let fileEnv = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      fileEnv[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL || fileEnv.EXPO_PUBLIC_API_URL;
const wsUrl = process.env.EXPO_PUBLIC_WS_URL || fileEnv.EXPO_PUBLIC_WS_URL;
const envMode = process.env.EXPO_PUBLIC_ENV || fileEnv.EXPO_PUBLIC_ENV;

console.log(`[GUARD CHECK] Mode: ${envMode}`);
console.log(`[GUARD CHECK] EXPO_PUBLIC_API_URL: ${apiUrl}`);
console.log(`[GUARD CHECK] EXPO_PUBLIC_WS_URL: ${wsUrl}`);

// Validation checklist
const errors = [];

// 1. API URL presence
if (!apiUrl) {
  errors.push('CRITICAL: EXPO_PUBLIC_API_URL is undefined.');
}

// 2. HTTPS protocol
if (apiUrl && !apiUrl.startsWith('https://')) {
  errors.push(`CRITICAL: EXPO_PUBLIC_API_URL must use HTTPS protocol. Found: "${apiUrl}"`);
}

// 3. Forbidden local/emulator/staging patterns
const FORBIDDEN = [
  'localhost',
  '127.0.0.1',
  '10.0.2.2',
  '192.168.',
  '10.',
  '172.16.',
  'staging-',
  'dev-',
  'placeholder',
  'example.com',
  'api.edutrack.com',
  'YOUR-ACTUAL',
];

for (const pattern of FORBIDDEN) {
  if (apiUrl && apiUrl.toLowerCase().includes(pattern.toLowerCase())) {
    errors.push(
      `CRITICAL: EXPO_PUBLIC_API_URL contains forbidden pattern "${pattern}". Found: "${apiUrl}"`,
    );
  }
  if (wsUrl && wsUrl.toLowerCase().includes(pattern.toLowerCase())) {
    errors.push(
      `CRITICAL: EXPO_PUBLIC_WS_URL contains forbidden pattern "${pattern}". Found: "${wsUrl}"`,
    );
  }
}

// 4. Hostname validation
if (apiUrl) {
  try {
    const parsed = new URL(apiUrl);
    if (parsed.hostname !== VERIFIED_PRODUCTION_HOST) {
      errors.push(
        `CRITICAL: Hostname "${parsed.hostname}" does not match verified Render production backend "${VERIFIED_PRODUCTION_HOST}".`,
      );
    }
    if (parsed.pathname !== '/api' && !parsed.pathname.endsWith('/api')) {
      errors.push(`CRITICAL: API pathname must be "/api". Found: "${parsed.pathname}"`);
    }
  } catch (err) {
    errors.push(`CRITICAL: Malformed API URL "${apiUrl}": ${err.message}`);
  }
}

// 5. WebSocket URL protocol
if (wsUrl && !wsUrl.startsWith('wss://')) {
  errors.push(`CRITICAL: EXPO_PUBLIC_WS_URL must use WSS protocol. Found: "${wsUrl}"`);
}

// 6. Check eas.json configuration
const easPath = path.join(__dirname, '..', 'eas.json');
if (fs.existsSync(easPath)) {
  const easConfig = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  const prodEas = easConfig.build?.production?.env?.EXPO_PUBLIC_API_URL;
  if (!prodEas || !prodEas.startsWith('https://')) {
    errors.push(
      `CRITICAL: eas.json production profile EXPO_PUBLIC_API_URL is invalid: "${prodEas}"`,
    );
  }
  if (prodEas && prodEas.includes('api.edutrack.com')) {
    errors.push(
      `CRITICAL: eas.json production profile still contains placeholder domain "api.edutrack.com".`,
    );
  }
}

// 7. Security audit: ensure no private secrets
const SENSITIVE_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_SECRET',
  'ADMIN_TOKEN',
  'PRIVATE_KEY',
];

for (const key of SENSITIVE_KEYS) {
  if (fileEnv[key] || (process.env[key] && !key.startsWith('npm_'))) {
    // Note: only check if embedded in mobile configuration
    if (fileEnv[key]) {
      errors.push(
        `CRITICAL SECURITY VIOLATION: Private secret "${key}" found in mobile environment file!`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ STRICT PRODUCTION BUILD GUARD FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  console.error('\nProduction APK compilation ABORTED.\n');
  process.exit(1);
}

// 8. Non-destructive network ping to verified Render production backend
console.log(
  `\nVerifying live connectivity to Render production backend (https://${VERIFIED_PRODUCTION_HOST}/health/live)...`,
);

const req = https.get(
  `https://${VERIFIED_PRODUCTION_HOST}/health/live`,
  { timeout: 15000 },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ Production health check passed: HTTP ${res.statusCode}`);
        console.log(`   Response: ${body.trim()}`);
        console.log('\n====================================================');
        console.log('  ALL STRICT PRODUCTION BUILD GUARDS PASSED (100%)  ');
        console.log('====================================================\n');
        process.exit(0);
      } else {
        console.error(`❌ Health check returned non-200 status: HTTP ${res.statusCode}`);
        process.exit(1);
      }
    });
  },
);

req.on('error', (err) => {
  console.error(`❌ Health check connection failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.error('❌ Health check timed out after 15 seconds.');
  process.exit(1);
});
