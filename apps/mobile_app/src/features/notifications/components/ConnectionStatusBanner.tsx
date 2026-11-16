import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeSocketStatus } from '../../../types/notification.types';

export interface ConnectionStatusBannerProps {
  status: RealtimeSocketStatus;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({ status }) => {
  if (status === 'CONNECTED' || status === 'DISCONNECTED') {
    return null;
  }

  if (status === 'RECONNECTING' || status === 'CONNECTING') {
    return (
      <View className="bg-amber-500/10 dark:bg-amber-950/40 px-4 py-2 flex-row items-center justify-center border-b border-amber-200 dark:border-amber-800">
        <ActivityIndicator size="small" color="#d97706" style={{ transform: [{ scale: 0.75 }] }} />
        <Text className="text-xs font-semibold text-amber-800 dark:text-amber-200 ml-2">
          Syncing with server…
        </Text>
      </View>
    );
  }

  if (status === 'OFFLINE') {
    return (
      <View className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex-row items-center justify-center border-b border-slate-200 dark:border-slate-700">
        <Ionicons name="cloud-offline-outline" size={14} color="#64748b" />
        <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-2">
          Offline — showing cached notifications
        </Text>
      </View>
    );
  }

  return null;
};
