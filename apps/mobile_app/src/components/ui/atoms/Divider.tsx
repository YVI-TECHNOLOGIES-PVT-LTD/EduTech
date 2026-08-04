import React from 'react';
import { View, Text } from 'react-native';

export interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label }) => {
  if (label) {
    return (
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <Text className="px-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase">
          {label}
        </Text>
        <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </View>
    );
  }

  return <View className="w-full h-px bg-slate-200 dark:bg-slate-800 my-3" />;
};
