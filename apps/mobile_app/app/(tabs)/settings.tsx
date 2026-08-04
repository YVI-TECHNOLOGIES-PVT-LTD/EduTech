import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { SectionHeader } from '../../src/components/ui/molecules/SectionHeader';
import { Card } from '../../src/components/ui/organisms/Card';
import { Badge } from '../../src/components/ui/atoms/Badge';
import { useThemeStore } from '../../src/stores/theme.store';
import { useTheme } from '../../src/theme';

export default function SettingsScreen() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const { colors } = useTheme();
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <ScreenWrapper scrollable padded>
      <SectionHeader title="Application Settings" subtitle="Configure system preferences & security" />

      {/* Theme Appearance Group */}
      <Card title="Appearance Theme">
        <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
          Choose app visual theme or match device system settings
        </Text>
        <View className="flex-row space-x-2">
          {(['light', 'dark', 'system'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              className={`flex-1 py-3 px-2 rounded-2xl border items-center capitalize ${
                mode === m
                  ? 'bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-500/30'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  mode === m ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Preferences Group */}
      <Card title="Preferences & Security">
        <View className="py-3 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
          <View>
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">Biometric Authentication</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">Face ID / Fingerprint login</Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        <View className="py-3 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
          <View>
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">Push Notifications</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">In-app & push alerts</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        <View className="py-3 flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">Language</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">English (US)</Text>
          </View>
          <Badge label="English" variant="primary" />
        </View>
      </Card>

      {/* Application Meta */}
      <Card title="About EduTrack Mobile">
        <View className="py-2 border-b border-slate-100 dark:border-slate-700/60 flex-row justify-between items-center">
          <Text className="text-xs font-semibold text-slate-500">Version</Text>
          <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">1.0.0 (Build 102)</Text>
        </View>
        <View className="py-2 flex-row justify-between items-center">
          <Text className="text-xs font-semibold text-slate-500">Platform Build</Text>
          <Badge label="Enterprise Production" variant="success" />
        </View>
      </Card>
    </ScreenWrapper>
  );
}
