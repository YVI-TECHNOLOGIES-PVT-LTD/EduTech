import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Input } from '../../src/components/ui/atoms/Input';
import { Button } from '../../src/components/ui/atoms/Button';
import { ROUTES } from '../../src/constants/routes';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <ScreenWrapper scrollable padded>
      <View className="py-8">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Reset Password
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Enter your email address to receive a 6-digit OTP verification code.
        </Text>

        <Input
          label="Email Address"
          placeholder="user@school.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Button
          title="Send OTP"
          size="lg"
          onPress={() => router.push(ROUTES.AUTH.OTP as any)}
        />
      </View>
    </ScreenWrapper>
  );
}
