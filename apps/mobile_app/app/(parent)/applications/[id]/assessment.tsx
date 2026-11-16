import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useApplicationAssessment } from '../../../../src/features/admission/hooks/useApplicationAssessment';
import { AssessmentCard } from '../../../../src/components/admission/AssessmentCard';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function AssessmentTrackerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appId = id || '';

  const {
    data: assessment,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useApplicationAssessment(appId);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.iconSecondary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Assessment Tracker
            </Text>
            <Text className="text-xs font-semibold text-slate-400">
              Entrance Test & Student Evaluation
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          accessibilityLabel="Refresh assessment"
        >
          <Feather name="refresh-cw" size={18} color={colors.iconSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Info Banner */}
        <View className="bg-purple-50/60 dark:bg-purple-950/40 p-4 rounded-3xl border border-purple-100 dark:border-purple-900 flex-row items-center mb-5">
          <Ionicons name="school" size={20} color="#9333ea" />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-bold text-purple-950 dark:text-purple-200">
              Evaluation Milestones
            </Text>
            <Text className="text-[11px] text-purple-800/80 dark:text-purple-300 mt-0.5">
              Entrance exam schedules, venue details, and academic evaluation updates are posted
              here.
            </Text>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">
              Loading assessment status...
            </Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                Failed to load assessment details
              </Text>
            </View>
            <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
              {error?.message || 'A network error occurred.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Assessment Card */}
        {!isLoading && !isError && <AssessmentCard assessment={assessment || null} />}
      </ScrollView>
    </SafeAreaView>
  );
}
