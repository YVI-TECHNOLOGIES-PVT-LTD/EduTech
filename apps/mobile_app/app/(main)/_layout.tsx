import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProtectedRoute } from '../../src/navigation/protected-route';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { useUnreadNotificationCount } from '../../src/features/notifications/hooks/useUnreadNotificationCount';
import { useNotificationRealtime } from '../../src/features/notifications/hooks/useNotificationRealtime';

export default function MainLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationCount();
  useNotificationRealtime();

  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 58 + bottomInset;

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
            shadowColor: '#151D32',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="academics/index"
          options={{
            title: 'Academics',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'school' : 'school-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="communication/index"
          options={{
            title: 'Updates',
            tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: DESIGN_TOKENS.colors.danger,
              fontSize: 10,
              fontWeight: '800',
              lineHeight: 14,
            },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={21}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="finance/index"
          options={{
            title: 'Fees',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'card' : 'card-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="helpdesk/index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="transport/index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="library/index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
