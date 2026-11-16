import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AdmissionDecision } from '../../types/admission.types';

export interface DecisionCardProps {
  decision: AdmissionDecision | null;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ decision }) => {
  if (!decision) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm items-center text-center mb-4">
        <View className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-3">
          <Ionicons name="ribbon-outline" size={24} color="#4f46e5" />
        </View>
        <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
          Decision Under Review
        </Text>
        <Text className="text-xs text-slate-400 text-center mt-1 leading-relaxed">
          The school admission committee has not released an admission decision yet.
        </Text>
      </View>
    );
  }

  const isApproved = decision.decision_status === 'approved';
  const isWaitlisted = decision.decision_status === 'waitlisted';
  const isRejected = decision.decision_status === 'rejected';

  const dateStr = decision.decision_date
    ? new Date(decision.decision_date).toLocaleDateString()
    : 'Recently';

  return (
    <View
      className={`rounded-3xl p-5 border shadow-sm mb-4 ${
        isApproved
          ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
          : isWaitlisted
            ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
            : isRejected
              ? 'bg-red-50/40 dark:bg-red-950/30 border-red-300 dark:border-red-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <View className="flex-row items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800 mb-3">
        <View>
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Admission Outcome
          </Text>
          <Text className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
            {isApproved
              ? 'Admission Offer Issued'
              : isWaitlisted
                ? 'Waitlisted'
                : isRejected
                  ? 'Application Declined'
                  : 'Under Review'}
          </Text>
        </View>

        <View
          className={`px-3 py-1 rounded-full border items-center justify-center ${
            isApproved
              ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700'
              : isWaitlisted
                ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700'
                : 'bg-red-100 dark:bg-red-900/60 border-red-300 dark:border-red-700'
          }`}
        >
          <Text
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              isApproved
                ? 'text-emerald-800 dark:text-emerald-200'
                : isWaitlisted
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-red-800 dark:text-red-200'
            }`}
          >
            {decision.decision_status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="space-y-2">
        <View className="flex-row justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs text-slate-500 font-medium">Decision Date</Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">{dateStr}</Text>
        </View>

        {decision.offer_expiry_date && (
          <View className="flex-row justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <Text className="text-xs text-slate-500 font-medium">Offer Valid Until</Text>
            <Text className="text-xs font-bold text-red-600 dark:text-red-400">
              {new Date(decision.offer_expiry_date).toLocaleDateString()}
            </Text>
          </View>
        )}

        {decision.waitlist_position !== undefined && decision.waitlist_position !== null && (
          <View className="flex-row justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <Text className="text-xs text-slate-500 font-medium">Waitlist Rank</Text>
            <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
              #{decision.waitlist_position}
            </Text>
          </View>
        )}

        {decision.remarks && (
          <View className="pt-2">
            <Text className="text-xs text-slate-400 font-medium mb-0.5">Official Remarks:</Text>
            <Text className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {decision.remarks}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
