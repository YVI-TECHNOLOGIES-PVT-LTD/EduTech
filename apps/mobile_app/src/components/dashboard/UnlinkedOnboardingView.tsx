import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';

export const UnlinkedOnboardingView: React.FC = () => {
  const router = useRouter();

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 items-center text-center shadow-sm mb-6">
      <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900">
        <Ionicons name="school-outline" size={32} color="#4f46e5" />
      </View>
      <Text className="text-lg font-black text-slate-900 dark:text-slate-100 text-center mb-1">
        Welcome to EduTrack ERP
      </Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs mb-6 leading-relaxed">
        To get started, apply for your child's school admission or connect your existing enrolled
        student profile.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(ROUTES.PARENT.WIZARD as any)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 py-3.5 rounded-xl items-center justify-center mb-2.5 flex-row"
      >
        <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
        <Text className="text-xs font-bold text-white ml-2">Apply for Admission</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(ROUTES.PARENT.APPLICATIONS as any)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl items-center justify-center flex-row"
      >
        <Ionicons name="document-text-outline" size={16} color="#475569" />
        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
          View Existing Applications
        </Text>
      </TouchableOpacity>
    </View>
  );
};
