import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AdmissionApplication } from '../../types/admission.types';
import { getApplicationStatusConfig } from '../../utils/status-mapper';
import { useTheme } from '../../theme';

export interface ApplicationStatusCardProps {
  application: AdmissionApplication;
  onPress?: () => void;
  isSelected?: boolean;
}

export const ApplicationStatusCard: React.FC<ApplicationStatusCardProps> = ({
  application,
  onPress,
  isSelected = false,
}) => {
  const { colors } = useTheme();

  const appId = application.application_id || (application as any).id;

  const studentName =
    application.student_name ||
    (application.student_first_name
      ? `${application.student_first_name} ${application.student_last_name || ''}`.trim()
      : application.leads
        ? `${application.leads.student_first_name || ''} ${application.leads.student_last_name || ''}`.trim()
        : application.lead
          ? `${application.lead.student_first_name || ''} ${application.lead.student_last_name || ''}`.trim()
          : 'Student Applicant') ||
    'Student Applicant';

  const appNumber =
    application.application_number ||
    (appId ? `APP-${String(appId).slice(0, 8).toUpperCase()}` : 'APP-2026');

  const gradeApplied =
    application.grade_applied_for ||
    application.lead?.grade_applied_for ||
    application.leads?.academic_year_grades?.grades?.grade_name ||
    'Grade Applied';

  const submittedDate =
    application.application_date || application.created_at
      ? new Date(application.application_date || application.created_at!).toLocaleDateString()
      : 'Recently';

  const statusConfig = getApplicationStatusConfig(application.status);

  const initials =
    studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('') || 'SA';

  const isFeePending = String(application.status).toLowerCase().includes('fee');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Application for ${studentName}, Status: ${statusConfig.label}`}
      className={`bg-white dark:bg-slate-900 rounded-3xl p-5 mb-4 border shadow-sm ${
        isSelected
          ? 'border-indigo-600 dark:border-indigo-400 shadow-indigo-600/10'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Header: Avatar, Name, App Number, Status Badge */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center flex-1 mr-2">
          {/* Avatar / Initials Box */}
          <View className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 items-center justify-center mr-3">
            <Text className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {initials}
            </Text>
          </View>

          {/* Student Name & App Number */}
          <View className="flex-1">
            <Text
              className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight"
              numberOfLines={1}
            >
              {studentName}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View className="bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 mr-2">
                <Text className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-300">
                  {appNumber}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <View
          className={`px-3 py-1 rounded-full border items-center justify-center ${statusConfig.badgeBg} ${statusConfig.badgeBorder}`}
        >
          <Text
            className={`text-[10px] font-extrabold uppercase tracking-wider ${statusConfig.badgeText}`}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Meta Info: Grade & Submission Date */}
      <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-3.5 py-2.5 mb-4">
        <View className="flex-row items-center">
          <Feather name="book" size={13} color="#64748b" />
          <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1.5">
            Grade: {gradeApplied}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Feather name="calendar" size={13} color="#64748b" />
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1.5">
            {submittedDate}
          </Text>
        </View>
      </View>

      {/* 4-Pill Workflow Progress Status */}
      <View className="flex-row justify-between mb-4 space-x-1.5">
        {/* Form Pill */}
        <View className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 items-center border border-slate-100 dark:border-slate-800">
          <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Form
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={12} color="#10b981" />
            <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 ml-1">
              Done
            </Text>
          </View>
        </View>

        {/* Docs Pill */}
        <View className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 items-center border border-slate-100 dark:border-slate-800">
          <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Docs
          </Text>
          <View className="flex-row items-center">
            {application.status === 'documents_pending' ? (
              <>
                <Ionicons name="time" size={12} color="#f59e0b" />
                <Text className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 ml-1">
                  Pending
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 ml-1">
                  Verified
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Fee Pill */}
        <View className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 items-center border border-slate-100 dark:border-slate-800">
          <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Fee
          </Text>
          <View className="flex-row items-center">
            {isFeePending ? (
              <>
                <Ionicons name="time" size={12} color="#f59e0b" />
                <Text className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 ml-1">
                  Due
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 ml-1">
                  Paid
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Review Pill */}
        <View className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 items-center border border-slate-100 dark:border-slate-800">
          <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Stage
          </Text>
          <Text
            className={`text-[10px] font-extrabold truncate ${statusConfig.badgeText}`}
            numberOfLines={1}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Card Action Row */}
      <View className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
        <Text className="text-xs text-slate-400 font-medium">{statusConfig.description}</Text>
        <View className="flex-row items-center">
          <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-1">
            View Details
          </Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
