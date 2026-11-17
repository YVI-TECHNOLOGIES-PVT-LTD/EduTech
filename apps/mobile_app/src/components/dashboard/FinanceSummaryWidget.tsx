import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useFinanceStore } from '../../stores/finance.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { GradientSurface } from '../ui/atoms/GradientSurface';

export interface FinanceSummaryWidgetProps {
  hasPendingFees?: boolean;
  amount?: number;
  totalAssessed?: number;
  totalPaid?: number;
  dueDate?: string;
  onPayPress?: () => void;
}

export const FinanceSummaryWidget: React.FC<FinanceSummaryWidgetProps> = React.memo(
  ({
    hasPendingFees: propHasPending,
    amount: propAmount,
    totalAssessed: propAssessed,
    totalPaid: propPaid,
    dueDate: propDueDate,
    onPayPress,
  }) => {
    const router = useRouter();
    const ledger = useFinanceStore((s) => s.ledger);

    const summary = ledger?.summary;
    const outstandingAmount =
      propAmount !== undefined
        ? propAmount
        : summary?.outstanding_balance !== undefined
          ? summary.outstanding_balance
          : 0;

    const hasPending = propHasPending !== undefined ? propHasPending : outstandingAmount > 0;

    const firstDueItem = ledger?.dues?.find((d) => d.outstanding_amount > 0);
    const resolvedDueDate =
      propDueDate ||
      (firstDueItem?.due_date
        ? new Date(firstDueItem.due_date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Immediate');

    const feeTermLabel = ledger?.academic_year_name
      ? `Fee Status • ${ledger.academic_year_name}`
      : 'Fee Status • Academic Session';

    const handlePayNow = () => {
      if (onPayPress) {
        onPayPress();
      } else {
        router.push(ROUTES.MAIN.FINANCE as any);
      }
    };

    const handleHistory = () => {
      router.push(ROUTES.MAIN.FINANCE as any);
    };

    // If fully cleared:
    if (!hasPending || outstandingAmount <= 0) {
      return (
        <View style={styles.cardContainer}>
          <GradientSurface
            colors={DESIGN_TOKENS.colors.gradients.navyHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={20}
            style={styles.gradientCard}
          >
            <View style={styles.topRow}>
              <View style={styles.categoryRow}>
                <Ionicons name="shield-checkmark" size={18} color={DESIGN_TOKENS.colors.emerald} />
                <Text style={styles.categoryText}>{feeTermLabel}</Text>
              </View>
              <View style={styles.clearedBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.clearedBadgeText}>Fee Cleared</Text>
              </View>
            </View>

            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Total Outstanding Amount</Text>
                <View style={styles.amountValueRow}>
                  <Text style={styles.amountText}>₹0</Text>
                  <Text style={styles.currencyTag}>.00 INR</Text>
                </View>
              </View>
              <View style={styles.dueColumn}>
                <Text style={styles.dueLabel}>Status</Text>
                <Text style={styles.dueValueGreen}>All Cleared ✓</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={handleHistory}
                activeOpacity={0.8}
                style={styles.historyLink}
              >
                <Ionicons name="receipt-outline" size={16} color="#C7D2FE" />
                <Text style={styles.historyLinkText}>Payment History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleHistory}
                activeOpacity={0.85}
                style={styles.receiptButton}
              >
                <Text style={styles.receiptButtonText}>Download Receipt</Text>
                <Ionicons name="receipt" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </GradientSurface>
        </View>
      );
    }

    // Standard Outstanding Due State:
    return (
      <View style={styles.cardContainer}>
        <GradientSurface
          colors={DESIGN_TOKENS.colors.gradients.navyHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          borderRadius={20}
          style={styles.gradientCard}
        >
          {/* Subtle Decorative Glow Circle */}
          <View style={styles.decorGlow} />

          {/* Top Header */}
          <View style={styles.topRow}>
            <View style={styles.categoryRow}>
              <Ionicons name="card" size={18} color={DESIGN_TOKENS.colors.amber} />
              <Text style={styles.categoryText}>{feeTermLabel}</Text>
            </View>
            <View style={styles.dueBadge}>
              <View style={styles.amberDot} />
              <Text style={styles.dueBadgeText}>Payment Due</Text>
            </View>
          </View>

          {/* Amount & Due Date */}
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Total Outstanding Amount</Text>
              <View style={styles.amountValueRow}>
                <Text style={styles.amountText}>₹{outstandingAmount.toLocaleString()}</Text>
                <Text style={styles.currencyTag}>.00 INR</Text>
              </View>
            </View>
            <View style={styles.dueColumn}>
              <Text style={styles.dueLabel}>Next Due Date</Text>
              <Text style={styles.dueValueRose}>{resolvedDueDate}</Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={handleHistory}
              activeOpacity={0.8}
              style={styles.historyLink}
            >
              <Ionicons name="receipt-outline" size={16} color="#C7D2FE" />
              <Text style={styles.historyLinkText}>Payment History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePayNow}
              activeOpacity={0.88}
              style={styles.payNowButton}
              accessibilityRole="button"
              accessibilityLabel={`Pay ₹${outstandingAmount.toLocaleString()} Now`}
            >
              <Text style={styles.payNowText}>Pay ₹{outstandingAmount.toLocaleString()} Now</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </GradientSurface>
      </View>
    );
  },
);

FinanceSummaryWidget.displayName = 'FinanceSummaryWidget';

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    ...DESIGN_TOKENS.shadows.card,
  },
  gradientCard: {
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorGlow: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(67, 56, 202, 0.35)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C7D2FE',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  clearedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: 'rgba(5, 150, 105, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN_TOKENS.colors.amber,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN_TOKENS.colors.emerald,
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
  },
  clearedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  currencyTag: {
    fontSize: 12,
    color: '#C7D2FE',
    fontWeight: '600',
  },
  dueColumn: {
    alignItems: 'flex-end',
  },
  dueLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  dueValueRose: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDA4AF',
  },
  dueValueGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#86EFAC',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyLinkText: {
    fontSize: 12,
    color: '#E0E7FF',
    fontWeight: '600',
  },
  payNowButton: {
    backgroundColor: DESIGN_TOKENS.colors.emerald,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  payNowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  receiptButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
