import React from 'react';
import { Platform } from 'react-native';
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

  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 10 : 14;
  const tabHeight = 60 + bottomInset;

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? '#818CF8' : DESIGN_TOKENS.colors.royalIndigo,
          tabBarInactiveTintColor: isDark ? '#64748B' : '#64748B',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            marginTop: 2,
            marginBottom: 2,
            letterSpacing: -0.1,
          },
          tabBarStyle: {
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
            borderTopWidth: 1,
            height: tabHeight,
            paddingTop: 8,
            paddingBottom: bottomInset,
            elevation: 10,
            shadowColor: '#172554',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="academics/index"
          options={{
            title: 'Academics',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'school' : 'school-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="communication/index"
          options={{
            title: 'Updates',
            tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: DESIGN_TOKENS.colors.rose,
              fontSize: 10,
              fontWeight: '900',
              lineHeight: 14,
            },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={22}
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
              <Ionicons name={focused ? 'card' : 'card-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
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
