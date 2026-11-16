import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { useAuthStore } from '../../src/stores/auth.store';
import { ROUTES } from '../../src/constants/routes';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const quickAccessItems = [
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Mark & View Attendance',
      icon: 'school-outline',
      iconColor: '#6366f1',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      route: ROUTES.MAIN.ACADEMICS,
    },
    {
      id: 'assignments',
      title: 'Assignments',
      subtitle: 'Manage & Grade Assignments',
      icon: 'document-text-outline',
      iconColor: '#a855f7',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      route: ROUTES.MAIN.ACADEMICS,
    },
    {
      id: 'exams',
      title: 'Exams',
      subtitle: 'Schedule & Manage Examinations',
      icon: 'newspaper-outline',
      iconColor: '#f97316',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      route: ROUTES.MAIN.ACADEMICS,
    },
    {
      id: 'fees',
      title: 'Fee Collection',
      subtitle: 'Track Fee Payments & Dues',
      icon: 'card-outline',
      iconColor: '#10b981',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      route: ROUTES.MAIN.FINANCE,
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'View Class Timetables',
      icon: 'calendar-outline',
      iconColor: '#0284c7',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      route: ROUTES.MAIN.ACADEMICS,
    },
    {
      id: 'notices',
      title: 'Notices',
      subtitle: 'Important School Notices',
      icon: 'megaphone-outline',
      iconColor: '#f43f5e',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      route: ROUTES.COMMON.NOTIFICATIONS,
    },
  ];

  return (
    <ScreenWrapper scrollable padded={false} className="bg-[#f4f5f9] dark:bg-slate-900">
      <View className="px-5 pt-3 pb-6">
        {/* Top Header Bar */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-full overflow-hidden border border-indigo-200 justify-center items-center mr-3">
              <Ionicons name="person" size={26} color="#4f46e5" />
            </View>
            <View>
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Good Morning,
              </Text>
              <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {user?.fullName || 'Parent'}
              </Text>
              <Text className="text-[11px] font-semibold text-slate-400">
                Parent • EduTrack School
              </Text>
            </View>
          </View>

          {/* Bell Notification Button */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.COMMON.NOTIFICATIONS as any)}
            className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-sm relative"
          >
            <Ionicons name="notifications-outline" size={22} color="#1e1b4b" />
          </TouchableOpacity>
        </View>

        {/* Academic Year Hero Banner Card */}
        <View className="bg-[#312e81] rounded-3xl p-5 mb-6 flex-row items-center justify-between shadow-lg shadow-indigo-900/30">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
              <Ionicons name="school" size={30} color="#312e81" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-indigo-200">Academic Year 2026-27</Text>
              <Text className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                EduTrack ERP
              </Text>
              <Text className="text-xs text-indigo-100/90 font-medium mt-0.5">
                Excellence in Education
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push(ROUTES.MAIN.HOME as any)}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Quick Access Section */}
        <Text className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-3">
          Quick Access
        </Text>

        {/* 2x3 Grid Cards */}
        <View className="flex-row flex-wrap justify-between">
          {quickAccessItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              onPress={() => router.push(item.route as any)}
              className="w-[48%] bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-3.5 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${item.bgColor}`}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <Ionicons name="arrow-forward" size={16} color="#4338ca" />
              </View>

              <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
                {item.title}
              </Text>
              <Text className="text-[11px] font-medium text-slate-400 mt-0.5" numberOfLines={1}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}
