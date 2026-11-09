import { Platform } from 'react-native';
import Constants from 'expo-constants';

const envType = process.env.EXPO_PUBLIC_ENV || 'development';
const isProd = envType === 'production';
const isStaging = envType === 'staging';

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
    return process.env.EXPO_PUBLIC_API_URL || 'https://api.edutrack.com/api';
  }
  if (isStaging) {
    return process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.edutrack.com/api';
  }
  if (
    process.env.EXPO_PUBLIC_API_URL &&
    !process.env.EXPO_PUBLIC_API_URL.includes('localhost') &&
    !process.env.EXPO_PUBLIC_API_URL.includes('127.0.0.1')
  ) {
    return process.env.EXPO_PUBLIC_API_URL;
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
    return process.env.EXPO_PUBLIC_WS_URL || 'wss://api.edutrack.com/ws/notifications';
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
    return process.env.EXPO_PUBLIC_PARENT_WEB_URL || 'https://parent.edutrack.edu/fees/my';
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
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'EduTrack ERP',
  ENABLE_LOGGING: isProd
    ? process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true'
    : process.env.EXPO_PUBLIC_ENABLE_LOGGING !== 'false',
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  IS_DEV: !isProd && !isStaging,
  IS_PROD: isProd,
  IS_STAGING: isStaging,
};
