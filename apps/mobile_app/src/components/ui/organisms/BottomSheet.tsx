import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 min-h-[300px]">
          <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-4" />
          {title && (
            <View className="flex-row justify-between items-center pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-sky-600 font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
};
