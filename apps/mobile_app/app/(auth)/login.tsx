import React, { useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ROUTES } from '../../src/constants/routes';
import { useLogin } from '../../src/features/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { loginSchema, LoginFormData } from '../../src/features/auth/schemas/auth.schemas';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verifiedEmail?: string; verified?: string }>();
  const { colors, isDark } = useTheme();
  const [isSecure, setIsSecure] = useState(true);
  const { isAuthenticated, isHydrating } = useAuthStore();

  React.useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace(ROUTES.PARENT.DASHBOARD as any);
    }
  }, [isAuthenticated, isHydrating, router]);

  const { mutate: login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: params.verifiedEmail || '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login({
      email: data.email.trim(),
      password: data.password,
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
        {/* Top Header Background */}
        <View className="h-48 bg-indigo-950 justify-center items-center relative">
          <View className="absolute opacity-10">
            <Ionicons name="business-outline" size={140} color={colors.white} />
          </View>

          <SafeAreaView className="items-center">
            <View className="flex-row items-center justify-center">
              <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-3 border border-white/20">
                <Ionicons name="school" size={28} color={colors.white} />
              </View>
              <View>
                <Text className="text-2xl font-black text-white tracking-tight">EduTrack</Text>
                <Text className="text-xs font-semibold text-indigo-200 tracking-wider">
                  Parent Portal
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Bottom Sheet Card */}
        <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pt-8 pb-8 justify-between">
          <View>
            {/* Header Title */}
            <View className="items-center mb-6">
              <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Welcome <Text className="text-indigo-600 dark:text-indigo-400">Back</Text>
              </Text>
              <Text className="text-xs font-medium text-slate-400 mt-1">
                Sign in to manage your child's admission & records
              </Text>
            </View>

            {/* Verification Success Notice */}
            {params.verified === 'true' && (
              <View className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-xs font-medium text-emerald-800 dark:text-emerald-300 ml-2.5 flex-1">
                  Registration verified successfully! Please sign in with your credentials.
                </Text>
              </View>
            )}

            {/* API Error Banner */}
            {errorMessage && (
              <View className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-3.5 flex-row items-start">
                <Ionicons name="alert-circle" size={20} color="#ef4444" className="mt-0.5" />
                <Text className="text-xs font-medium text-red-700 dark:text-red-300 ml-2.5 flex-1">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                      errors.email
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Feather name="mail" size={18} color={colors.iconSecondary} />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="parent@example.com"
                      placeholderTextColor={colors.placeholder}
                      className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                      errors.password
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Feather name="lock" size={18} color={colors.iconSecondary} />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={isSecure}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.placeholder}
                      className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setIsSecure(!isSecure)}
                      accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
                    >
                      <Feather
                        name={isSecure ? 'eye' : 'eye-off'}
                        size={18}
                        color={colors.iconSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <View className="flex-row justify-end mb-6">
              <TouchableOpacity onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD as any)}>
                <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              isLoading={isPending}
              disabled={isPending}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          {/* Footer Link to Register */}
          <View className="items-center mt-6">
            <TouchableOpacity
              onPress={() => router.push(ROUTES.AUTH.REGISTER as any)}
              className="py-2"
            >
              <Text className="text-xs text-slate-500 font-medium">
                Applying for admission?{' '}
                <Text className="font-bold text-indigo-600 dark:text-indigo-400">
                  Register as a Parent
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
