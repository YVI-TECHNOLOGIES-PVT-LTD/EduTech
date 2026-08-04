import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border mr-2 mb-2 ${
        selected
          ? 'bg-sky-600 border-sky-600'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
