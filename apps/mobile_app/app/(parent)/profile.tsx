import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api/auth.api';
import { ROUTES } from '../../src/constants/routes';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../src/components/common/ParentPortalHeader';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentProfileScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out?',
      'Are you sure you want to log out of your parent account on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.logout();
            } catch (e) {
              // Ignore network errors on logout
            } finally {
              logout();
              router.replace(ROUTES.AUTH.LOGIN as any);
            }
          },
        },
      ],
    );
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
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Top Header */}
      <ParentPortalHeader title="Parent Account" subtitle="Account details & security" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
              borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
            },
          ]}
        >
          <View style={[styles.avatarContainer, { backgroundColor: DESIGN_TOKENS.colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text
            style={[
              styles.displayName,
              { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
            ]}
          >
            {displayName}
          </Text>

          <Text
            style={[
              styles.displayEmail,
              { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
            ]}
          >
            {user?.email || 'parent@example.com'}
          </Text>

          <View
            style={[
              styles.verificationBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(22, 163, 74, 0.2)'
                  : DESIGN_TOKENS.colors.successLight,
                borderColor: isDark ? 'rgba(22, 163, 74, 0.4)' : '#BBF7D0',
              },
            ]}
          >
            <Feather name="check-circle" size={12} color={DESIGN_TOKENS.colors.success} />
            <Text style={styles.verificationBadgeText}>Verified Parent Account</Text>
          </View>
        </View>

        {/* Account Details Section */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
              borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
            ]}
          >
            Account Information
          </Text>

          {/* Email Row */}
          <View style={[styles.infoRow, { borderBottomColor: isDark ? '#334155' : '#F1F5F9' }]}>
            <View style={styles.infoLabelContainer}>
              <Feather name="mail" size={15} color={DESIGN_TOKENS.colors.primary} />
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                ]}
              >
                Email
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={[
                styles.infoValue,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              {user?.email || 'Not provided'}
            </Text>
          </View>

          {/* Phone Row */}
          <View style={[styles.infoRow, { borderBottomColor: isDark ? '#334155' : '#F1F5F9' }]}>
            <View style={styles.infoLabelContainer}>
              <Feather name="phone" size={15} color={DESIGN_TOKENS.colors.primary} />
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                ]}
              >
                Mobile
              </Text>
            </View>
            <Text
              style={[
                styles.infoValue,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              {user?.phone || (user as any)?.phoneNumber || 'Not provided'}
            </Text>
          </View>

          {/* Role Row */}
          <View style={[styles.infoRow, { borderBottomColor: isDark ? '#334155' : '#F1F5F9' }]}>
            <View style={styles.infoLabelContainer}>
              <Feather name="shield" size={15} color={DESIGN_TOKENS.colors.primary} />
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                ]}
              >
                Role
              </Text>
            </View>
            <Text
              style={[
                styles.infoValue,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              {user?.roles?.join(', ') || 'PARENT'}
            </Text>
          </View>

          {/* School Affiliation */}
          <View style={styles.infoRowLast}>
            <View style={styles.infoLabelContainer}>
              <Feather name="home" size={15} color={DESIGN_TOKENS.colors.primary} />
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                ]}
              >
                School Affiliation
              </Text>
            </View>
            <Text
              style={[
                styles.infoValue,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              {(user as any)?.school_id
                ? `SCH-${(user as any).school_id.slice(0, 8)}`
                : 'EduTrack Main'}
            </Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
              borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
            ]}
          >
            Preferences
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleTheme}
            style={styles.preferenceRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle Theme Mode"
          >
            <View style={styles.infoLabelContainer}>
              <Feather
                name={isDark ? 'moon' : 'sun'}
                size={16}
                color={DESIGN_TOKENS.colors.primary}
              />
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                ]}
              >
                Theme Mode
              </Text>
            </View>
            <View style={styles.preferenceValuePill}>
              <Text style={styles.preferenceValueText}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutContainer}>
          <Button title="Sign Out of Account" variant="danger" size="lg" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  displayEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.success,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  preferenceValuePill: {
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: DESIGN_TOKENS.radius.small,
  },
  preferenceValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutContainer: {
    marginTop: 8,
  },
});
