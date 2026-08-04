import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
}) => {
  return (
    <View className="flex-row items-center justify-between my-3">
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</Text>
        {subtitle && (
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>
        )}
      </View>
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <Text className="text-sm font-semibold text-sky-600 dark:text-sky-400">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
