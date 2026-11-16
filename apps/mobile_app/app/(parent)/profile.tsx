import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api/auth.api';
import { ROUTES } from '../../src/constants/routes';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentProfileScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.replace(ROUTES.AUTH.LOGIN as any);
  };

  const displayName =
    user?.full_name ||
    user?.fullName ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') ||
    'Parent Guardian';

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'PG';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <Text className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Parent Account
        </Text>
        <Text className="text-xs font-semibold text-slate-400">Account details & security</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* User Card */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm items-center mb-6">
          <View className="w-20 h-20 rounded-3xl bg-indigo-600 items-center justify-center mb-3 shadow-md shadow-indigo-600/30">
            <Text className="text-2xl font-black text-white">{initials}</Text>
          </View>
          <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {displayName}
          </Text>
          <Text className="text-xs font-semibold text-slate-400 mt-0.5">
            {user?.email || 'parent@example.com'}
          </Text>
          <View className="mt-3 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Verified Parent Account
            </Text>
          </View>
        </View>

        {/* Account Details Section */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Account Information
          </Text>

          {/* Email */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center">
              <Feather name="mail" size={16} color="#64748b" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-3">
                Email
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {user?.email || 'Not provided'}
            </Text>
          </View>

          {/* Phone */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center">
              <Feather name="phone" size={16} color="#64748b" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-3">
                Mobile
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {user?.phone || user?.phoneNumber || 'Not provided'}
            </Text>
          </View>

          {/* Role */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center">
              <Feather name="shield" size={16} color="#64748b" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-3">
                Role
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {user?.roles?.join(', ') || 'PARENT'}
            </Text>
          </View>

          {/* School / Org ID */}
          <View className="flex-row items-center justify-between py-2.5">
            <View className="flex-row items-center">
              <Feather name="home" size={16} color="#64748b" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-3">
                School Affiliation
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
              {user?.school_id ? `SCH-${user.school_id.slice(0, 8)}` : 'EduTrack Main'}
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Preferences
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center">
              <Feather name={isDark ? 'moon' : 'sun'} size={16} color="#64748b" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-3">
                Theme Mode
              </Text>
            </View>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <Button title="Sign Out of Account" variant="danger" size="lg" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}
