import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ChildFeeOverview } from '../../types/admission.types';
import { useTheme } from '../../theme';
import { feesApi } from '../../api/fees.api';
import { ENV } from '../../config/env';

export interface EnrolledChildFeeCardProps {
  child: ChildFeeOverview;
  onPress?: () => void;
  isSelected?: boolean;
  initiallyExpanded?: boolean;
  onPaymentSuccess?: () => void;
}

export const EnrolledChildFeeCard: React.FC<EnrolledChildFeeCardProps> = ({
  child,
  onPress,
  isSelected = false,
  initiallyExpanded = false,
  onPaymentSuccess,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(initiallyExpanded);

  // Phase 3: Mobile Checkout and Receipt state
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [selectedDue, setSelectedDue] = React.useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [paymentStepText, setPaymentStepText] = React.useState('Confirm & Authorize Payment');
  const [isWaitingForPayment, setIsWaitingForPayment] = React.useState(false);
  const [pendingTxId, setPendingTxId] = React.useState<string | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [selectedReceipt, setSelectedReceipt] = React.useState<any | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = React.useState(false);

  const studentName =
    child.full_name || `${child.first_name} ${child.last_name || ''}`.trim() || 'Student';
  const admissionNo = child.admission_no || 'ADM-ENROLLED';
  const academicYear = child.academic_year_name || 'Academic Year Pending';
  const gradeName = child.grade_name || 'Class Grade';
  const sectionText = child.section_name
    ? `Sec: ${child.section_name}`
    : 'Section Allocation Pending';
  const rollNumber = child.roll_number || (child as any).roll_no || null;
  const rollText = rollNumber ? `Roll No: ${rollNumber}` : 'Roll No Pending';
  const gradeSection = child.grade_name
    ? `${child.grade_name}${child.section_name ? ` - ${child.section_name}` : ''}`
    : 'Class Grade';

  const initials =
    studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('') || 'ST';

  const summary = child.summary || {
    total_assessed: 0,
    total_paid: 0,
    outstanding_balance: 0,
    overdue_amount: 0,
    status: 'pending',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return {
          label: 'Fully Paid',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-700 dark:text-emerald-300',
        };
      case 'partially_paid':
        return {
          label: 'Partially Paid',
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-300',
        };
      case 'overdue':
        return {
          label: 'Payment Overdue',
          bg: 'bg-red-50 dark:bg-red-950/60',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
        };
      case 'no_fees_assigned':
        return {
          label: 'No Dues Assigned',
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          text: 'text-slate-600 dark:text-slate-400',
        };
      default:
        return {
          label: 'Pending',
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-300',
        };
    }
  };

  const statusBadge = getStatusBadge(summary.status);
  const nextDue = child.dues && child.dues.length > 0 ? child.dues[0] : null;

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleOpenCheckout = (due: any) => {
    if (!due || Number(due.outstanding_amount) <= 0) {
      Alert.alert('Installment Settled', 'This installment due has already been settled.');
      return;
    }
    setSelectedDue(due);
    setIsCheckoutOpen(true);
  };

  const handleInitiatePayment = async () => {
    if (!selectedDue || isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPaymentStepText('Creating payment order...');
    try {
      const targetStudentId = child.student_id || (child as any).id;
      const targetDueId = selectedDue.due_id || selectedDue.student_charge_due_id || selectedDue.id;

      const orderRes = await feesApi.createPaymentOrder({
        studentId: targetStudentId,
        student_id: targetStudentId,
        studentChargeDueId: targetDueId,
        student_charge_due_id: targetDueId,
        dueId: targetDueId,
        amount: Number(selectedDue.outstanding_amount),
        paymentMethod: 'card',
        payment_method: 'card',
      });

      if (!orderRes || !orderRes.order_id) {
        throw new Error('Failed to create payment order on gateway.');
      }

      setPaymentStepText('Opening secure payment gateway...');

      // Resolve full checkout URL:
      let checkoutUrl = orderRes.checkout_url;
      if (!checkoutUrl) {
        checkoutUrl = `/api/v1/fees/razorpay/checkout/${orderRes.payment_order_id}`;
      }
      if (!checkoutUrl.startsWith('http')) {
        const originBase = ENV.API_URL.replace(/\/api\/?$/, '');
        checkoutUrl = `${originBase}${checkoutUrl.startsWith('/') ? '' : '/'}${checkoutUrl}`;
      }

      setIsCheckoutOpen(false);
      setIsWaitingForPayment(true);
      setPendingTxId(orderRes.payment_order_id);

      // Launch the secure gateway page via browser / custom tab
      const canOpen = await Linking.canOpenURL(checkoutUrl).catch(() => true);
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
      } else {
        throw new Error('Unable to launch web browser for checkout.');
      }
    } catch (err: any) {
      setIsWaitingForPayment(false);
      Alert.alert(
        'Payment Incomplete',
        err?.response?.data?.message || err?.message || 'Payment could not be completed.',
      );
    } finally {
      setIsProcessingPayment(false);
      setPaymentStepText('Confirm & Authorize Payment');
    }
  };

  // Deep Link & AppState Lifecycle: Listen for gateway return
  React.useEffect(() => {
    let isCancelled = false;

    const handleUrlEvent = async ({ url }: { url: string }) => {
      if (!url || !isWaitingForPayment) return;

      if (url.includes('status=success')) {
        const match = url.match(/txId=([^&]+)/);
        const txId = match ? match[1] : pendingTxId;
        setIsWaitingForPayment(false);

        // Perform authoritative server check before marking transaction paid
        if (txId) {
          setIsLoadingReceipt(true);
          try {
            const receipt = await feesApi.getParentReceipt(txId);
            const isConfirmedSuccess =
              !isCancelled &&
              receipt &&
              receipt.transaction_status === 'success' &&
              receipt.receipt_type !== 'CANCELLED' &&
              receipt.status !== 'CANCELLED';

            if (isConfirmedSuccess) {
              setSelectedReceipt(receipt);
              setIsReceiptOpen(true);
              Alert.alert(
                'Payment Settled & Reconciled',
                `Payment of ₹${receipt.amount || ''} has been verified and committed to the ledger for ${studentName}.`,
                [{ text: 'OK' }],
              );
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
              return;
            }
          } catch (err: any) {
            if (isCancelled) return;
            const statusCode = err?.response?.status;
            if (statusCode === 400) {
              Alert.alert(
                'Payment Pending Reconciliation',
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
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            return;
          } finally {
            if (!isCancelled) setIsLoadingReceipt(false);
          }
        }

        // Fallback when txId is absent
        Alert.alert(
          'Payment Processing',
          'Returned from gateway checkout. Refreshing your student fee balance.',
        );
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else if (url.includes('status=cancelled')) {
        setIsWaitingForPayment(false);
        Alert.alert(
          'Payment Cancelled',
          'The payment checkout was cancelled. You can retry whenever you are ready.',
        );
      }
    };

    const sub = Linking.addEventListener('url', handleUrlEvent);
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && isWaitingForPayment) handleUrlEvent({ url: initialUrl });
    });

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && isWaitingForPayment) {
        // App resumed from browser: refresh fee ledger in background
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    });

    return () => {
      isCancelled = true;
      sub.remove();
      appStateSub.remove();
    };
  }, [isWaitingForPayment, pendingTxId, studentName, onPaymentSuccess]);

  const handleViewReceipt = async (transactionId: string) => {
    if (!transactionId) return;
    setIsLoadingReceipt(true);
    try {
      const res = await feesApi.getParentReceipt(transactionId);
      if (res) {
        setSelectedReceipt(res);
        setIsReceiptOpen(true);
      }
    } catch (err: any) {
      Alert.alert('Receipt Notice', 'Unable to fetch authorized receipt at this moment.');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  return (
    <View
      className={`bg-white dark:bg-slate-900 rounded-3xl p-5 mb-4 border shadow-sm ${
        isSelected
          ? 'border-indigo-600 dark:border-indigo-400 shadow-indigo-600/10'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Active Gateway Checkout Pending Banner */}
      {isWaitingForPayment && (
        <View className="mb-3.5 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <ActivityIndicator size="small" color="#6366f1" className="mr-2.5" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Gateway checkout active
              </Text>
              <Text className="text-[10px] text-indigo-700 dark:text-indigo-400">
                Complete payment in browser, then tap Refresh.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (onPaymentSuccess) onPaymentSuccess();
              Alert.alert('Status Refreshed', 'Checking latest ledger state from server.');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 flex-row items-center"
          >
            <Ionicons name="refresh" size={11} color="#ffffff" />
            <Text className="text-[10px] font-bold text-white ml-1">Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        accessibilityRole="button"
        accessibilityLabel={`Fee ledger for ${studentName}, Status: ${statusBadge.label}`}
      >
        {/* Header: Student Info & Status */}
        <View className="flex-row items-start justify-between mb-3.5">
          <View className="flex-row items-center flex-1 mr-2">
            {/* Avatar Box */}
            <View className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 items-center justify-center mr-3">
              <Text className="text-base font-black text-teal-600 dark:text-teal-400">
                {initials}
              </Text>
            </View>

            {/* Student Info */}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex-1"
                  numberOfLines={1}
                >
                  {studentName}
                </Text>
                <View className="bg-teal-500/10 px-1.5 py-0.5 rounded ml-1.5">
                  <Text className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400">
                    Enrolled
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mt-1">
                <Text className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mr-2">
                  {admissionNo}
                </Text>
                <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  • {gradeSection}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          <View
            className={`px-2.5 py-1 rounded-full border ${statusBadge.bg} ${statusBadge.border}`}
          >
            <Text
              className={`text-[10px] font-extrabold uppercase tracking-wider ${statusBadge.text}`}
            >
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {/* Authoritative Placement Metadata Chips */}
        <View className="flex-row flex-wrap items-center gap-1.5 mb-3.5">
          <View className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl flex-row items-center">
            <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
            <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300 ml-1">
              {academicYear}
            </Text>
          </View>

          <View className="bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl flex-row items-center">
            <Ionicons name="school-outline" size={11} color="#6366f1" />
            <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 ml-1">
              {gradeName}
            </Text>
          </View>

          <View
            className={`px-2.5 py-1 rounded-xl flex-row items-center ${
              child.section_name
                ? 'bg-teal-50 dark:bg-teal-950/50'
                : 'bg-amber-50 dark:bg-amber-950/50'
            }`}
          >
            <Ionicons
              name="people-outline"
              size={11}
              color={child.section_name ? '#0d9488' : '#d97706'}
            />
            <Text
              className={`text-[10px] font-bold ml-1 ${
                child.section_name
                  ? 'text-teal-700 dark:text-teal-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {sectionText}
            </Text>
          </View>

          <View
            className={`px-2.5 py-1 rounded-xl flex-row items-center ${
              rollNumber ? 'bg-purple-50 dark:bg-purple-950/50' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Ionicons
              name="card-outline"
              size={11}
              color={rollNumber ? '#9333ea' : colors.textSecondary}
            />
            <Text
              className={`text-[10px] font-bold ml-1 ${
                rollNumber
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {rollText}
            </Text>
          </View>
        </View>

        {/* Financial Numbers Bar */}
        <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 flex-row items-center justify-between mb-3">
          {/* Outstanding Balance */}
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Outstanding Due
            </Text>
            <Text
              className={`text-base font-black mt-0.5 ${
                summary.outstanding_balance > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ₹{summary.outstanding_balance.toLocaleString()}
            </Text>
          </View>

          {/* Total Paid */}
          <View className="items-center">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Paid
            </Text>
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              ₹{summary.total_paid.toLocaleString()}
            </Text>
          </View>

          {/* Assessed */}
          <View className="items-end">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Assessed Fee
            </Text>
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              ₹{summary.total_assessed.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Next Due or Overdue Alert */}
        {summary.overdue_amount > 0 ? (
          <View className="flex-row items-center justify-between bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl mb-3 border border-red-200 dark:border-red-900/60">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="warning" size={14} color="#ef4444" />
              <Text className="text-[11px] font-bold text-red-700 dark:text-red-300 ml-1.5 flex-1">
                ₹{summary.overdue_amount.toLocaleString()} is overdue for settlement.
              </Text>
            </View>
            {(() => {
              const overdueDue =
                child.dues?.find((d) => d.is_overdue && Number(d.outstanding_amount) > 0) ||
                child.dues?.find((d) => Number(d.outstanding_amount) > 0);
              if (overdueDue) {
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenCheckout(overdueDue)}
                    className="bg-red-600 px-2.5 py-1 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="card-outline" size={11} color="#ffffff" />
                    <Text className="text-white text-[10px] font-bold ml-1">Pay Due</Text>
                  </TouchableOpacity>
                );
              }
              return null;
            })()}
          </View>
        ) : summary.next_due_date ? (
          <View className="flex-row items-center justify-between mb-3 bg-indigo-50/50 dark:bg-indigo-950/30 px-3 py-2 rounded-xl">
            <Text className="text-[11px] text-slate-600 dark:text-slate-300">
              Next Due:{' '}
              <Text className="font-bold text-indigo-600 dark:text-indigo-400">
                ₹{Number(summary.next_due_amount || 0).toLocaleString()}
              </Text>
            </Text>
            <View className="flex-row items-center">
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-2">
                By {new Date(summary.next_due_date).toLocaleDateString()}
              </Text>
              {(() => {
                const upcomingDue = child.dues?.find((d) => Number(d.outstanding_amount) > 0);
                if (upcomingDue) {
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenCheckout(upcomingDue)}
                      className="bg-indigo-600 px-2.5 py-1 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="card-outline" size={11} color="#ffffff" />
                      <Text className="text-white text-[10px] font-bold ml-1">Pay</Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
            </View>
          </View>
        ) : nextDue ? (
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[11px] text-slate-400">
              Next Term:{' '}
              <Text className="font-bold text-slate-700 dark:text-slate-300">
                {nextDue.term_name || nextDue.component_name}
              </Text>
            </Text>
            <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              Due: {new Date(nextDue.due_date).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Footer Info & View Toggle Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleToggleExpand}
        className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between"
      >
        <Text className="text-[10px] text-slate-400 flex-1 mr-2" numberOfLines={1}>
          {child.installment_plan_name || child.fee_structure_name || 'Standard Academic Plan'}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-1">
            {isExpanded ? 'Hide Breakdown' : 'Fee Breakdown'}
          </Text>
          <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6366f1" />
        </View>
      </TouchableOpacity>

      {/* ── EXPANDED BREAKDOWN ACCORDION ───────────────────────────── */}
      {isExpanded && (
        <View className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Section 1: Fee Components Breakdown */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="layers-outline" size={14} color="#6366f1" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100 ml-1.5 uppercase tracking-wider">
                  Fee Components
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400">
                {child.components?.length || 0} Components
              </Text>
            </View>

            {!child.components || child.components.length === 0 ? (
              <View className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl items-center">
                <Text className="text-[11px] text-slate-400 italic">
                  No individual component records found.
                </Text>
              </View>
            ) : (
              <View className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {child.components.map((comp, idx) => (
                  <View
                    key={comp.component_id || idx}
                    className="p-3 bg-slate-50/50 dark:bg-slate-800/30 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {comp.component_name}
                        </Text>
                        <Text className="text-[10px] font-mono text-slate-400 ml-1.5">
                          ({comp.component_code})
                        </Text>
                      </View>
                      {comp.paid_amount !== undefined && (
                        <Text className="text-[10px] text-slate-400 mt-0.5">
                          Paid: ₹{comp.paid_amount.toLocaleString()} • Bal: ₹
                          {Number(comp.outstanding_amount || 0).toLocaleString()}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-black text-slate-900 dark:text-slate-100">
                        ₹{Number(comp.amount).toLocaleString()}
                      </Text>
                      {comp.status && (
                        <View
                          className={`px-1.5 py-0.5 rounded mt-0.5 ${
                            comp.status === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950'
                              : comp.status === 'overdue'
                                ? 'bg-red-100 dark:bg-red-950'
                                : 'bg-amber-100 dark:bg-amber-950'
                          }`}
                        >
                          <Text
                            className={`text-[9px] font-bold uppercase ${
                              comp.status === 'paid'
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : comp.status === 'overdue'
                                  ? 'text-red-700 dark:text-red-300'
                                  : 'text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {comp.status}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section 2: Installment Dues Schedule */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#6366f1" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100 ml-1.5 uppercase tracking-wider">
                  Installment Dues Schedule
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400">
                {child.dues?.length || 0} Scheduled
              </Text>
            </View>

            {!child.dues || child.dues.length === 0 ? (
              <View className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl items-center">
                <Text className="text-[11px] text-slate-400 italic">
                  No installment dues scheduled for this enrollment.
                </Text>
              </View>
            ) : (
              <View className="space-y-2">
                {child.dues.map((due) => (
                  <View
                    key={due.due_id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {due.term_name}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {due.component_name} • Due:{' '}
                          {due.due_date ? new Date(due.due_date).toLocaleDateString() : '-'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs font-black text-slate-900 dark:text-slate-100">
                          ₹{Number(due.amount_due).toLocaleString()}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          {due.outstanding_amount <= 0 ? (
                            <View className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950">
                              <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                Paid
                              </Text>
                            </View>
                          ) : due.is_overdue ? (
                            <View className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950">
                              <Text className="text-[9px] font-bold text-red-700 dark:text-red-300">
                                Overdue
                              </Text>
                            </View>
                          ) : (
                            <View className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950">
                              <Text className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                Pending
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex-row justify-between items-center text-[10px]">
                      <Text className="text-[10px] text-slate-500">
                        Paid: ₹{Number(due.paid_amount || 0).toLocaleString()}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mr-2">
                          Rem: ₹{Number(due.outstanding_amount || 0).toLocaleString()}
                        </Text>
                        {Number(due.outstanding_amount) > 0 && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleOpenCheckout(due)}
                            className="bg-indigo-600 px-2.5 py-1 rounded-lg flex-row items-center"
                          >
                            <Ionicons name="card-outline" size={11} color="#ffffff" />
                            <Text className="text-white text-[10px] font-bold ml-1">
                              Pay ₹{Number(due.outstanding_amount).toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section 3: Verified Payment History */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="receipt-outline" size={14} color="#6366f1" />
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100 ml-1.5 uppercase tracking-wider">
                  Payment History
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400">
                {child.payment_history?.length || 0} Transactions
              </Text>
            </View>

            {!child.payment_history || child.payment_history.length === 0 ? (
              <View className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl items-center">
                <Text className="text-[11px] text-slate-400 italic">
                  No confirmed payments recorded yet.
                </Text>
              </View>
            ) : (
              <View className="space-y-2">
                {child.payment_history.map((tx) => (
                  <View
                    key={tx.transaction_id}
                    className="p-3 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        ₹{Number(tx.amount).toLocaleString()}
                      </Text>
                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Settled'}{' '}
                        via {tx.payment_method?.toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleViewReceipt(tx.transaction_id)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex-row items-center mr-2"
                      >
                        <Ionicons name="document-text-outline" size={11} color="#6366f1" />
                        <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 ml-1">
                          Receipt
                        </Text>
                      </TouchableOpacity>
                      <View className="items-end">
                        <Text className="text-[10px] font-mono text-slate-400">
                          {tx.transaction_reference || 'CONFIRMED'}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <Ionicons name="checkmark-circle" size={11} color="#059669" />
                          <Text className="text-[9px] font-bold text-emerald-600 ml-1">
                            Settled
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── CHECKOUT MODAL ────────────────────────────────────────── */}
      <Modal
        visible={isCheckoutOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCheckoutOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-xl">
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center">
                <Ionicons name="card" size={18} color="#6366f1" />
                <Text className="text-sm font-extrabold text-slate-900 dark:text-slate-100 ml-2">
                  Fee Checkout Review
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCheckoutOpen(false)}
                className="p-1"
                disabled={isProcessingPayment}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDue && (
              <View className="space-y-2.5 mb-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-400">Student:</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {studentName}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-400">Obligation Term:</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedDue.term_name}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-400">Component:</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedDue.component_name}
                  </Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payable Amount:
                  </Text>
                  <Text className="text-sm font-black text-rose-600 dark:text-rose-400">
                    ₹{Number(selectedDue.outstanding_amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleInitiatePayment}
              disabled={isProcessingPayment}
              className={`py-3 rounded-2xl bg-indigo-600 flex-row items-center justify-center shadow-md shadow-indigo-600/20 ${
                isProcessingPayment ? 'opacity-70' : ''
              }`}
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#ffffff" />
                  <Text className="text-white text-xs font-bold ml-2">{paymentStepText}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── OFFICIAL RECEIPT MODAL ─────────────────────────────────── */}
      <Modal
        visible={isReceiptOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReceiptOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm max-h-[85%] border border-slate-200 dark:border-slate-800 shadow-xl">
            <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center">
                <Ionicons name="receipt" size={18} color="#059669" />
                <Text className="text-sm font-extrabold text-slate-900 dark:text-slate-100 ml-2">
                  Official Fee Receipt
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsReceiptOpen(false)} className="p-1">
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedReceipt &&
              (() => {
                const receiptNumber =
                  selectedReceipt.receipt_number ||
                  selectedReceipt.receipt_no ||
                  selectedReceipt.id ||
                  'OFFICIAL RECEIPT';
                const studentFullName =
                  selectedReceipt.student_name ||
                  (selectedReceipt.student
                    ? `${selectedReceipt.student.first_name || ''} ${selectedReceipt.student.last_name || ''}`.trim()
                    : studentName);
                const admissionCode =
                  selectedReceipt.admission_no ||
                  selectedReceipt.student?.admission_no ||
                  admissionNo;
                const transactionRef =
                  selectedReceipt.transaction_reference ||
                  selectedReceipt.transaction?.transaction_reference ||
                  selectedReceipt.order_reference ||
                  'CONFIRMED';
                const totalSettled =
                  selectedReceipt.amount ??
                  selectedReceipt.total_amount ??
                  selectedReceipt.transaction?.amount ??
                  0;
                const allocations = selectedReceipt.allocations || selectedReceipt.line_items || [];
                const receiptDateStr = selectedReceipt.receipt_date
                  ? new Date(selectedReceipt.receipt_date).toLocaleDateString()
                  : new Date().toLocaleDateString();

                return (
                  <ScrollView showsVerticalScrollIndicator={false} className="space-y-3">
                    <View className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900 items-center">
                      <Text className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Receipt Number
                      </Text>
                      <Text className="text-xs font-mono font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                        {receiptNumber}
                      </Text>
                      <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Date: {receiptDateStr}
                      </Text>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-slate-400">Student:</Text>
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {studentFullName}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-slate-400">Admission No:</Text>
                        <Text className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {admissionCode}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-slate-400">Transaction Ref:</Text>
                        <Text className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {transactionRef}
                        </Text>
                      </View>
                    </View>

                    {/* Allocations */}
                    <View className="mt-2">
                      <Text className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                        Allocations
                      </Text>
                      {allocations.map((a: any, idx: number) => (
                        <View
                          key={idx}
                          className="p-2.5 mb-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex-row justify-between items-center"
                        >
                          <View>
                            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {a.term_name || a.obligation_description || 'Term Due'}
                            </Text>
                            <Text className="text-[10px] text-slate-400">
                              {a.component_name || 'Tuition / Obligation'}
                            </Text>
                          </View>
                          <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Number(a.allocated_amount || a.amount || 0).toLocaleString()}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Total */}
                    <View className="bg-emerald-500/10 p-3 rounded-2xl flex-row justify-between items-center mt-2">
                      <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Total Amount Settled
                      </Text>
                      <Text className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        ₹{Number(totalSettled).toLocaleString()}
                      </Text>
                    </View>
                  </ScrollView>
                );
              })()}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsReceiptOpen(false)}
              className="mt-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center"
            >
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
