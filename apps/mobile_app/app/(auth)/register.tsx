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
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ROUTES } from '../../src/constants/routes';
import { useRegister } from '../../src/features/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import {
  registerSchema,
  RegisterFormData,
  evaluatePasswordStrength,
} from '../../src/features/auth/schemas/auth.schemas';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isSecure, setIsSecure] = useState(true);
  const [isConfirmSecure, setIsConfirmSecure] = useState(true);
  const { isAuthenticated, isHydrating } = useAuthStore();

  React.useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace(ROUTES.PARENT.DASHBOARD as any);
    }
  }, [isAuthenticated, isHydrating, router]);

  const { mutate: registerParent, isPending, error } = useRegister();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');
  const strength = evaluatePasswordStrength(passwordValue);

  const onSubmit = (data: RegisterFormData) => {
    registerParent({
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
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
        <View className="h-36 bg-indigo-950 justify-center px-6 relative">
          <SafeAreaView>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20 mb-2"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <Text className="text-2xl font-black text-white tracking-tight">
              Create Parent Account
            </Text>
            <Text className="text-xs font-medium text-indigo-200">
              Register to apply for student admission
            </Text>
          </SafeAreaView>
        </View>

        {/* Bottom Sheet Card */}
        <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pt-6 pb-8">
          {/* API Error Banner */}
          {errorMessage && (
            <View className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-3.5 flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#ef4444" className="mt-0.5" />
              <Text className="text-xs font-medium text-red-700 dark:text-red-300 ml-2.5 flex-1">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Full Name */}
          <View className="mb-3.5">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Parent Full Name
            </Text>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm ${
                    errors.full_name
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Feather name="user" size={18} color={colors.iconSecondary} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Sarah Jenkins"
                    placeholderTextColor={colors.placeholder}
                    className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}
            />
            {errors.full_name && (
              <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
                {errors.full_name.message}
              </Text>
            )}
          </View>

          {/* Email Address */}
          <View className="mb-3.5">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm ${
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

          {/* Phone Number */}
          <View className="mb-3.5">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Mobile Phone Number
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm ${
                    errors.phone
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Feather name="phone" size={18} color={colors.iconSecondary} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={colors.placeholder}
                    className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            />
            {errors.phone && (
              <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
                {errors.phone.message}
              </Text>
            )}
          </View>

          {/* Password */}
          <View className="mb-3.5">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm ${
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
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.placeholder}
                    className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
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

            {/* Live Password Strength Meter */}
            {passwordValue?.length > 0 && (
              <View className="mt-2 flex-row items-center">
                <View className="flex-1 flex-row space-x-1.5 mr-3">
                  <View
                    className={`h-1.5 flex-1 rounded-full ${
                      strength.score >= 1 ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  />
                  <View
                    className={`h-1.5 flex-1 rounded-full ${
                      strength.score >= 2 ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  />
                  <View
                    className={`h-1.5 flex-1 rounded-full ${
                      strength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                </View>
                <Text style={{ color: strength.color }} className="text-xs font-bold">
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-5">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm ${
                    errors.confirmPassword
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Feather name="lock" size={18} color={colors.iconSecondary} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={isConfirmSecure}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.placeholder}
                    className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setIsConfirmSecure(!isConfirmSecure)}>
                    <Feather
                      name={isConfirmSecure ? 'eye' : 'eye-off'}
                      size={18}
                      color={colors.iconSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title="Register & Continue"
            variant="primary"
            size="lg"
            isLoading={isPending}
            disabled={isPending}
            onPress={handleSubmit(onSubmit)}
          />

          {/* Footer Link */}
          <View className="items-center mt-5">
            <TouchableOpacity
              onPress={() => router.push(ROUTES.AUTH.LOGIN as any)}
              className="py-1"
            >
              <Text className="text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <Text className="font-bold text-indigo-600 dark:text-indigo-400">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
