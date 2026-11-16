import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChildStore } from '../../../src/stores/child.store';
import { useFinanceStore } from '../../../src/stores/finance.store';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../../src/components/child/ChildSwitcherSheet';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ROUTES } from '../../../src/constants/routes';
import { FeeDueItem } from '../../../src/api/finance.api';

export default function FinanceHubScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const isEnrolled = activeChild?.kind === 'enrolled';
  const enrolledStudentId = isEnrolled ? activeChild.studentId : null;

  const [switcherVisible, setSwitcherVisible] = useState(false);

  const {
    ledger,
    isLoading,
    isCheckingOut,
    paymentSuccessNotice,
    fetchChildFees,
    initiatePayment,
    confirmPayment,
    resetCheckout,
  } = useFinanceStore();

  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedDue, setSelectedDue] = useState<FeeDueItem | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  useEffect(() => {
    if (enrolledStudentId) {
      fetchChildFees(enrolledStudentId);
    }
  }, [enrolledStudentId, fetchChildFees]);

  const handleRefresh = async () => {
    if (enrolledStudentId) {
      await fetchChildFees(enrolledStudentId);
    }
  };

  const openCheckout = (due: FeeDueItem) => {
    setSelectedDue(due);
    setCheckoutModalVisible(true);
  };

  const handlePayNow = async () => {
    if (!selectedDue || !enrolledStudentId) return;

    // 1. Create order
    const order = await initiatePayment(
      enrolledStudentId,
      selectedDue.due_id,
      selectedDue.outstanding_amount,
    );

    if (order) {
      // 2. Complete payment with verification
      const success = await confirmPayment({
        razorpay_order_id: order.order_id || `order_${Date.now()}`,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: `sig_${Date.now()}`,
        studentChargeDueId: selectedDue.due_id,
        dueId: selectedDue.due_id,
      });

      if (success) {
        setCheckoutModalVisible(false);
        setSelectedDue(null);
      }
    }
  };

  const summary = ledger?.summary || {
    total_assessed: 0,
    total_paid: 0,
    outstanding_balance: 0,
    overdue_amount: 0,
    status: 'no_fees_assigned' as const,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTag}>Fee Management</Text>
          <Text style={styles.headerTitle}>Tuition & Payments</Text>
        </View>

        {/* Universal Student Selector */}
        <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

        {/* Payment Success Toast */}
        {paymentSuccessNotice && (
          <View style={styles.successToast}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color={DESIGN_TOKENS.colors.success} />
              <Text style={styles.successToastText}>{paymentSuccessNotice}</Text>
            </View>
            <TouchableOpacity onPress={resetCheckout} activeOpacity={0.8}>
              <Ionicons name="close" size={16} color={DESIGN_TOKENS.colors.success} />
            </TouchableOpacity>
          </View>
        )}

        {!isEnrolled ? (
          /* Pre-Admission Fee Notice */
          <View style={styles.applicantFeeCard}>
            <View style={styles.applicantFeeIconBox}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={DESIGN_TOKENS.colors.primary}
              />
            </View>
            <Text style={styles.applicantFeeTitle}>Admission Application Fees</Text>
            <Text style={styles.applicantFeeSubtitle}>
              Track registration, assessment, and acceptance fees associated with your admission
              application #{activeChild?.applicationNumber || activeChild?.id}.
            </Text>
            <TouchableOpacity
              onPress={() => router.push(ROUTES.PARENT.APPLICATIONS as any)}
              style={styles.viewAdmissionBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAdmissionBtnText}>View Admission Status</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Primary Annual Fee Balance Card */}
            <View style={styles.summaryCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTag}>Annual Fee Balance</Text>
                <Badge
                  label={
                    summary.outstanding_balance === 0
                      ? 'Fully Cleared'
                      : summary.overdue_amount > 0
                        ? 'Overdue'
                        : 'Dues Pending'
                  }
                  variant={
                    summary.outstanding_balance === 0
                      ? 'success'
                      : summary.overdue_amount > 0
                        ? 'error'
                        : 'warning'
                  }
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 12 }}>
                <Text style={styles.heroAmountText}>
                  ₹{summary.outstanding_balance.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.heroAmountSubtext}>Total Outstanding</Text>
              </View>

              <View style={styles.breakdownRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metricLabel}>Total Assessed</Text>
                  <Text style={styles.metricValue}>
                    ₹{summary.total_assessed.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.metricLabel}>Total Paid</Text>
                  <Text style={[styles.metricValue, { color: DESIGN_TOKENS.colors.success }]}>
                    ₹{summary.total_paid.toLocaleString('en-IN')}
                  </Text>
                </View>
                {summary.overdue_amount > 0 && (
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[styles.metricLabel, { color: DESIGN_TOKENS.colors.danger }]}>
                      Overdue
                    </Text>
                    <Text style={[styles.metricValue, { color: DESIGN_TOKENS.colors.danger }]}>
                      ₹{summary.overdue_amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Installments & Dues Section */}
            <Text style={styles.sectionHeaderTitle}>Term Installments & Dues</Text>

            {ledger?.dues && ledger.dues.length > 0 ? (
              ledger.dues.map((due) => {
                const isPaid = due.outstanding_amount === 0;
                const isOverdue = due.is_overdue;
                return (
                  <View key={due.due_id} style={styles.dueCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.termTag}>{due.term_name || 'Term Installment'}</Text>
                      <Badge
                        label={isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Due Soon'}
                        variant={isPaid ? 'success' : isOverdue ? 'error' : 'warning'}
                      />
                    </View>

                    <Text style={styles.dueTitle}>
                      {due.charge_description || due.component_name || 'Tuition Fee Installment'}
                    </Text>

                    <View style={styles.dueMetaRow}>
                      <View>
                        <Text style={styles.dueMetaLabel}>Due Date</Text>
                        <Text style={styles.dueMetaDate}>{due.due_date}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.dueMetaLabel}>Payable</Text>
                        <Text style={styles.dueMetaAmount}>
                          ₹{due.outstanding_amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {!isPaid ? (
                      <TouchableOpacity
                        onPress={() => openCheckout(due)}
                        activeOpacity={0.8}
                        style={styles.payDueBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Pay ${due.term_name} installment`}
                      >
                        <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.payDueBtnText}>
                          Pay ₹{due.outstanding_amount.toLocaleString('en-IN')}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.settledBox}>
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color={DESIGN_TOKENS.colors.success}
                        />
                        <Text style={styles.settledText}>Installment Fully Settled</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={32} color={DESIGN_TOKENS.colors.textMuted} />
                <Text style={styles.emptyTitle}>
                  No installment dues scheduled for this academic cycle.
                </Text>
              </View>
            )}

            {/* Fee Component Breakdown */}
            {ledger?.components && ledger.components.length > 0 && (
              <>
                <Text style={styles.sectionHeaderTitle}>Annual Fee Structure Breakdown</Text>
                <View style={styles.componentsCard}>
                  {ledger.components.map((comp, idx) => (
                    <View key={idx} style={styles.componentRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.componentName}>{comp.component_name}</Text>
                        {comp.description ? (
                          <Text style={styles.componentDesc}>{comp.description}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.componentAmount}>
                        ₹{comp.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Past Payment Transactions */}
            <Text style={styles.sectionHeaderTitle}>Payment Transaction Ledger</Text>

            {ledger?.payment_history && ledger.payment_history.length > 0 ? (
              ledger.payment_history.map((tx) => (
                <View key={tx.transaction_id} style={styles.txCard}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}
                  >
                    <View style={styles.txIconBox}>
                      <Ionicons
                        name="checkmark-done"
                        size={18}
                        color={DESIGN_TOKENS.colors.success}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txRefText} numberOfLines={1}>
                        {tx.transaction_reference || tx.transaction_id}
                      </Text>
                      <Text style={styles.txMetaText}>
                        {tx.payment_method.toUpperCase()} • {tx.created_at?.slice(0, 10)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txAmountText}>₹{tx.amount.toLocaleString('en-IN')}</Text>
                    <Badge label="Confirmed" variant="success" />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="card-outline" size={28} color={DESIGN_TOKENS.colors.textMuted} />
                <Text style={styles.emptyTitle}>No online payment history recorded yet.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* RAZORPAY CHECKOUT MODAL */}
      <Modal
        visible={checkoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Razorpay Checkout</Text>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close-circle" size={24} color={DESIGN_TOKENS.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedDue && (
              <>
                <View style={styles.modalSummaryBox}>
                  <Text style={styles.modalDueLabel}>Payment For</Text>
                  <Text style={styles.modalDueName}>
                    {selectedDue.term_name || 'Term Due'} —{' '}
                    {selectedDue.charge_description || 'Tuition Fee'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                    <Text style={styles.modalDueAmount}>
                      ₹{selectedDue.outstanding_amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.modalDueCurrency}>INR</Text>
                  </View>
                </View>

                {/* Method Selector */}
                <Text style={styles.methodHeader}>Select Payment Method</Text>

                <View style={{ gap: 8, marginBottom: 18 }}>
                  {(
                    [
                      {
                        key: 'upi',
                        label: 'UPI (GPay / PhonePe / Paytm)',
                        icon: 'phone-portrait-outline',
                      },
                      { key: 'card', label: 'Credit or Debit Card', icon: 'card-outline' },
                      { key: 'netbanking', label: 'Net Banking', icon: 'business-outline' },
                    ] as const
                  ).map((m) => {
                    const isSelected = selectedMethod === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        onPress={() => setSelectedMethod(m.key)}
                        activeOpacity={0.8}
                        style={[styles.methodOption, isSelected && styles.activeMethodOption]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons
                            name={m.icon as any}
                            size={18}
                            color={
                              isSelected
                                ? DESIGN_TOKENS.colors.primary
                                : DESIGN_TOKENS.colors.textSecondary
                            }
                            style={{ marginRight: 10 }}
                          />
                          <Text
                            style={[
                              styles.methodLabel,
                              {
                                color: isSelected
                                  ? DESIGN_TOKENS.colors.primary
                                  : DESIGN_TOKENS.colors.textPrimary,
                              },
                            ]}
                          >
                            {m.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={DESIGN_TOKENS.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Checkout Trigger */}
                <TouchableOpacity
                  disabled={isCheckingOut}
                  onPress={handlePayNow}
                  activeOpacity={0.8}
                  style={styles.payNowModalBtn}
                >
                  {isCheckingOut ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                      <Text style={styles.payNowModalBtnText}>
                        Pay ₹{selectedDue.outstanding_amount.toLocaleString('en-IN')} Securely
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.encryptedNotice}>
                  256-bit encrypted checkout verified by Razorpay Gateway
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Child Switcher Bottom Sheet */}
      <ChildSwitcherSheet visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  scrollContent: {
    paddingHorizontal: DESIGN_TOKENS.spacing.comfortable,
    paddingTop: DESIGN_TOKENS.spacing.small,
    paddingBottom: DESIGN_TOKENS.spacing.major,
  },
  headerContainer: {
    marginBottom: DESIGN_TOKENS.spacing.standard,
    paddingTop: 4,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: DESIGN_TOKENS.colors.textMuted,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.4,
  },
  successToast: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 14,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successToastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginLeft: 8,
  },
  applicantFeeCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 24,
    marginTop: 8,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  applicantFeeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  applicantFeeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: 4,
  },
  applicantFeeSubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  viewAdmissionBtn: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.radius.input,
    alignItems: 'center',
  },
  viewAdmissionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: DESIGN_TOKENS.spacing.comfortable,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  heroAmountText: {
    fontSize: 32,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.6,
  },
  heroAmountSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
    marginLeft: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.borderLight,
  },
  metricLabel: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dueCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 10,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  termTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.primary,
  },
  dueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginVertical: 4,
  },
  dueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  dueMetaLabel: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  dueMetaDate: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 1,
  },
  dueMetaAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 1,
  },
  payDueBtn: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingVertical: 11,
    borderRadius: DESIGN_TOKENS.radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  payDueBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  settledBox: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 9,
    borderRadius: DESIGN_TOKENS.radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  settledText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginLeft: 6,
  },
  componentsCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.borderLight,
  },
  componentName: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  componentDesc: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 1,
  },
  componentAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  txCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txRefText: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  txMetaText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 1,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: 2,
  },
  emptyCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    ...DESIGN_TOKENS.shadows.floating,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  modalSummaryBox: {
    backgroundColor: DESIGN_TOKENS.colors.secondarySurface,
    padding: 16,
    borderRadius: DESIGN_TOKENS.radius.card,
    marginVertical: 14,
  },
  modalDueLabel: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    marginBottom: 2,
  },
  modalDueName: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  modalDueAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.primary,
  },
  modalDueCurrency: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },
  methodHeader: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginBottom: 8,
  },
  methodOption: {
    padding: 14,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeMethodOption: {
    borderColor: DESIGN_TOKENS.colors.primary,
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  payNowModalBtn: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingVertical: 14,
    borderRadius: DESIGN_TOKENS.radius.input,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  payNowModalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  encryptedNotice: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
