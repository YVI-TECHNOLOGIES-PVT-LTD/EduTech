import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}) => {
  return (
    <View className="flex-row items-center border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 my-2">
      <Text className="mr-2 text-slate-400">🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="flex-1 text-slate-900 dark:text-slate-100 text-base"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <Text className="text-slate-400 font-bold px-1">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
