import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useChildStore } from '../../../src/stores/child.store';
import { useFinanceStore } from '../../../src/stores/finance.store';
import { useAcademicsStore } from '../../../src/stores/academics.store';
import { useHelpdeskStore } from '../../../src/stores/helpdesk.store';
import { AuthService } from '../../../src/core/auth/auth.service';
import { Avatar } from '../../../src/components/ui/atoms/Avatar';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../../src/components/child/ChildSwitcherSheet';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { useTheme } from '../../../src/theme';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ROUTES } from '../../../src/constants/routes';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const { isDark, toggleTheme } = useTheme();

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const parentName =
    user?.fullName ||
    user?.full_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    'Parent Account';
  const parentEmail = user?.email || 'parent@edutrack.edu';
  const parentPhone = user?.phone || user?.phoneNumber || '+91 98765 43210';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of EduTrack ERP?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          useChildStore.getState().reset();
          useFinanceStore.getState().clear();
          useAcademicsStore.getState().clear();
          useHelpdeskStore.getState().clear();
          router.replace(ROUTES.AUTH.LOGIN as any);
        },
      },
    ]);
  };

  const isEnrolled = activeChild?.kind === 'enrolled';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTag}>Account & Family</Text>
          <Text style={styles.headerTitle}>Family Profile</Text>
        </View>

        {/* 7.1 Parent Information Card */}
        <View style={styles.parentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name={parentName} size="lg" />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.parentNameText} numberOfLines={1}>
                  {parentName}
                </Text>
                <Badge label="Primary Guardian" variant="primary" />
              </View>
              <Text style={styles.parentMetaText}>{parentEmail}</Text>
              <Text style={styles.parentMetaText}>{parentPhone}</Text>
            </View>
          </View>
        </View>

        {/* 7.2 Active Student Context */}
        <Text style={styles.sectionHeaderTitle}>Active Student Context</Text>
        <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

        {/* 7.3 Enrolled Student SIS Record Card */}
        {activeChild && (
          <View style={styles.sisCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTag}>
                {isEnrolled ? 'SIS Student Record' : 'Admission Application'}
              </Text>
              <Badge
                label={isEnrolled ? 'Enrolled Student' : 'Applicant'}
                variant={isEnrolled ? 'success' : 'primary'}
              />
            </View>

            <Text style={styles.studentNameText}>{activeChild.fullName}</Text>

            <View style={styles.sisGrid}>
              {isEnrolled ? (
                <>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Admission No</Text>
                    <Text style={styles.sisValue}>{activeChild.admissionNumber}</Text>
                  </View>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Class & Section</Text>
                    <Text style={styles.sisValue}>
                      Grade {activeChild.gradeLevel} - {activeChild.section}
                    </Text>
                  </View>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Roll Number</Text>
                    <Text style={styles.sisValue}>{activeChild.rollNumber || 'Assigned'}</Text>
                  </View>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Academic Year</Text>
                    <Text style={styles.sisValue}>{activeChild.academicYear}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Application No</Text>
                    <Text style={styles.sisValue}>{activeChild.applicationNumber}</Text>
                  </View>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Applying Grade</Text>
                    <Text style={styles.sisValue}>{activeChild.applyingGrade}</Text>
                  </View>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Application Stage</Text>
                    <Text style={[styles.sisValue, { color: DESIGN_TOKENS.colors.primary }]}>
                      {activeChild.stage.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.sisField}>
                    <Text style={styles.sisLabel}>Academic Year</Text>
                    <Text style={styles.sisValue}>{activeChild.academicYear}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* 7.4 Auxiliary Campus Services */}
        <Text style={styles.sectionHeaderTitle}>Campus Services & Modules</Text>

        <TouchableOpacity
          onPress={() => router.push(ROUTES.MAIN.TRANSPORT as any)}
          style={styles.serviceCard}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="bus-outline" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>School Bus Transport</Text>
              <Text style={styles.serviceSubtitle}>Route schedule & driver details</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DESIGN_TOKENS.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(ROUTES.MAIN.LIBRARY as any)}
          style={styles.serviceCard}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="book-outline" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>Campus Library</Text>
              <Text style={styles.serviceSubtitle}>Issued books & catalog</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DESIGN_TOKENS.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(ROUTES.MAIN.HELPDESK as any)}
          style={styles.serviceCard}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="help-buoy-outline" size={20} color="#E11D48" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>Parent Helpdesk</Text>
              <Text style={styles.serviceSubtitle}>Fee, transport and academic inquiries</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DESIGN_TOKENS.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(ROUTES.PARENT.APPLICATIONS as any)}
          style={styles.serviceCard}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View
              style={[
                styles.serviceIconBox,
                { backgroundColor: DESIGN_TOKENS.colors.primaryLight },
              ]}
            >
              <Ionicons name="documents-outline" size={20} color={DESIGN_TOKENS.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>Admission Tracker</Text>
              <Text style={styles.serviceSubtitle}>Applications & document verification</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DESIGN_TOKENS.colors.textMuted} />
        </TouchableOpacity>

        {/* 7.5 Preferences & Security */}
        <Text style={styles.sectionHeaderTitle}>Preferences & Security</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={DESIGN_TOKENS.colors.textSecondary}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#CBD5E1', true: '#A5B4FC' }}
              thumbColor={pushEnabled ? DESIGN_TOKENS.colors.primary : '#F8FAFC'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="finger-print-outline"
                size={18}
                color={DESIGN_TOKENS.colors.textSecondary}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#A5B4FC' }}
              thumbColor={biometricsEnabled ? DESIGN_TOKENS.colors.primary : '#F8FAFC'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny-outline'}
                size={18}
                color={DESIGN_TOKENS.colors.textSecondary}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.settingLabel}>Dark Theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: '#A5B4FC' }}
              thumbColor={isDark ? DESIGN_TOKENS.colors.primary : '#F8FAFC'}
            />
          </View>
        </View>

        {/* Logout Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutBtn}
          accessibilityRole="button"
          accessibilityLabel="Sign out of EduTrack ERP"
        >
          <Ionicons name="log-out-outline" size={18} color={DESIGN_TOKENS.colors.danger} />
          <Text style={styles.logoutBtnText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Global Child Switcher Sheet */}
      <ChildSwitcherSheet visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  scrollContent: {
    paddingHorizontal: DESIGN_TOKENS.spacing.comfortable,
    paddingTop: DESIGN_TOKENS.spacing.small,
    paddingBottom: DESIGN_TOKENS.spacing.major,
  },
  headerContainer: {
    marginBottom: DESIGN_TOKENS.spacing.standard,
    paddingTop: 4,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: DESIGN_TOKENS.colors.textMuted,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.4,
  },
  parentCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: DESIGN_TOKENS.spacing.comfortable,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  parentNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.2,
  },
  parentMetaText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sisCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: DESIGN_TOKENS.spacing.comfortable,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  studentNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: 10,
  },
  sisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.borderLight,
  },
  sisField: {
    width: '50%',
    paddingVertical: 6,
  },
  sisLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: DESIGN_TOKENS.colors.textMuted,
  },
  sisValue: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 1,
  },
  serviceCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  serviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: 1,
  },
  settingsCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 14,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.borderLight,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.input,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_TOKENS.spacing.standard,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.danger,
    marginLeft: 8,
  },
});
