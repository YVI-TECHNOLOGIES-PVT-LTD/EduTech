import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ApplicantChild } from '../../types/child.types';
import { Badge } from '../ui/atoms/Badge';

export interface ApplicantDashboardViewProps {
  applicant: ApplicantChild;
}

export const ApplicantDashboardView: React.FC<ApplicantDashboardViewProps> = ({ applicant }) => {
  const router = useRouter();
  const appId = applicant.applicationId;

  const getStageDisplay = (stage: string) => {
    switch (stage) {
      case 'submitted':
        return { label: 'Application Submitted', color: 'primary' as const };
      case 'documents_pending':
        return { label: 'Documents Pending', color: 'warning' as const };
      case 'under_review':
        return { label: 'Under Review', color: 'info' as const };
      case 'assessment_scheduled':
        return { label: 'Assessment Scheduled', color: 'primary' as const };
      case 'fee_pending':
        return { label: 'Fee Payment Pending', color: 'warning' as const };
      case 'decision_ready':
      case 'offer_accepted':
        return { label: 'Offer Issued', color: 'success' as const };
      default:
        return { label: 'In Progress', color: 'primary' as const };
    }
  };

  const stageInfo = getStageDisplay(applicant.stage);

  return (
    <View className="mb-6">
      {/* 1. Status Stepper Card */}
      <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="document-text-outline" size={18} color="#4f46e5" />
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
              Admission Progress
            </Text>
          </View>
          <Badge label={stageInfo.label} variant={stageInfo.color} />
        </View>

        <View className="mb-3">
          <View className="flex-row items-baseline justify-between mb-1.5">
            <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
              {applicant.applicationNumber}
            </Text>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {applicant.progressPercentage}% Completed
            </Text>
          </View>
          <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${applicant.progressPercentage}%` }}
            />
          </View>
        </View>

        {applicant.actionRequiredNotice && (
          <View className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3 flex-row items-center mb-3">
            <Ionicons name="alert-circle" size={16} color="#d97706" />
            <Text className="text-xs font-bold text-amber-800 dark:text-amber-200 ml-2 flex-1">
              {applicant.actionRequiredNotice}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push(`/(parent)/applications/${appId}` as any)}
          className="bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl items-center justify-center"
        >
          <Text className="text-xs font-bold text-white">Open Application Hub</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Admission Quick Shortcuts */}
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
        Application Checklist
      </Text>
      <View className="flex-row flex-wrap gap-2.5 mb-4">
        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/documents` as any)}
          className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex-row items-center shadow-sm"
        >
          <View className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 items-center justify-center mr-2.5">
            <Ionicons name="folder-open-outline" size={18} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">Documents</Text>
            <Text className="text-[10px] text-slate-400">Upload & Verify</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/fees` as any)}
          className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex-row items-center shadow-sm"
        >
          <View className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 items-center justify-center mr-2.5">
            <Ionicons name="card-outline" size={18} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">App Fee</Text>
            <Text className="text-[10px] text-slate-400">Processing Fee</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/assessment` as any)}
          className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex-row items-center shadow-sm"
        >
          <View className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 items-center justify-center mr-2.5">
            <Ionicons name="calendar-outline" size={18} color="#0284c7" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">Assessment</Text>
            <Text className="text-[10px] text-slate-400">Interview Slot</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/timeline` as any)}
          className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex-row items-center shadow-sm"
        >
          <View className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 items-center justify-center mr-2.5">
            <Ionicons name="time-outline" size={18} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">Timeline</Text>
            <Text className="text-[10px] text-slate-400">Audit History</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
