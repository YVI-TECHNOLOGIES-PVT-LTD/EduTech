import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no records available at the moment.',
  actionText,
  onAction,
}) => {
  return (
    <View className="items-center justify-center p-8 my-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
      <Text className="text-4xl mb-3">📂</Text>
      <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
        {description}
      </Text>
      {actionText && onAction && <Button title={actionText} onPress={onAction} size="sm" />}
    </View>
  );
};
