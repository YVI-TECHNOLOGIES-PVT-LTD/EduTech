import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Button } from '../../src/components/ui/atoms/Button';

export default function NoInternetScreen() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (router.canGoBack()) {
        router.back();
      }
    }, 600);
  };

  return (
    <ScreenWrapper scrollable={false} padded>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-6xl mb-4">📡</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          No Internet Connection
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
          Please check your cellular or Wi-Fi settings and try again.
        </Text>
        {isRetrying ? (
          <ActivityIndicator size="small" color="#4f46e5" />
        ) : (
          <Button title="Retry Connection" size="lg" onPress={handleRetry} />
        )}
      </View>
    </ScreenWrapper>
  );
}
