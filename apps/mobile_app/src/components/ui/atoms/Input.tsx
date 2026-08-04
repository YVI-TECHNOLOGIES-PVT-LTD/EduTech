import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center border rounded-2xl px-4 py-3 bg-white dark:bg-slate-800/90 shadow-sm ${
          error
            ? 'border-red-500 bg-red-50/20'
            : 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400'
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          placeholderTextColor="#94a3b8"
          className="flex-1 text-slate-900 dark:text-slate-100 text-sm font-medium"
          style={style}
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error ? (
        <Text className="text-xs font-semibold text-red-500 mt-1.5 ml-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 ml-1">{helperText}</Text>
      ) : null}
    </View>
  );
};
