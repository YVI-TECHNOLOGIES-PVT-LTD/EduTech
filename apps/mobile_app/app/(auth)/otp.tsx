import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Input } from '../../src/components/ui/atoms/Input';
import { Button } from '../../src/components/ui/atoms/Button';
import { ROUTES } from '../../src/constants/routes';

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState('');

  return (
    <ScreenWrapper scrollable padded>
      <View className="py-8">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Enter Verification Code
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          A 6-digit OTP code has been sent to your registered email.
        </Text>

        <Input
          label="OTP Code"
          placeholder="123456"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Button
          title="Verify & Continue"
          size="lg"
          onPress={() => router.push(ROUTES.AUTH.WORKSPACE as any)}
        />
      </View>
    </ScreenWrapper>
  );
}
