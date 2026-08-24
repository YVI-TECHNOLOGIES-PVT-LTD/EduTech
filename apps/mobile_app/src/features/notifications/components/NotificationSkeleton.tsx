import React from 'react';
import { View } from 'react-native';

export const NotificationSkeleton: React.FC = () => {
  return (
    <View className="space-y-3">
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse"
        >
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 mr-2.5" />
              <View className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md flex-1 max-w-[180px]" />
            </View>
            <View className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </View>

          {/* Body lines */}
          <View className="space-y-2 mb-3">
            <View className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
            <View className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-4/5" />
          </View>

          {/* Footer row */}
          <View className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
            <View className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <View className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
};
