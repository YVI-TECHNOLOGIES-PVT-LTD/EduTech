import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ROUTES } from '../../src/constants/routes';
import { useVerifyOtp } from '../../src/features/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const { colors } = useTheme();
  const { isAuthenticated, isHydrating } = useAuthStore();

  React.useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace(ROUTES.PARENT.DASHBOARD as any);
    }
  }, [isAuthenticated, isHydrating, router]);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const { mutate: verifyOtp, isPending, error } = useVerifyOtp();

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleDigitChange = (value: string, index: number) => {
    // If pasted full 6 digits
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleaned[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(cleaned.length, 5);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otpDigits.every((d) => d.length === 1);
  const otpCode = otpDigits.join('');

  const handleSubmit = () => {
    if (!isOtpComplete || !params.email) return;

    verifyOtp({
      email: params.email.trim().toLowerCase(),
      phone: params.phone || undefined,
      otp: otpCode,
    });
  };

  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-indigo-950"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Top Header */}
        <View className="h-44 bg-indigo-950 justify-center px-6 relative">
          <SafeAreaView>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20 mb-2"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <Text className="text-2xl font-black text-white tracking-tight">Verify Account</Text>
            <Text className="text-xs font-medium text-indigo-200">
              Enter the 6-digit verification code sent to
            </Text>
            <Text className="text-xs font-bold text-white mt-0.5">
              {params.email || 'your registered email'}
            </Text>
          </SafeAreaView>
        </View>

        {/* Bottom Sheet */}
        <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pt-8 pb-8 justify-between">
          <View>
            {/* API Error Banner */}
            {errorMessage && (
              <View className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-3.5 flex-row items-start">
                <Ionicons name="alert-circle" size={20} color="#ef4444" className="mt-0.5" />
                <Text className="text-xs font-medium text-red-700 dark:text-red-300 ml-2.5 flex-1">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* 6-Digit Box Inputs */}
            <View className="flex-row justify-between mb-8">
              {otpDigits.map((digit, index) => (
                <View
                  key={index}
                  className={`w-12 h-14 rounded-2xl border items-center justify-center bg-white dark:bg-slate-800 shadow-sm ${
                    digit
                      ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <TextInput
                    ref={(ref) => (inputsRef.current[index] = ref)}
                    value={digit}
                    onChangeText={(val) => handleDigitChange(val, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={index === 0 ? 6 : 1}
                    selectTextOnFocus
                    className="text-xl font-black text-center text-slate-900 dark:text-slate-100 w-full h-full"
                    autoFocus={index === 0}
                  />
                </View>
              ))}
            </View>

            {/* Timer Row */}
            <View className="items-center mb-8">
              {timerSeconds > 0 ? (
                <View className="flex-row items-center">
                  <Feather name="clock" size={14} color="#64748b" className="mr-1.5" />
                  <Text className="text-xs font-medium text-slate-500 ml-1.5">
                    Code expires in{' '}
                    <Text className="font-bold text-indigo-600 dark:text-indigo-400">
                      0:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                    </Text>
                  </Text>
                </View>
              ) : (
                <Text className="text-xs font-semibold text-amber-600">
                  Verification code has expired. Please register again if needed.
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              title="Verify & Complete Registration"
              variant="primary"
              size="lg"
              isLoading={isPending}
              disabled={!isOtpComplete || isPending}
              onPress={handleSubmit}
            />
          </View>

          {/* Footer Back Link */}
          <View className="items-center mt-6">
            <TouchableOpacity
              onPress={() => router.replace(ROUTES.AUTH.LOGIN as any)}
              className="py-1"
            >
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Return to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
