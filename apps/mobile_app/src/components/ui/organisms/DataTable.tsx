import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden my-2">
        {/* Table Header */}
        <View className="flex-row bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3 px-4">
          {columns.map((col) => (
            <Text key={col.key} className="w-32 font-bold text-slate-700 dark:text-slate-300 text-sm">
              {col.header}
            </Text>
          ))}
        </View>
        {/* Table Body */}
        {data.map((item) => (
          <View
            key={keyExtractor(item)}
            className="flex-row border-b border-slate-100 dark:border-slate-800 py-3 px-4 bg-white dark:bg-slate-900"
          >
            {columns.map((col) => (
              <View key={col.key} className="w-32 justify-center">
                {col.render ? (
                  col.render(item)
                ) : (
                  <Text className="text-slate-800 dark:text-slate-200 text-sm">
                    {String((item as any)[col.key] ?? '')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
