import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  VERIFIED_PRODUCTION_HOST,
  VERIFIED_PRODUCTION_API_URL,
  VERIFIED_PRODUCTION_WS_URL,
  VERIFIED_PRODUCTION_PARENT_WEB_URL,
  normalizeApiUrl,
  validateProductionApiUrl,
  validateProductionWsUrl,
  enforceProductionGuard,
} from './production-guard';

// Re-export production constants and guards for centralized access
export {
  VERIFIED_PRODUCTION_HOST,
  VERIFIED_PRODUCTION_API_URL,
  VERIFIED_PRODUCTION_WS_URL,
  VERIFIED_PRODUCTION_PARENT_WEB_URL,
  normalizeApiUrl,
  validateProductionApiUrl,
  validateProductionWsUrl,
  enforceProductionGuard,
};

const isReleaseMode =
  typeof __DEV__ !== 'undefined' && __DEV__ === false && process.env.NODE_ENV !== 'test';
const envType =
  process.env.EXPO_PUBLIC_ENV ||
  (isReleaseMode || process.env.NODE_ENV === 'production' ? 'production' : 'development');
const isProd = envType === 'production' || isReleaseMode;
const isStaging = envType === 'staging' && !isReleaseMode;

const getDevHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.split(':')[0] : null;
};

const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  const constants = Platform.constants as any;
  const model = String(constants?.Model || '').toLowerCase();
  const brand = String(constants?.Brand || '').toLowerCase();
  const fingerprint = String(constants?.Fingerprint || '').toLowerCase();
  const hardware = String(constants?.Hardware || '').toLowerCase();
  return (
    model.includes('sdk') ||
    model.includes('emulator') ||
    model.includes('gphone') ||
    fingerprint.startsWith('generic') ||
    fingerprint.includes('emulator') ||
    hardware.includes('goldfish') ||
    hardware.includes('ranchu') ||
    (brand === 'google' && model.includes('phone'))
  );
};

const getApiBaseUrl = (): string => {
  if (isProd) {
    const rawUrl = process.env.EXPO_PUBLIC_API_URL || VERIFIED_PRODUCTION_API_URL;
    const normalized = normalizeApiUrl(rawUrl);
    const validation = validateProductionApiUrl(normalized);
    if (!validation.isValid) {
      throw new Error(
        `[STRICT PRODUCTION GUARD] Invalid production API URL "${rawUrl}": ${validation.error}`,
      );
    }
    return normalized;
  }

  if (isStaging) {
    return normalizeApiUrl(
      process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.edutrack.com/api',
    );
  }

  if (
    process.env.EXPO_PUBLIC_API_URL &&
    !process.env.EXPO_PUBLIC_API_URL.includes('localhost') &&
    !process.env.EXPO_PUBLIC_API_URL.includes('127.0.0.1')
  ) {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  // Android Emulator uses 10.0.2.2 to reach host machine localhost even without adb reverse
  if (isAndroidEmulator()) {
    return 'http://10.0.2.2:3000/api';
  }

  // Physical device on local network running Expo
  const devHost = getDevHost();
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:3000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
};

const getWsUrl = (): string => {
  if (isProd) {
    const rawWsUrl = process.env.EXPO_PUBLIC_WS_URL || VERIFIED_PRODUCTION_WS_URL;
    const cleanWs = rawWsUrl.trim();
    const validation = validateProductionWsUrl(cleanWs);
    if (!validation.isValid) {
      throw new Error(
        `[STRICT PRODUCTION GUARD] Invalid production WebSocket URL "${rawWsUrl}": ${validation.error}`,
      );
    }
    return cleanWs;
  }

  if (isStaging) {
    return process.env.EXPO_PUBLIC_WS_URL || 'wss://staging-api.edutrack.com/ws/notifications';
  }

  if (
    process.env.EXPO_PUBLIC_WS_URL &&
    !process.env.EXPO_PUBLIC_WS_URL.includes('localhost') &&
    !process.env.EXPO_PUBLIC_WS_URL.includes('127.0.0.1')
  ) {
    return process.env.EXPO_PUBLIC_WS_URL;
  }

  if (isAndroidEmulator()) {
    return 'ws://10.0.2.2:3000/ws/notifications';
  }

  const devHost = getDevHost();
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `ws://${devHost}:3000/ws/notifications`;
  }

  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:3000/ws/notifications';
  }

  return process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/ws/notifications';
};

const getParentWebUrl = (): string => {
  if (isProd) {
    return process.env.EXPO_PUBLIC_PARENT_WEB_URL || VERIFIED_PRODUCTION_PARENT_WEB_URL;
  }

  if (isStaging) {
    return process.env.EXPO_PUBLIC_PARENT_WEB_URL || 'https://staging-parent.edutrack.edu/fees/my';
  }

  const devHost = getDevHost();
  if (devHost) {
    return `http://${devHost}:5173/fees/my`;
  }

  return process.env.EXPO_PUBLIC_PARENT_WEB_URL || 'http://localhost:5173/fees/my';
};

export const ENV = {
  API_URL: getApiBaseUrl(),
  WS_URL: getWsUrl(),
  PARENT_WEB_URL: getParentWebUrl(),
  RAZORPAY_KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TnfW60mfvhJy7W',
  ENVIRONMENT: envType,
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'EduLyfe',
  ENABLE_LOGGING: isProd
    ? process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true'
    : process.env.EXPO_PUBLIC_ENABLE_LOGGING !== 'false',
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  IS_DEV: !isProd && !isStaging,
  IS_PROD: isProd,
  IS_STAGING: isStaging,
};

// Strict module-level execution guard for production builds
if (ENV.IS_PROD) {
  enforceProductionGuard(ENV.API_URL, ENV.WS_URL);
}
