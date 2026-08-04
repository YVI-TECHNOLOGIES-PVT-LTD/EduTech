import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export interface FABProps {
  label?: string;
  icon?: string;
  onPress: () => void;
}

export const FAB: React.FC<FABProps> = ({ label, icon = '+', onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="absolute bottom-6 right-6 bg-sky-600 rounded-full flex-row items-center px-4 py-3.5 shadow-lg"
    >
      <Text className="text-white font-bold text-xl mr-1">{icon}</Text>
      {label && <Text className="text-white font-bold text-sm ml-1">{label}</Text>}
    </TouchableOpacity>
  );
};
