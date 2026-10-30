import { Platform } from 'react-native';
import Constants from 'expo-constants';

const envType = process.env.EXPO_PUBLIC_ENV || 'development';
const isProd = envType === 'production';
const isStaging = envType === 'staging';

const getDevHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.split(':')[0] : null;
};

const getApiBaseUrl = (): string => {
  if (isProd) {
    return process.env.EXPO_PUBLIC_API_URL || 'https://api.edutrack.com/api';
  }
  if (isStaging) {
    return process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.edutrack.com/api';
  }
  const devHost = getDevHost();
  if (devHost) {
    return `http://${devHost}:3000/api`;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android Emulator uses 10.0.2.2 to access host machine localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

const getWsUrl = (): string => {
  if (isProd) {
    return process.env.EXPO_PUBLIC_WS_URL || 'wss://api.edutrack.com/ws/notifications';
  }
  if (isStaging) {
    return process.env.EXPO_PUBLIC_WS_URL || 'wss://staging-api.edutrack.com/ws/notifications';
  }
  const devHost = getDevHost();
  if (devHost) {
    return `ws://${devHost}:3000/ws/notifications`;
  }
  if (process.env.EXPO_PUBLIC_WS_URL) {
    return process.env.EXPO_PUBLIC_WS_URL;
  }
  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:3000/ws/notifications';
  }
  return 'ws://localhost:3000/ws/notifications';
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
