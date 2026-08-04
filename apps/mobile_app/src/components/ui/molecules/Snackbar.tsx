import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface SnackbarProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
  visible?: boolean;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  message,
  actionText,
  onAction,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <View className="bg-slate-900 dark:bg-slate-800 p-4 rounded-lg flex-row items-center justify-between mx-4 my-2 shadow-md">
      <Text className="text-white text-sm flex-1 mr-2">{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-sky-400 font-bold text-sm uppercase">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
