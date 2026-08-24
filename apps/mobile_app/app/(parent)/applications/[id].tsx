import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, Feather } from '@expo/vector-icons';
import { applicationsApi } from '../../../src/api/applications.api';
import { QUERY_KEYS } from '../../../src/api/query-keys';
import { getApplicationStatusConfig } from '../../../src/utils/status-mapper';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/atoms/Button';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appId = id || '';

  const {
    data: application,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.applications.detail(appId),
    queryFn: () => applicationsApi.getById(appId),
    enabled: Boolean(appId),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-xs font-bold text-slate-500 mt-3">Loading application hub...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !application) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 justify-center">
        <View className="bg-red-50 dark:bg-red-950/40 p-6 rounded-3xl border border-red-200 dark:border-red-800 items-center text-center">
          <Ionicons name="alert-circle" size={32} color="#ef4444" />
          <Text className="text-base font-black text-red-700 dark:text-red-300 mt-2">
            Failed to Load Application
          </Text>
          <Text className="text-xs text-red-600 dark:text-red-400 mt-1 text-center leading-relaxed">
            {error?.message || 'The application could not be found or you do not have permission.'}
          </Text>
          <View className="flex-row space-x-3 mt-5">
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
            <Button title="Go Back" variant="primary" size="sm" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const studentName =
    application.student_name ||
    (application.student_first_name
      ? `${application.student_first_name} ${application.student_last_name || ''}`.trim()
      : application.leads
        ? `${application.leads.student_first_name || ''} ${application.leads.student_last_name || ''}`.trim()
        : 'Student Applicant');

  const appNumber =
    application.application_number ||
    `APP-${String(application.application_id || appId)
      .slice(0, 8)
      .toUpperCase()}`;

  const statusConfig = getApplicationStatusConfig(application.status);
  const submittedDate =
    application.application_date || application.created_at
      ? new Date(application.application_date || application.created_at!).toLocaleDateString()
      : 'Recently';

  const documents = application.admission_documents || (application as any).documents || [];
  const docCount = documents.length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
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
            <Text
              className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight"
              numberOfLines={1}
            >
              {studentName}
            </Text>
            <Text className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {appNumber}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          className={`px-3 py-1 rounded-full border ${statusConfig.badgeBg} ${statusConfig.badgeBorder}`}
        >
          <Text
            className={`text-[10px] font-extrabold uppercase tracking-wider ${statusConfig.badgeText}`}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Status Alert Banner */}
        <View className="bg-indigo-600 dark:bg-indigo-900/60 rounded-3xl p-5 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Current Application State
            </Text>
            <Text className="text-[10px] font-extrabold text-white bg-white/20 px-2.5 py-0.5 rounded-full">
              {statusConfig.progress}% Completed
            </Text>
          </View>
          <Text className="text-lg font-black text-white">{statusConfig.label}</Text>
          <Text className="text-xs text-indigo-100 mt-1 leading-relaxed">
            {statusConfig.description}
          </Text>
        </View>

        {/* Action Hub Portals */}
        <View className="mb-5">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Application Portals & Actions
          </Text>

          <View className="space-y-3">
            {/* 1. Document Center */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/documents` as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mr-3 border border-indigo-100 dark:border-indigo-900">
                  <Ionicons name="document-attach" size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Document Center
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {docCount} {docCount === 1 ? 'document' : 'documents'} attached • View & upload
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 2. Fees & Payments */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/fees` as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 items-center justify-center mr-3 border border-teal-100 dark:border-teal-900">
                  <Ionicons name="card" size={20} color="#0d9488" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Fee Statement & Settlement
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Admission charges, payments & receipts
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 3. Assessment Tracker */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/assessment` as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 items-center justify-center mr-3 border border-purple-100 dark:border-purple-900">
                  <Ionicons name="school" size={20} color="#9333ea" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Assessment Tracker
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Entrance test schedule, venue & scores
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 4. Decision Tracker */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/decision` as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 items-center justify-center mr-3 border border-amber-100 dark:border-amber-900">
                  <Ionicons name="ribbon" size={20} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Admission Decision
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Official admission outcome & offer letter
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 5. Status Timeline */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/timeline` as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center mr-3 border border-blue-100 dark:border-blue-900">
                  <Ionicons name="git-commit" size={20} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Milestone Timeline
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Chronological admission events & history
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Applicant Information */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Applicant Summary
          </Text>
          <View className="space-y-2">
            <View className="flex-row justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs text-slate-500">Applicant</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {studentName}
              </Text>
            </View>
            <View className="flex-row justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs text-slate-500">Grade Applied</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {application.grade_applied_for || 'Grade 1'}
              </Text>
            </View>
            <View className="flex-row justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs text-slate-500">Primary Contact</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {application.parent_name || 'N/A'} ({application.parent_phone || 'N/A'})
              </Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-slate-500">Submission Date</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {submittedDate}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
