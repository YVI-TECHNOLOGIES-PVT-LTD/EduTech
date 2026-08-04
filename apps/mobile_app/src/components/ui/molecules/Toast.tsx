import React from 'react';
import { View, Text } from 'react-native';
import { ToastType } from '../../../types/common.types';

export interface ToastProps {
  type: ToastType;
  title: string;
  description?: string;
}

export const Toast: React.FC<ToastProps> = ({ type, title, description }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600';
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-amber-600';
      case 'info':
      default:
        return 'bg-sky-600';
    }
  };

  return (
    <View className={`p-3 rounded-lg shadow-lg ${getTypeColor()} flex-row items-center my-1 mx-4`}>
      <View className="flex-1">
        <Text className="text-white font-bold text-sm">{title}</Text>
        {description && <Text className="text-white/90 text-xs mt-0.5">{description}</Text>}
      </View>
    </View>
  );
};
