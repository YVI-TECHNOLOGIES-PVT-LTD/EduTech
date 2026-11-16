import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DocumentVerifyState = 'pending' | 'verified' | 'rejected' | 'uploaded' | 'missing';

export interface DocumentStatusBadgeProps {
  status: DocumentVerifyState | string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ status }) => {
  const normStatus = String(status || '').toLowerCase();

  if (normStatus === 'verified') {
    return (
      <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
        <Ionicons name="checkmark-circle" size={13} color="#10b981" />
        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 ml-1">
          Verified
        </Text>
      </View>
    );
  }

  if (normStatus === 'rejected') {
    return (
      <View className="flex-row items-center bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
        <Ionicons name="alert-circle" size={13} color="#ef4444" />
        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-300 ml-1">
          Action Needed
        </Text>
      </View>
    );
  }

  if (normStatus === 'uploaded' || normStatus === 'pending') {
    return (
      <View className="flex-row items-center bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
        <Ionicons name="time" size={13} color="#f59e0b" />
        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 ml-1">
          Under Review
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
      <Ionicons name="ellipse-outline" size={13} color="#94a3b8" />
      <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 ml-1">
        Not Uploaded
      </Text>
    </View>
  );
};
