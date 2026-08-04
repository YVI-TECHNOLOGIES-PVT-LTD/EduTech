import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

export interface DropdownItem {
  label: string;
  value: string;
}

export interface DropdownProps {
  label?: string;
  placeholder?: string;
  items: DropdownItem[];
  selectedValue?: string;
  onSelect: (item: DropdownItem) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Select option...',
  items,
  selectedValue,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === selectedValue);

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center justify-between border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-3"
      >
        <Text
          className={`text-base ${
            selectedItem
              ? 'text-slate-900 dark:text-slate-100 font-medium'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text className="text-slate-400">▼</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-2xl p-4 max-h-96">
            <View className="flex-row justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {label || 'Select Option'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-base font-semibold text-sky-600 dark:text-sky-400">Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                  className="py-3 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center"
                >
                  <Text className="text-base text-slate-800 dark:text-slate-200">{item.label}</Text>
                  {item.value === selectedValue && (
                    <Text className="text-sky-600 dark:text-sky-400 font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
