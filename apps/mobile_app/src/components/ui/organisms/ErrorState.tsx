import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../atoms/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'Failed to load data. Please check your network connection and try again.',
  onRetry,
}) => {
  return (
    <View className="items-center justify-center p-6 my-6 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900">
      <Text className="text-4xl mb-3">⚠️</Text>
      <Text className="text-lg font-bold text-red-800 dark:text-red-200 mb-1">{title}</Text>
      <Text className="text-sm text-red-600 dark:text-red-400 text-center mb-4">{message}</Text>
      {onRetry && <Button title="Retry Now" onPress={onRetry} variant="danger" size="sm" />}
    </View>
  );
};
