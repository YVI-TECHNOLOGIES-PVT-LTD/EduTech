import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useApplicationFee } from '../../../../src/features/admission/hooks/useApplicationFee';
import { useRecordPayment } from '../../../../src/features/admission/hooks/useRecordPayment';
import { FeeBreakdownCard } from '../../../../src/components/admission/FeeBreakdownCard';
import { PaymentMode } from '../../../../src/types/admission.types';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function FeePaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appId = id || '';
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('upi');

  // 1. Fetch Fee Statement
  const {
    data: feeSummary,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useApplicationFee(appId);

  // 2. Payment Mutation (No retry, double-submit safe)
  const { mutate: payFee, isPending: isPaying } = useRecordPayment();

  const handlePayNow = () => {
    if (isPaying) return;

    payFee(
      {
        applicationId: appId,
        payload: {
          payment_mode: selectedMode,
          transaction_reference: `MOB-${Date.now()}`,
          remarks: 'Admission application processing fee settled via mobile self-service',
        },
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Payment Successful',
            'Your admission fee payment has been recorded and settled.',
            [
              {
                text: 'View Receipt',
                onPress: () => router.push(`/(parent)/applications/${appId}/receipt` as any),
              },
              { text: 'OK', style: 'cancel' },
            ],
          );
          refetch();
        },
        onError: (err) => {
          Alert.alert('Payment Failed', err.message || 'Unable to complete fee transaction.');
        },
      },
    );
  };

  const isPaid = feeSummary?.payment_status === 'paid' || feeSummary?.payment_status === 'waived';

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
              Fee Statement
            </Text>
            <Text className="text-xs font-semibold text-slate-400">
              Admission Charges & Settlement
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          accessibilityLabel="Refresh fee statement"
        >
          <Feather name="refresh-cw" size={18} color={colors.iconSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading */}
        {isLoading && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">Loading fee statement...</Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                Failed to load fee statement
              </Text>
            </View>
            <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
              {error?.message || 'A network error occurred while retrieving fee details.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Fee Statement Content */}
        {!isLoading && !isError && feeSummary && (
          <>
            <FeeBreakdownCard feeSummary={feeSummary} />

            {/* If Paid: Action to View Receipt */}
            {isPaid ? (
              <View className="mt-2 space-y-3">
                <Button
                  title="View Official Receipt"
                  variant="primary"
                  size="lg"
                  onPress={() => router.push(`/(parent)/applications/${appId}/receipt` as any)}
                />
              </View>
            ) : (
              /* If Due: Settlement Mode Selection & Pay Button */
              <View className="mt-2 space-y-4">
                <View>
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5">
                    Select Settlement Mode
                  </Text>
                  <View className="flex-row space-x-2">
                    {(['upi', 'card', 'netbanking'] as const).map((mode) => {
                      const isSelected = selectedMode === mode;
                      const label =
                        mode === 'upi' ? 'UPI' : mode === 'card' ? 'Debit/Credit' : 'Net Banking';
                      const iconName =
                        mode === 'upi' ? 'qr-code' : mode === 'card' ? 'card' : 'globe';

                      return (
                        <TouchableOpacity
                          key={mode}
                          activeOpacity={0.8}
                          onPress={() => setSelectedMode(mode)}
                          className={`flex-1 p-3.5 rounded-2xl border items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Ionicons
                            name={iconName as any}
                            size={20}
                            color={isSelected ? '#ffffff' : colors.iconSecondary}
                          />
                          <Text
                            className={`text-xs font-bold mt-1.5 ${
                              isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Pay Action Button */}
                <Button
                  title={
                    isPaying ? 'Processing Payment...' : `Pay ₹${feeSummary.total_fee || 750} Now`
                  }
                  variant="primary"
                  size="lg"
                  isLoading={isPaying}
                  disabled={isPaying}
                  onPress={handlePayNow}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
