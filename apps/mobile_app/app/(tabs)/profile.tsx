import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { Avatar } from '../../src/components/ui/atoms/Avatar';
import { Badge } from '../../src/components/ui/atoms/Badge';
import { Card } from '../../src/components/ui/organisms/Card';
import { Button } from '../../src/components/ui/atoms/Button';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTenantStore } from '../../src/stores/tenant.store';
import { AuthService } from '../../src/core/auth/auth.service';
import { ROUTES } from '../../src/constants/routes';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tenantInfo = useTenantStore((state) => state.tenantInfo);

  const handleLogout = async () => {
    await AuthService.logout();
    router.replace(ROUTES.AUTH.LOGIN as any);
  };

  return (
    <ScreenWrapper scrollable padded>
      {/* Top Hero Card */}
      <Card variant="gradient" className="items-center py-8 mb-4">
        <Avatar name={user?.fullName || 'Dr. Sarah Jenkins'} size="xl" showOnlineStatus />
        <Text className="text-2xl font-black text-white mt-3 text-center tracking-tight">
          {user?.fullName || 'Dr. Sarah Jenkins'}
        </Text>
        <Text className="text-xs text-indigo-200 mt-0.5 font-medium">
          {user?.email || 'sarah.jenkins@springfield.edu'}
        </Text>
        <View className="mt-3">
          <Badge label={user?.role || 'SCHOOL_ADMIN'} variant="success" />
        </View>
      </Card>

      {/* Institutional Details */}
      <Card title="School & Workspace Context">
        <View className="py-1 border-b border-slate-100 dark:border-slate-700/60 flex-row justify-between items-center">
          <Text className="text-xs font-bold text-slate-400 uppercase">Institution</Text>
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {tenantInfo?.schoolName || 'Springfield Academy'}
          </Text>
        </View>
        <View className="py-2.5 border-b border-slate-100 dark:border-slate-700/60 flex-row justify-between items-center">
          <Text className="text-xs font-bold text-slate-400 uppercase">Academic Period</Text>
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">AY 2026-2027</Text>
        </View>
        <View className="py-2 flex-row justify-between items-center">
          <Text className="text-xs font-bold text-slate-400 uppercase">Account Status</Text>
          <Badge label="Verified Enterprise" variant="primary" />
        </View>
      </Card>

      {/* Shortcuts */}
      <Card title="Quick Shortcuts">
        <TouchableOpacity
          onPress={() => router.push(ROUTES.TABS.SETTINGS as any)}
          className="py-3 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700/60"
        >
          <View className="flex-row items-center">
            <Text className="text-lg mr-3">⚙️</Text>
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">App Settings</Text>
          </View>
          <Text className="text-slate-400">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(ROUTES.AUTH.WORKSPACE as any)}
          className="py-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Text className="text-lg mr-3">🏫</Text>
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">Switch Workspace</Text>
          </View>
          <Text className="text-slate-400">›</Text>
        </TouchableOpacity>
      </Card>

      {/* Logout Button */}
      <View className="my-4">
        <Button title="Sign Out of EduTrack" variant="danger" size="lg" onPress={handleLogout} />
      </View>
    </ScreenWrapper>
  );
}
