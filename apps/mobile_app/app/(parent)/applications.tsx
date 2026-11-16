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
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useMyApplications } from '../../src/features/admission';
import { ApplicationStatusCard } from '../../src/components/admission/ApplicationStatusCard';
import { AdmissionApplication } from '../../src/types/admission.types';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentApplicationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyApplications();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            My Applications
          </Text>
          <Text className="text-xs font-semibold text-slate-400">
            {applications.length} Active {applications.length === 1 ? 'Record' : 'Records'}
          </Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => router.push('/(parent)/applications/wizard' as any)}
            className="bg-indigo-600 px-3 py-2 rounded-2xl flex-row items-center shadow-sm mr-2"
            accessibilityLabel="Create new application"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white ml-1">New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => refetch()}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
            accessibilityLabel="Refresh applications"
          >
            <Feather name="refresh-cw" size={18} color={colors.iconSecondary} />
          </TouchableOpacity>
        </View>
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
        {/* Loading */}
        {isLoading && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">
              Loading admission applications...
            </Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                Failed to load applications
              </Text>
            </View>
            <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
              {error?.message || 'A network error occurred.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty */}
        {!isLoading && !isError && applications.length === 0 && (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900">
              <Ionicons name="folder-open-outline" size={32} color="#4f46e5" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">
              No Registered Applications
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5 leading-relaxed mb-5">
              Start your child's enrollment by creating an online admission application.
            </Text>
            <Button
              title="Start Admission Application"
              variant="primary"
              size="md"
              onPress={() => router.push('/(parent)/applications/wizard' as any)}
            />
          </View>
        )}

        {/* List */}
        {!isLoading &&
          !isError &&
          applications.map((app: AdmissionApplication) => {
            const appId = app.application_id || (app as any).id;
            return (
              <ApplicationStatusCard
                key={appId}
                application={app}
                onPress={() => router.push(`/(parent)/applications/${appId}` as any)}
              />
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
