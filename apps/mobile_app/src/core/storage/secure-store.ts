import * as SecureStore from 'expo-secure-store';

export class SecureStorageService {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`SecureStorage setItem error for key ${key}:`, error);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage getItem error for key ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage removeItem error for key ${key}:`, error);
    }
  }

  static async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  static async getObject<T>(key: string): Promise<T | null> {
    const json = await this.getItem(key);
    if (!json) return null;
    try {
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }
}
