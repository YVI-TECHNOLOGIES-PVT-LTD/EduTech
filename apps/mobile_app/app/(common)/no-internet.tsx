import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Button } from '../../src/components/ui/atoms/Button';

export default function NoInternetScreen() {
  return (
    <ScreenWrapper scrollable={false} padded>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-6xl mb-4">📡</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          No Internet Connection
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Please check your network settings or Wi-Fi connection and try again.
        </Text>
        <Button title="Retry Connection" size="lg" onPress={() => {}} />
      </View>
    </ScreenWrapper>
  );
}
