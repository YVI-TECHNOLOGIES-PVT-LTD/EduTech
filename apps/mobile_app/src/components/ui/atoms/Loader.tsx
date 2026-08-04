import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export interface LoaderProps {
  type?: 'page' | 'skeleton' | 'button' | 'infinite';
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ type = 'page', message }) => {
  if (type === 'page') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <ActivityIndicator size="large" color="#0284c7" />
        {message && (
          <Text className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            {message}
          </Text>
        )}
      </View>
    );
  }

  if (type === 'skeleton') {
    return (
      <View className="w-full h-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse my-2" />
    );
  }

  return <ActivityIndicator size="small" color="#0284c7" />;
};
