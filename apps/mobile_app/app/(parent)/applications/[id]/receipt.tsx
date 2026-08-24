import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useApplicationReceipt } from '../../../../src/features/admission/hooks/useApplicationReceipt';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appId = id || '';

  const { data: receipt, isLoading, isError, error, refetch } = useApplicationReceipt(appId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-xs font-bold text-slate-500 mt-3">Loading receipt...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !receipt) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 justify-center">
        <View className="bg-amber-50 dark:bg-amber-950/40 p-6 rounded-3xl border border-amber-200 dark:border-amber-800 items-center text-center">
          <Ionicons name="receipt-outline" size={32} color="#f59e0b" />
          <Text className="text-base font-black text-amber-900 dark:text-amber-200 mt-2">
            No Receipt Available
          </Text>
          <Text className="text-xs text-amber-700 dark:text-amber-400 mt-1 text-center leading-relaxed">
            {error?.message || 'Payment has not been recorded or settled for this application yet.'}
          </Text>
          <View className="flex-row space-x-3 mt-5">
            <Button title="Go Back" variant="outline" size="sm" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const paymentDate = receipt.payment_date
    ? new Date(receipt.payment_date).toLocaleDateString()
    : 'Recently';

  const currency = receipt.currency || 'INR';
  const symbol = currency === 'INR' ? '₹' : `${currency} `;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.iconSecondary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Payment Receipt
            </Text>
            <Text className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {receipt.receipt_number || 'REC-2026-001'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Receipt Paper Card */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Header Brand */}
          <View className="items-center pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
            <View className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center mb-2">
              <Ionicons name="checkmark-circle" size={28} color="#10b981" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100">
              EduTrack ERP
            </Text>
            <Text className="text-xs font-bold text-slate-400 mt-0.5">
              Official Admission Fee Receipt
            </Text>
            <Text className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {symbol}
              {receipt.amount.toLocaleString()}
            </Text>
          </View>

          {/* Details Table */}
          <View className="py-4 space-y-2.5 border-b border-dashed border-slate-200 dark:border-slate-800">
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Receipt No</Text>
              <Text className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                {receipt.receipt_number}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Application No</Text>
              <Text className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {receipt.application_number}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Applicant</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {receipt.student_name}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Parent / Guardian</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {receipt.parent_name}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Payment Date</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {paymentDate}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Payment Mode</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                {receipt.payment_mode}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Transaction Ref</Text>
              <Text className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {receipt.transaction_reference || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Breakdown if present */}
          {receipt.breakdown && (
            <View className="py-4 space-y-2 border-b border-dashed border-slate-200 dark:border-slate-800">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Charge Breakdown
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-600 dark:text-slate-300">Application Fee</Text>
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {symbol}
                  {receipt.breakdown.application_fee.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-600 dark:text-slate-300">Processing Fee</Text>
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {symbol}
                  {receipt.breakdown.processing_fee.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Verification Stamp */}
          <View className="pt-4 items-center">
            <View className="bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex-row items-center">
              <Ionicons name="shield-checkmark" size={13} color="#10b981" />
              <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-200 ml-1">
                Authorized Digital Receipt
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
