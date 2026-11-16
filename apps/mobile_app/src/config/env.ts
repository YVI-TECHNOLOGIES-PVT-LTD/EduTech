import { Platform } from 'react-native';

const envType = process.env.EXPO_PUBLIC_ENV || 'development';
const isProd = envType === 'production';
const isStaging = envType === 'staging';

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (isProd) {
    return 'https://api.edutrack.com/api';
  }
  if (isStaging) {
    return 'https://staging-api.edutrack.com/api';
  }
  // Android Emulator uses 10.0.2.2 to access host machine localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

const getWsUrl = (): string => {
  if (process.env.EXPO_PUBLIC_WS_URL) {
    return process.env.EXPO_PUBLIC_WS_URL;
  }
  if (isProd) {
    return 'wss://api.edutrack.com/ws/notifications';
  }
  if (isStaging) {
    return 'wss://staging-api.edutrack.com/ws/notifications';
  }
  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:3000/ws/notifications';
  }
  return 'ws://localhost:3000/ws/notifications';
};

export const ENV = {
  API_URL: getApiBaseUrl(),
  WS_URL: getWsUrl(),
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
