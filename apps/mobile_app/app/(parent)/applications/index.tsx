import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMyApplications } from '../../../src/features/admission';
import { ApplicationStatusCard } from '../../../src/components/admission/ApplicationStatusCard';
import { AdmissionApplication } from '../../../src/types/admission.types';
import { useTheme } from '../../../src/theme';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../../src/components/common/ParentPortalHeader';
import { ParentEmptyState } from '../../../src/components/common/ParentEmptyState';
import { ParentLoadingSkeleton } from '../../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../../src/components/ui/atoms/Button';

export default function ParentApplicationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyApplications();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      <ParentPortalHeader
        title="Applications"
        subtitle={`${applications.length} ${applications.length === 1 ? 'record' : 'records'}`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/(parent)/applications/wizard' as any)}
            style={styles.newAppButton}
            accessibilityLabel="New Application"
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.newAppButtonText}>New</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
      >
        {/* Loading State */}
        {isLoading && <ParentLoadingSkeleton type="cards" />}

        {/* Error State */}
        {isError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark ? '#1F161A' : '#FEF2F2',
                borderColor: isDark ? '#7F1D1D' : '#FECACA',
              },
            ]}
          >
            <View style={styles.errorHeader}>
              <Feather name="alert-triangle" size={18} color="#EF4444" />
              <Text style={styles.errorTitle}>Failed to load applications</Text>
            </View>
            <Text style={[styles.errorMessage, { color: isDark ? '#F87171' : '#991B1B' }]}>
              {error?.message || 'A network error occurred while retrieving your applications.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && applications.length === 0 && (
          <ParentEmptyState
            ionIcon="folder-open-outline"
            title="No Registered Applications"
            description="Start your child's enrollment by creating an online admission application."
            actionText="Start Admission Application"
            onAction={() => router.push('/(parent)/applications/wizard' as any)}
          />
        )}

        {/* Application Cards List */}
        {!isLoading && !isError && applications.length > 0 && (
          <View style={styles.listContainer}>
            {applications.map((app: AdmissionApplication) => {
              const appId = app.application_id || (app as any).id;
              return (
                <ApplicationStatusCard
                  key={appId}
                  application={app}
                  onPress={() => router.push(`/(parent)/applications/${appId}` as any)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: DESIGN_TOKENS.spacing.standard,
    paddingBottom: 40,
  },
  newAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: DESIGN_TOKENS.radius.button,
    gap: 4,
  },
  newAppButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    gap: DESIGN_TOKENS.spacing.small,
  },
  errorCard: {
    padding: DESIGN_TOKENS.spacing.card,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorMessage: {
    fontSize: 12,
    textAlign: 'center',
  },
});
