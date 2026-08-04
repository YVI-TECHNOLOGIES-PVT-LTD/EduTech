import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Button } from '../../src/components/ui/atoms/Button';
import { ROUTES } from '../../src/constants/routes';

export default function UnexpectedErrorScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper scrollable={false} padded>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-6xl mb-4">⚠️</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          Unexpected Error Occurred
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          An unexpected error has disrupted your session. You can return to the dashboard.
        </Text>
        <Button
          title="Return to Dashboard"
          size="lg"
          onPress={() => router.replace(ROUTES.TABS.DASHBOARD as any)}
        />
      </View>
    </ScreenWrapper>
  );
}
