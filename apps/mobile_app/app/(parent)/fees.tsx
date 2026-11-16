import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../../src/theme';
import { useMyChildrenFees } from '../../src/features/parent/hooks/useMyChildrenFees';
import { EnrolledChildFeeCard } from '../../src/components/parent/EnrolledChildFeeCard';
import { ChildFeeOverview } from '../../src/types/admission.types';
import { feesApi } from '../../src/api/fees.api';

export default function ParentFeesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const searchParams = useLocalSearchParams<{
    status?: string;
    txId?: string;
    studentId?: string;
  }>();

  const {
    children: enrolledChildren = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyChildrenFees();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(searchParams.studentId || '');
  const [hasProcessedDeepLink, setHasProcessedDeepLink] = useState(false);

  // Sync selectedStudentId when searchParams.studentId changes or on children load
  useEffect(() => {
    if (searchParams.studentId) {
      setSelectedStudentId(searchParams.studentId);
    } else if (!selectedStudentId && enrolledChildren.length > 0) {
      setSelectedStudentId(enrolledChildren[0].student_id);
    }
  }, [searchParams.studentId, enrolledChildren]);

  // Handle deep link status params (e.g., from Razorpay redirect edutrack://parent/fees?status=success&txId=...)
  useEffect(() => {
    let isCancelled = false;
    if (hasProcessedDeepLink) return;

    if (searchParams.status === 'success') {
      setHasProcessedDeepLink(true);
      const txId = searchParams.txId;

      // Authoritative status check: Do NOT trust client-supplied status=success
      const verifyStatus = async () => {
        if (txId) {
          try {
            const receipt = await feesApi.getParentReceipt(txId);
            if (isCancelled) return;

            const isConfirmedSuccess =
              receipt &&
              receipt.transaction_status === 'success' &&
              receipt.receipt_type !== 'CANCELLED' &&
              receipt.status !== 'CANCELLED';

            if (isConfirmedSuccess) {
              const receiptNo = receipt.receipt_number || receipt.receipt_no || 'REC-' + txId;
              const receiptAmount = receipt.amount
                ? `₹${Number(receipt.amount).toLocaleString()}`
                : '';

              Alert.alert(
                'Payment Settled & Reconciled',
                `Official Receipt: ${receiptNo}\nAmount: ${receiptAmount}\nYour student fee ledger has been authoritatively updated.`,
                [
                  {
                    text: 'View Receipt Details',
                    onPress: () => {
                      Alert.alert(
                        'Fee Payment Receipt',
                        `Receipt No: ${receiptNo}\nStudent: ${receipt.student_name || 'Enrolled Student'}\nAmount: ${receiptAmount}\nStatus: Settled & Allocated\nPayment Mode: ${receipt.payment_method || 'Online'}`,
                        [{ text: 'Close' }],
                      );
                    },
                  },
                  { text: 'Done', style: 'default' },
                ],
              );
            } else {
              // Status pending or unconfirmed
              Alert.alert(
                'Payment Processing',
                'Your payment was recorded and is pending ledger allocation. Your ledger will update once reconciliation completes.',
                [{ text: 'OK' }],
              );
            }
          } catch (err: any) {
            if (isCancelled) return;
            const statusCode = err?.response?.status;
            if (statusCode === 400) {
              Alert.alert(
                'Payment Pending Allocation',
                'Your payment was captured by the gateway and is pending ledger allocation. Your ledger will update once reconciliation completes.',
              );
            } else if (statusCode === 403) {
              Alert.alert(
                'Access Denied',
                'You are not authorized to view financial records for this payment transaction.',
              );
            } else {
              Alert.alert(
                'Verification Notice',
                'Payment status is awaiting final confirmation from the school server. Please pull to refresh your balance in a moment.',
              );
            }
          }
        } else {
          Alert.alert(
            'Payment Processing',
            'Returned from checkout. Please pull down to refresh and verify your latest ledger balance.',
          );
        }
        refetch();
      };

      verifyStatus();
    } else if (searchParams.status === 'cancelled') {
      setHasProcessedDeepLink(true);
      Alert.alert(
        'Payment Incomplete',
        'Payment checkout was cancelled. No charges were posted to your ledger.',
      );
    }

    return () => {
      isCancelled = true;
    };
  }, [searchParams.status, searchParams.txId, hasProcessedDeepLink, refetch]);

  const activeStudentId =
    selectedStudentId || (enrolledChildren.length > 0 ? enrolledChildren[0].student_id : '');

  const activeEnrolledChild =
    enrolledChildren.find((c: ChildFeeOverview) => c.student_id === activeStudentId) ||
    (enrolledChildren.length > 0 ? enrolledChildren[0] : null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(parent)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.iconSecondary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Fee Center
            </Text>
            <Text className="text-xs font-semibold text-slate-400">
              Enrolled Student Fee Ledgers & Payments
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          disabled={isRefetching}
          className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          accessibilityLabel="Refresh fee balances"
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={18} color={colors.iconSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">
              Loading student fee ledgers...
            </Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <View className="my-6 bg-red-50 dark:bg-red-950/40 p-5 rounded-3xl border border-red-200 dark:border-red-800 items-center">
            <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
            <Text className="text-base font-black text-red-900 dark:text-red-200 mt-2">
              Unable to Load Fees
            </Text>
            <Text className="text-xs text-red-700 dark:text-red-300 text-center mt-1">
              {error?.message || 'Could not retrieve fee records from the server.'}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 px-5 py-2.5 bg-red-600 rounded-xl"
            >
              <Text className="text-xs font-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && enrolledChildren.length === 0 && (
          <View className="my-10 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 items-center shadow-sm">
            <View className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-4">
              <Ionicons name="card-outline" size={32} color="#6366f1" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-slate-100 text-center">
              No Enrolled Students Found
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 leading-relaxed px-4">
              Fee ledgers and scheduled dues are issued once a student admission is finalized and
              enrolled.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(parent)/applications' as any)}
              className="mt-6 px-6 py-3 bg-indigo-600 rounded-2xl flex-row items-center"
            >
              <Feather name="file-text" size={16} color="#ffffff" className="mr-2" />
              <Text className="text-xs font-bold text-white ml-2">View Admission Applications</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Multi-child Selector */}
        {!isLoading && !isError && enrolledChildren.length > 1 && (
          <View className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Student ({enrolledChildren.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              className="flex-row"
            >
              {enrolledChildren.map((c: ChildFeeOverview) => {
                const isSelected = c.student_id === activeStudentId;
                const name = c.first_name || c.full_name || 'Child';
                return (
                  <TouchableOpacity
                    key={c.student_id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedStudentId(c.student_id)}
                    className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-2.5 border shadow-sm ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                        isSelected ? 'bg-white/20' : 'bg-teal-50 dark:bg-teal-950/60'
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Selected Child Fee Details Card */}
        {!isLoading && !isError && activeEnrolledChild && (
          <EnrolledChildFeeCard
            child={activeEnrolledChild}
            initiallyExpanded={true}
            onPaymentSuccess={() => refetch()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
