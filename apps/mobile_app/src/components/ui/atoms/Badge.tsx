import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'error':
        return 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'info':
        return 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      case 'primary':
        return 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <View className={`px-3 py-1 rounded-full self-start ${getVariantStyles()}`}>
      <Text className="text-[11px] font-extrabold uppercase tracking-wider">{label}</Text>
    </View>
  );
};
