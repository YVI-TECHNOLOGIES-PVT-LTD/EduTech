import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const NotificationEmptyState: React.FC = () => {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center text-center border border-slate-200/80 dark:border-slate-800 shadow-sm my-4">
      <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900">
        <Ionicons name="notifications-off-outline" size={32} color="#4f46e5" />
      </View>
      <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">
        No Notifications Yet
      </Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5 leading-relaxed max-w-xs">
        You will receive real-time updates here regarding application status changes, document
        verification, entrance tests, and admission decisions.
      </Text>
    </View>
  );
};
