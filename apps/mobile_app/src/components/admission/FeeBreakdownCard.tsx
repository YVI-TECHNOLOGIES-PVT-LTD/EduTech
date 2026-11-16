import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { FeeSummary } from '../../types/admission.types';

export interface FeeBreakdownCardProps {
  feeSummary: FeeSummary;
}

export const FeeBreakdownCard: React.FC<FeeBreakdownCardProps> = ({ feeSummary }) => {
  const isPaid = feeSummary.payment_status === 'paid' || feeSummary.payment_status === 'waived';
  const currency = feeSummary.currency || 'INR';
  const symbol = currency === 'INR' ? '₹' : `${currency} `;

  const appFee = feeSummary.application_fee || 0;
  const procFee = feeSummary.processing_fee || 0;
  const total = feeSummary.total_fee || appFee + procFee;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <View>
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Fee Statement
          </Text>
          <Text className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
            Admission Processing Charges
          </Text>
        </View>

        <View
          className={`px-3 py-1 rounded-full border items-center justify-center ${
            isPaid
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
          }`}
        >
          <Text
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              isPaid
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {feeSummary.payment_status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Itemized Rows */}
      <View className="space-y-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-600 dark:text-slate-300">
            Application Registration Fee
          </Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {symbol}
            {appFee.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-600 dark:text-slate-300">
            Document Verification & Processing
          </Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {symbol}
            {procFee.toLocaleString()}
          </Text>
        </View>

        <View className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
          <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
            Total Application Amount
          </Text>
          <Text className="text-base font-black text-indigo-600 dark:text-indigo-400">
            {symbol}
            {total.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Payment Details if Paid */}
      {isPaid && feeSummary.payment && (
        <View className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/30 -mx-5 -mb-5 p-4 rounded-b-3xl">
          <View className="flex-row items-center mb-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-200 ml-1.5">
              Settlement Confirmed
            </Text>
          </View>
          <View className="flex-row justify-between text-[11px]">
            <Text className="text-xs text-slate-500">
              Ref: {feeSummary.payment.transaction_reference || 'N/A'}
            </Text>
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
              Mode: {feeSummary.payment.payment_mode}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
