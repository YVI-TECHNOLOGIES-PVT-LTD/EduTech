import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
      route: ROUTES.MODULES.STUDENT,
    },
    {
      id: 'assignments',
      title: 'Assignments',
      subtitle: 'Manage & Grade Assignments',
      icon: 'document-text-outline',
      iconColor: '#a855f7',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      route: ROUTES.TABS.DASHBOARD,
    },
    {
      id: 'exams',
      title: 'Exams',
      subtitle: 'Schedule & Manage Examinations',
      icon: 'newspaper-outline',
      iconColor: '#f97316',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      route: ROUTES.TABS.DASHBOARD,
    },
    {
      id: 'fees',
      title: 'Fee Collection',
      subtitle: 'Track Fee Payments & Dues',
      icon: 'card-outline',
      iconColor: '#10b981',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      route: ROUTES.TABS.DASHBOARD,
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'View Class Timetables',
      icon: 'calendar-outline',
      iconColor: '#0284c7',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      route: ROUTES.TABS.DASHBOARD,
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
            {/* 3D Character Avatar Placeholder */}
            <View className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-full overflow-hidden border border-indigo-200 justify-center items-center mr-3">
              <Ionicons name="person" size={26} color="#4f46e5" />
            </View>
            <View>
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Good Morning,
              </Text>
              <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {user?.fullName || 'John Doe'}
              </Text>
              <Text className="text-[11px] font-semibold text-slate-400">
                Admin • Greenfield School
              </Text>
            </View>
          </View>

          {/* Bell Notification Button */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.COMMON.NOTIFICATIONS as any)}
            className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-sm relative"
          >
            <Ionicons name="notifications-outline" size={22} color="#1e1b4b" />
            <View className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#312e81] rounded-full items-center justify-center border border-white">
              <Text className="text-[9px] font-bold text-white">3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Academic Year Hero Banner Card */}
        <View className="bg-[#312e81] rounded-3xl p-5 mb-6 flex-row items-center justify-between shadow-lg shadow-indigo-900/30">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
              <Ionicons name="school" size={30} color="#312e81" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-indigo-200">
                Academic Year 2024-25
              </Text>
              <Text className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Greenfield School
              </Text>
              <Text className="text-xs text-indigo-100/90 font-medium mt-0.5">
                Excellence in Education
              </Text>
            </View>
          </View>

          <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Quick Overview Section */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Quick Overview
          </Text>
          <TouchableOpacity>
            <Text className="text-xs font-bold text-[#3730a3] dark:text-indigo-400">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4 Column Overview Cards */}
        <View className="flex-row justify-between mb-6">
          <View className="w-[23%] bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 items-center shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 items-center justify-center mb-2">
              <Ionicons name="people" size={18} color="#a855f7" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100">1,248</Text>
            <Text className="text-[10px] font-semibold text-slate-400">Students</Text>
          </View>

          <View className="w-[23%] bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 items-center shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center mb-2">
              <Ionicons name="easel" size={18} color="#10b981" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100">98</Text>
            <Text className="text-[10px] font-semibold text-slate-400">Teachers</Text>
          </View>

          <View className="w-[23%] bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 items-center shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center mb-2">
              <Ionicons name="book" size={18} color="#6366f1" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100">28</Text>
            <Text className="text-[10px] font-semibold text-slate-400">Classes</Text>
          </View>

          <View className="w-[23%] bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 items-center shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 items-center justify-center mb-2">
              <Ionicons name="business" size={18} color="#0284c7" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100">3</Text>
            <Text className="text-[10px] font-semibold text-slate-400">Branches</Text>
          </View>
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
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${item.bgColor}`}>
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
