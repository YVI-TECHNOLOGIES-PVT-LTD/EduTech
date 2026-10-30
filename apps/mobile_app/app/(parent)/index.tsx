import React, { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { applicationsApi } from '../../src/api/applications.api';
import { notificationsApi } from '../../src/api/notifications.api';
import { QUERY_KEYS } from '../../src/api/query-keys';
import { ApplicationStatusCard } from '../../src/components/admission/ApplicationStatusCard';
import { ChildSwitcher } from '../../src/components/admission/ChildSwitcher';
import { EnrolledChildFeeCard } from '../../src/components/parent/EnrolledChildFeeCard';
import { useMyChildrenFees } from '../../src/features/parent';
import { AdmissionApplication, ChildFeeOverview } from '../../src/types/admission.types';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // 1. Fetch Parent Applications
  const {
    data: applications = [],
    isLoading: loadingApps,
    isError: errorApps,
    error: appError,
    refetch: refetchApps,
    isRefetching: refetchingApps,
  } = useQuery<AdmissionApplication[], Error>({
    queryKey: QUERY_KEYS.applications.mine(),
    queryFn: () => applicationsApi.listMine(),
  });

  // 2. Fetch Parent's Enrolled Children & Fee Summary
  const {
    children: enrolledChildren = [],
    isLoading: loadingChildren,
    refetch: refetchChildren,
    isRefetching: refetchingChildren,
  } = useMyChildrenFees();

  // 3. Fetch Unread Notifications Count
  const { data: unreadCount = 0 } = useQuery<number, Error>({
    queryKey: QUERY_KEYS.notifications.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30,
  });

  const handleRefreshAll = async () => {
    await Promise.all([refetchApps(), refetchChildren()]);
  };

  const isGlobalRefreshing = refetchingApps || refetchingChildren;
  const isGlobalLoading = loadingApps && loadingChildren;

  // Auto-select first application
  const activeAppId =
    selectedAppId ||
    (applications.length > 0 ? applications[0].application_id || (applications[0] as any).id : '');

  const activeApplication =
    applications.find(
      (app: AdmissionApplication) => (app.application_id || (app as any).id) === activeAppId,
    ) || (applications.length > 0 ? applications[0] : null);

  // Auto-select first enrolled student
  const activeStudentId =
    selectedStudentId || (enrolledChildren.length > 0 ? enrolledChildren[0].student_id : '');

  const activeEnrolledChild =
    enrolledChildren.find((c: ChildFeeOverview) => c.student_id === activeStudentId) ||
    (enrolledChildren.length > 0 ? enrolledChildren[0] : null);

  const parentName = user?.full_name || user?.fullName || 'Parent';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-indigo-600 items-center justify-center mr-3 shadow-md shadow-indigo-600/30">
            <Ionicons name="school" size={20} color="#ffffff" />
          </View>
          <View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              EduTrack ERP
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Parent Portal
            </Text>
          </View>
        </View>

        {/* Notifications Icon with Badge */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(parent)/notifications' as any)}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unreadCount} unread`}
          className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center relative"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.iconSecondary} />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-2 border-white dark:border-slate-900">
              <Text className="text-[9px] font-extrabold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isGlobalRefreshing}
            onRefresh={handleRefreshAll}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Welcome Greeting Banner */}
        <View className="mb-6 bg-indigo-600 dark:bg-indigo-900/60 rounded-3xl p-6 shadow-lg shadow-indigo-600/20">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Parent Self-Service Hub
            </Text>
            <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
              <Text className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                Active Session
              </Text>
            </View>
          </View>
          <Text className="text-xl font-black text-white tracking-tight">
            Welcome back, {parentName}!
          </Text>
          <Text className="text-xs text-indigo-100 mt-1 leading-relaxed">
            Monitor enrolled student fee ledgers, track admission milestones, and access school
            services.
          </Text>
        </View>

        {/* 2. Loading State */}
        {isGlobalLoading && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">
              Loading student records & applications...
            </Text>
          </View>
        )}

        {/* 3. Enrolled Children & Fee Ledger Section */}
        {!isGlobalLoading && enrolledChildren.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Enrolled Students ({enrolledChildren.length})
              </Text>
              <TouchableOpacity onPress={handleRefreshAll} className="flex-row items-center">
                <Feather name="refresh-cw" size={12} color={colors.primary} />
                <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>

            {/* Enrolled Child Switcher if multiple */}
            {enrolledChildren.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                className="flex-row mb-3"
              >
                {enrolledChildren.map((c: ChildFeeOverview) => {
                  const isSelected = c.student_id === activeStudentId;
                  const name = c.first_name || c.full_name || 'Child';
                  return (
                    <TouchableOpacity
                      key={c.student_id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedStudentId(c.student_id)}
                      className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-2.5 border shadow-sm ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                          isSelected ? 'bg-white/20' : 'bg-teal-50 dark:bg-teal-950/60'
                        }`}
                      >
                        <Text
                          className={`text-xs font-black ${
                            isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'
                          }`}
                        >
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {activeEnrolledChild && <EnrolledChildFeeCard child={activeEnrolledChild} />}
          </View>
        )}

        {/* 4. Active Applications Section */}
        {!isGlobalLoading && applications.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Admission Applications ({applications.length})
              </Text>
              {enrolledChildren.length === 0 && (
                <TouchableOpacity onPress={handleRefreshAll} className="flex-row items-center">
                  <Feather name="refresh-cw" size={12} color={colors.primary} />
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                    Refresh
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Multi-Child Application Switcher */}
            <ChildSwitcher
              applications={applications}
              selectedId={activeAppId}
              onSelect={(id) => setSelectedAppId(id)}
            />

            {activeApplication && (
              <ApplicationStatusCard
                application={activeApplication}
                onPress={() => {
                  const appId = activeApplication.application_id || (activeApplication as any).id;
                  router.push(`/(parent)/applications/${appId}` as any);
                }}
              />
            )}
          </View>
        )}

        {/* 5. Error State */}
        {!isGlobalLoading &&
          errorApps &&
          applications.length === 0 &&
          enrolledChildren.length === 0 && (
            <View className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5">
              <View className="flex-row items-center mb-2">
                <Ionicons name="alert-circle" size={22} color="#ef4444" />
                <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                  Unable to load records
                </Text>
              </View>
              <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
                {appError?.message || 'A network error occurred while retrieving your data.'}
              </Text>
              <Button
                title="Retry Connection"
                variant="outline"
                size="sm"
                onPress={handleRefreshAll}
              />
            </View>
          )}

        {/* 6. Empty State (Neither applications nor enrolled children) */}
        {!isGlobalLoading &&
          !errorApps &&
          applications.length === 0 &&
          enrolledChildren.length === 0 && (
            <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center text-center border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
              <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900">
                <Ionicons name="document-text-outline" size={32} color="#4f46e5" />
              </View>
              <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">
                No Student Records Yet
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5 leading-relaxed max-w-xs">
                Start your child's enrollment process by completing an online admission application.
              </Text>
              <View className="w-full mt-6">
                <Button
                  title="Start Admission Application"
                  variant="primary"
                  size="md"
                  onPress={() => router.push('/(parent)/applications/wizard' as any)}
                />
              </View>
            </View>
          )}

        {/* 7. Quick Action Cards */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Quick Shortcuts & Portals
          </Text>

          <View className="space-y-3">
            {/* New Application Wizard */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(parent)/applications/wizard' as any)}
              className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-indigo-600 items-center justify-center mr-3">
                  <Ionicons name="add-circle" size={22} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-black text-indigo-950 dark:text-indigo-200">
                    New Admission Application
                  </Text>
                  <Text className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                    Start a new 8-step admission form for another child
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#6366f1" />
            </TouchableOpacity>

            {/* All Applications */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(parent)/applications' as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mr-3 border border-indigo-100 dark:border-indigo-900">
                  <Ionicons name="folder-open" size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    My Applications
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    View all registered student admissions ({applications.length})
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(parent)/notifications' as any)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center mr-3 border border-emerald-100 dark:border-emerald-900">
                  <Ionicons name="notifications" size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Notifications & Alerts
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} unread update(s)`
                      : 'No unread notifications'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
