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
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApplicationAssessment } from '../../../../src/features/admission/hooks/useApplicationAssessment';
import { AssessmentCard } from '../../../../src/components/admission/AssessmentCard';
import { useTheme } from '../../../../src/theme';
import { DESIGN_TOKENS } from '../../../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../../../src/components/common/ParentPortalHeader';
import { ParentEmptyState } from '../../../../src/components/common/ParentEmptyState';
import { ParentLoadingSkeleton } from '../../../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function AssessmentTrackerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const appId = rawId && rawId !== '[id]' ? rawId : '';

  const {
    data: assessment,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useApplicationAssessment(appId);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Header */}
      <ParentPortalHeader
        title="Assessment Tracker"
        subtitle="Entrance Test & Student Evaluation"
        showBack={true}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => refetch()}
            style={[styles.refreshButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh assessment details"
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
            />
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
        {/* Info Banner */}
        <View
          style={[
            styles.milestonesBanner,
            {
              backgroundColor: isDark
                ? 'rgba(81, 70, 229, 0.15)'
                : DESIGN_TOKENS.colors.primaryLight,
              borderColor: isDark ? 'rgba(81, 70, 229, 0.35)' : '#C7D2FE',
            },
          ]}
        >
          <View style={styles.bannerIconWrapper}>
            <Feather name="award" size={20} color={DESIGN_TOKENS.colors.primary} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: isDark ? '#E0E7FF' : '#312E81' }]}>
              Evaluation Milestones
            </Text>
            <Text style={[styles.bannerDescription, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
              Entrance exam schedules, venue details, and academic evaluation updates are posted
              here.
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && <ParentLoadingSkeleton type="cards" />}

        {/* Error State */}
        {!isLoading && isError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(220, 38, 38, 0.15)'
                  : DESIGN_TOKENS.colors.errorLight,
                borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA',
              },
            ]}
          >
            <View style={styles.errorHeader}>
              <Feather name="alert-circle" size={20} color={DESIGN_TOKENS.colors.error} />
              <Text
                style={[
                  styles.errorTitle,
                  { color: isDark ? '#FCA5A5' : DESIGN_TOKENS.colors.error },
                ]}
              >
                Failed to load assessment details
              </Text>
            </View>
            <Text style={[styles.errorMessage, { color: isDark ? '#F87171' : '#991B1B' }]}>
              {error?.message || 'A network error occurred while retrieving evaluation status.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !assessment && (
          <ParentEmptyState
            ionIcon="school-outline"
            title="No Assessment Scheduled"
            description="There are no entrance tests or evaluation sessions scheduled for this application at this time."
          />
        )}

        {/* Assessment Card */}
        {!isLoading && !isError && assessment && <AssessmentCard assessment={assessment} />}
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
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: DESIGN_TOKENS.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestonesBanner: {
    padding: 16,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(81, 70, 229, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
});
