// Mock React Native Platform and essentials
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (objs) => objs.ios || objs.default,
  },
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(),
    removeChangeListener: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
    roundToNearestPixel: jest.fn((size) => size),
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => styles,
    hairlineWidth: 1,
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Redirect: 'Redirect',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
