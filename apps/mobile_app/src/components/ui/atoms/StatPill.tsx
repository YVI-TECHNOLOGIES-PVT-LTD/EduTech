import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatPillProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'slate';
  subtext?: string;
}

export const StatPill: React.FC<StatPillProps> = ({
  label,
  value,
  icon,
  variant = 'indigo',
  subtext,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          container:
            'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-700 dark:text-emerald-300',
          value: 'text-emerald-900 dark:text-emerald-100',
          iconColor: '#059669',
        };
      case 'amber':
        return {
          container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-300',
          value: 'text-amber-900 dark:text-amber-100',
          iconColor: '#d97706',
        };
      case 'rose':
        return {
          container: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          text: 'text-rose-700 dark:text-rose-300',
          value: 'text-rose-900 dark:text-rose-100',
          iconColor: '#dc2626',
        };
      case 'sky':
        return {
          container: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
          text: 'text-sky-700 dark:text-sky-300',
          value: 'text-sky-900 dark:text-sky-100',
          iconColor: '#0284c7',
        };
      case 'slate':
        return {
          container: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          text: 'text-slate-600 dark:text-slate-400',
          value: 'text-slate-900 dark:text-slate-100',
          iconColor: '#475569',
        };
      default:
        return {
          container: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
          text: 'text-indigo-700 dark:text-indigo-300',
          value: 'text-indigo-900 dark:text-indigo-100',
          iconColor: '#4338ca',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <View className={`border rounded-2xl p-3 flex-1 min-w-[100px] ${styles.container}`}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className={`text-[11px] font-bold uppercase tracking-wider ${styles.text}`}>
          {label}
        </Text>
        {icon && <Ionicons name={icon} size={14} color={styles.iconColor} />}
      </View>
      <Text className={`text-xl font-black ${styles.value}`}>{value}</Text>
      {subtext && (
        <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtext}</Text>
      )}
    </View>
  );
};
