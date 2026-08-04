import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { ROUTES } from '../../src/constants/routes';
import { AuthService } from '../../src/core/auth/auth.service';
import { useTheme } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('john.doe@edutrack.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isSecure, setIsSecure] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setTimeout(async () => {
      await AuthService.loginSuccess(
        {
          id: 'usr_1',
          email,
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          role: 'SCHOOL_ADMIN',
          permissions: [],
          isActive: true,
          tenantId: 'tnt_1',
          schoolId: 'sch_1',
        },
        { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token', expiresIn: 3600 },
      );
      setIsLoading(false);
      router.push(ROUTES.AUTH.WORKSPACE as any);
    }, 600);
  };

  return (
    <View className="flex-1 bg-indigo-950">
      {/* Top Header Background with Faint School Illustration */}
      <View className="h-52 bg-indigo-950 justify-center items-center relative">
        <View className="absolute opacity-10">
          <Ionicons name="business-outline" size={140} color={colors.white} />
        </View>

        <SafeAreaView className="items-center">
          <View className="flex-row items-center justify-center">
            <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-3 border border-white/20">
              <Ionicons name="school" size={28} color={colors.white} />
            </View>
            <View>
              <Text className="text-2xl font-black text-white tracking-tight">
                EduTrack
              </Text>
              <Text className="text-xs font-semibold text-indigo-200 tracking-wider">
                School ERP
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Sheet Card */}
      <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pt-8 pb-6 justify-between">
        <View>
          {/* Header Title */}
          <View className="items-center mb-6">
            <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome <Text className="text-indigo-600 dark:text-indigo-400">Back</Text>
            </Text>
            <Text className="text-xs font-medium text-slate-400 mt-1">
              Sign in to continue to your account
            </Text>
          </View>

          {/* Form Inputs */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Email / Mobile / Username
            </Text>
            <View className="flex-row items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3.5 shadow-sm">
              <Feather name="mail" size={18} color={colors.iconSecondary} className="mr-3" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="john.doe@edutrack.com"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-2"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Password
            </Text>
            <View className="flex-row items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3.5 shadow-sm">
              <Feather name="lock" size={18} color={colors.iconSecondary} className="mr-3" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={isSecure}
                placeholder="••••••••••••"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-2"
              />
              <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
                <Feather name={isSecure ? 'eye' : 'eye-off'} size={18} color={colors.iconSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Checkbox & Forgot Password Row */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center"
            >
              <View
                className={`w-5 h-5 rounded-md items-center justify-center mr-2 ${
                  rememberMe ? 'bg-indigo-600' : 'border border-slate-300 bg-transparent'
                }`}
              >
                {rememberMe && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Remember me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD as any)}>
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Rounded Sign In Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleLogin}
            disabled={isLoading}
            className="w-full bg-indigo-900 py-4 rounded-full items-center justify-center shadow-lg shadow-indigo-900/30"
          >
            <Text className="text-base font-bold text-white">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Social Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <Text className="px-3 text-xs font-medium text-slate-400">or sign in with</Text>
            <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </View>

          {/* 3 Social Buttons */}
          <View className="flex-row justify-center space-x-4">
            <TouchableOpacity className="w-14 h-12 border border-slate-200 dark:border-slate-700 rounded-2xl items-center justify-center bg-white dark:bg-slate-800 shadow-sm mx-2">
              <FontAwesome5 name="google" size={20} color="#ea4335" />
            </TouchableOpacity>

            <TouchableOpacity className="w-14 h-12 border border-slate-200 dark:border-slate-700 rounded-2xl items-center justify-center bg-white dark:bg-slate-800 shadow-sm mx-2">
              <Ionicons name="grid-outline" size={20} color="#00a4ef" />
            </TouchableOpacity>

            <TouchableOpacity className="w-14 h-12 border border-slate-200 dark:border-slate-700 rounded-2xl items-center justify-center bg-white dark:bg-slate-800 shadow-sm mx-2">
              <FontAwesome5 name="apple" size={22} color={isDark ? colors.white : colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Link */}
        <View className="items-center mt-4">
          <Text className="text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <Text className="font-bold text-indigo-600 dark:text-indigo-400">Sign up</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
