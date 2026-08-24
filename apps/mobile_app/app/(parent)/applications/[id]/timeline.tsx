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
import { useApplicationTimeline } from '../../../../src/features/admission/hooks/useApplicationTimeline';
import { TimelineStepCard } from '../../../../src/components/admission/TimelineStepCard';
import { ApplicationTimelineEvent } from '../../../../src/types/admission.types';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function ApplicationTimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appId = id || '';

  const {
    data: timelineData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useApplicationTimeline(appId);

  const timelineEvents = timelineData?.timeline || [];

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
              Milestone Timeline
            </Text>
            <Text className="text-xs font-semibold text-slate-400">Admission Pipeline History</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          accessibilityLabel="Refresh timeline"
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
        <View className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-3xl border border-blue-100 dark:border-blue-900 flex-row items-center mb-5">
          <Ionicons name="git-commit" size={20} color="#2563eb" />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-bold text-blue-950 dark:text-blue-200">
              Audit Pipeline History
            </Text>
            <Text className="text-[11px] text-blue-800/80 dark:text-blue-300 mt-0.5">
              Track the chronological progression of submission, verification, tests, and decisions.
            </Text>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">
              Loading milestone timeline...
            </Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                Failed to load timeline
              </Text>
            </View>
            <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
              {error?.message || 'A network error occurred.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && timelineEvents.length === 0 && (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-4">
              <Ionicons name="time-outline" size={32} color="#4f46e5" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">
              No History Recorded Yet
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
              As your application progresses through document checks and evaluation, milestone
              updates will appear here.
            </Text>
          </View>
        )}

        {/* Timeline Events List */}
        {!isLoading &&
          !isError &&
          timelineEvents.map((event: ApplicationTimelineEvent, index: number) => (
            <TimelineStepCard
              key={event.id || String(index)}
              event={event}
              isFirst={index === 0}
              isLast={index === timelineEvents.length - 1}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
