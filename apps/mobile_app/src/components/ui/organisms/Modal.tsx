import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, ModalProps as RNModalProps } from 'react-native';

export interface ModalProps extends RNModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  ...props
}) => {
  return (
    <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose} {...props}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl max-w-md">
          {title && (
            <View className="flex-row justify-between items-center pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </View>
      </View>
    </RNModal>
  );
};
