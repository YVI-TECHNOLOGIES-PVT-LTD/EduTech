import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';

export default function MaintenanceScreen() {
  return (
    <ScreenWrapper scrollable={false} padded>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-6xl mb-4">🛠️</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          System Under Maintenance
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
          EduTrack ERP is currently undergoing scheduled system updates. Please check back shortly.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
