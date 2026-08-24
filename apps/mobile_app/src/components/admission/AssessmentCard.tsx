import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AssessmentResult } from '../../types/admission.types';

export interface AssessmentCardProps {
  assessment: AssessmentResult | null;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment }) => {
  if (!assessment) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm items-center text-center mb-4">
        <View className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-3">
          <Ionicons name="school-outline" size={24} color="#4f46e5" />
        </View>
        <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
          No Assessment Scheduled
        </Text>
        <Text className="text-xs text-slate-400 text-center mt-1 leading-relaxed">
          The admissions panel has not scheduled an entrance test or student evaluation yet.
        </Text>
      </View>
    );
  }

  const isPassed = assessment.result === 'pass';
  const isFailed = assessment.result === 'fail';
  const dateStr = assessment.assessment_date
    ? new Date(assessment.assessment_date).toLocaleDateString()
    : 'Pending Schedule';

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4">
      <View className="flex-row items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Student Evaluation
          </Text>
          <Text className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
            Academic Assessment
          </Text>
        </View>

        <View
          className={`px-3 py-1 rounded-full border items-center justify-center ${
            isPassed
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
              : isFailed
                ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
          }`}
        >
          <Text
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              isPassed
                ? 'text-emerald-700 dark:text-emerald-300'
                : isFailed
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {assessment.result.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="space-y-2">
        <View className="flex-row justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs text-slate-500 font-medium">Evaluation Date</Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">{dateStr}</Text>
        </View>

        {assessment.marks_obtained !== undefined && (
          <View className="flex-row justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <Text className="text-xs text-slate-500 font-medium">Score Obtained</Text>
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {assessment.marks_obtained} / {assessment.maximum_marks || 100}
            </Text>
          </View>
        )}

        {assessment.percentage !== undefined && (
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-slate-500 font-medium">Percentage</Text>
            <Text className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {assessment.percentage}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
