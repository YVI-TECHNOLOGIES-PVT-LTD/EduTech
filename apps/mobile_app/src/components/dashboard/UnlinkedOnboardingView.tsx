import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export const UnlinkedOnboardingView: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="school" size={28} color={DESIGN_TOKENS.colors.royalIndigo} />
      </View>
      <Text style={styles.title}>Welcome to EduTrack ERP</Text>
      <Text style={styles.description}>
        To get started, apply for your child's school admission or connect your existing enrolled
        student profile to track grades, timetable, attendance and fees.
      </Text>

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push(ROUTES.PARENT.WIZARD as any)}
        style={styles.primaryButton}
        accessibilityRole="button"
        accessibilityLabel="Apply for Admission"
      >
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Apply for Admission</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(ROUTES.PARENT.APPLICATIONS as any)}
        style={styles.secondaryButton}
        accessibilityRole="button"
        accessibilityLabel="View Existing Applications"
      >
        <Ionicons name="document-text-outline" size={16} color={DESIGN_TOKENS.colors.deepNavy} />
        <Text style={styles.secondaryButtonText}>View Existing Applications</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...DESIGN_TOKENS.shadows.card,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.deepNavy,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
});
