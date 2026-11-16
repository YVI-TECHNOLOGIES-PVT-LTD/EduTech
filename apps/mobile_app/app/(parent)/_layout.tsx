import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProtectedRoute } from '../../src/navigation/protected-route';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { useUnreadNotificationCount } from '../../src/features/notifications/hooks/useUnreadNotificationCount';
import { useNotificationRealtime } from '../../src/features/notifications/hooks/useNotificationRealtime';

export default function ParentLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  useUnreadNotificationCount();
  useNotificationRealtime();

  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 60 + bottomInset;

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? '#818CF8' : DESIGN_TOKENS.colors.primary,
          tabBarInactiveTintColor: isDark ? '#64748B' : DESIGN_TOKENS.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: 2,
          },
          tabBarStyle: {
            backgroundColor: isDark ? '#0F172A' : DESIGN_TOKENS.colors.surface,
            borderTopColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.border,
            borderTopWidth: 1,
            height: tabHeight,
            paddingTop: 8,
            paddingBottom: bottomInset,
            elevation: 8,
            shadowColor: '#172033',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          },
        }}
      >
        {/* Canonical Tab 1: Home Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
          }}
        />

        {/* Canonical Tab 2: Applications */}
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color }) => <Feather name="file-text" size={20} color={color} />,
          }}
        />

        {/* Canonical Tab 3: Admission Status */}
        <Tabs.Screen
          name="status"
          options={{
            title: 'Status',
            tabBarIcon: ({ color }) => <Feather name="check-square" size={20} color={color} />,
          }}
        />

        {/* Canonical Tab 4: Account */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
          }}
        />

        {/* Hidden from tab bar */}
        <Tabs.Screen name="fees" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="applications/wizard" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]/assessment" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]/decision" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]/documents" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]/fees" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]/receipt" options={{ href: null }} />
        <Tabs.Screen name="applications/[id]/timeline" options={{ href: null }} />
      </Tabs>
    </ProtectedRoute>
  );
}
