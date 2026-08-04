import AsyncStorage from '@react-native-async-storage/async-storage';

export class AppStorageService {
  static async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  static async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  static async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  static async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}
