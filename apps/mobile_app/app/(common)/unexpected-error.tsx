import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Button } from '../../src/components/ui/atoms/Button';
import { ROUTES } from '../../src/constants/routes';
import { useAuthStore } from '../../src/stores/auth.store';

export default function UnexpectedErrorScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleReset = () => {
    if (isAuthenticated) {
      router.replace(ROUTES.MAIN.HOME as any);
    } else {
      router.replace(ROUTES.AUTH.LOGIN as any);
    }
  };

  return (
    <ScreenWrapper scrollable={false} padded>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-6xl mb-4">⚠️</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          Unexpected Error Occurred
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
          An unexpected error disrupted your session. You can safely return to the home screen.
        </Text>
        <Button
          title={isAuthenticated ? 'Return to Home' : 'Return to Login'}
          size="lg"
          onPress={handleReset}
        />
      </View>
    </ScreenWrapper>
  );
}
