import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useFinanceStore } from '../../stores/finance.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface FinanceSummaryWidgetProps {
  hasPendingFees?: boolean;
  amount?: number;
  totalAssessed?: number;
  totalPaid?: number;
  dueDate?: string;
}

export const FinanceSummaryWidget: React.FC<FinanceSummaryWidgetProps> = ({
  hasPendingFees: propHasPending,
  amount: propAmount,
  totalAssessed: propAssessed,
  totalPaid: propPaid,
  dueDate,
}) => {
  const router = useRouter();
  const ledger = useFinanceStore((s) => s.ledger);

  const summary = ledger?.summary;
  const outstandingAmount =
    propAmount !== undefined ? propAmount : summary?.outstanding_balance || 0;

  const totalAssessed = propAssessed !== undefined ? propAssessed : summary?.total_assessed || 0;

  const totalPaid = propPaid !== undefined ? propPaid : summary?.total_paid || 0;

  const hasPending = propHasPending !== undefined ? propHasPending : outstandingAmount > 0;

  const handlePayNow = () => {
    router.push(ROUTES.MAIN.FINANCE as any);
  };

  if (!hasPending || outstandingAmount <= 0) {
    return (
      <View
        style={{
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
          borderWidth: 1,
          borderRadius: DESIGN_TOKENS.radius.card,
          padding: DESIGN_TOKENS.spacing.standard,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: DESIGN_TOKENS.spacing.standard,
          ...DESIGN_TOKENS.shadows.subtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="checkmark-done" size={22} color={DESIGN_TOKENS.colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#166534',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Fee Status • All Dues Settled
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: DESIGN_TOKENS.colors.textSecondary,
                marginTop: 2,
              }}
            >
              No outstanding term fees recorded for the active session.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push(ROUTES.MAIN.FINANCE as any)}
          style={{
            backgroundColor: DESIGN_TOKENS.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: DESIGN_TOKENS.colors.border,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{ fontSize: 11, fontWeight: '700', color: DESIGN_TOKENS.colors.textPrimary }}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#1E1B4B',
        borderColor: '#312E81',
        borderWidth: 1,
        borderRadius: DESIGN_TOKENS.radius.card,
        padding: DESIGN_TOKENS.spacing.standard,
        marginBottom: DESIGN_TOKENS.spacing.standard,
        ...DESIGN_TOKENS.shadows.card,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            color: '#A5B4FC',
          }}
        >
          Fee Reminder • Outstanding Dues
        </Text>
        {dueDate ? (
          <View
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.4)',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FCD34D' }}>Due {dueDate}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
          ₹ {outstandingAmount.toLocaleString()}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.75)',
            marginTop: 2,
          }}
        >
          Total Outstanding Balance
        </Text>
      </View>

      {/* Metrics Row: Assessed vs Paid */}
      {totalAssessed > 0 && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
              }}
            >
              Assessed
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', marginTop: 1 }}>
              ₹ {totalAssessed.toLocaleString()}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
              }}
            >
              Paid to Date
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#4ADE80', marginTop: 1 }}>
              ₹ {totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
              }}
            >
              Status
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#FCD34D', marginTop: 1 }}>
              Pending
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePayNow}
        style={{
          backgroundColor: DESIGN_TOKENS.colors.primary,
          paddingVertical: 12,
          borderRadius: DESIGN_TOKENS.radius.input,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="View and pay fees"
      >
        <Ionicons name="card-outline" size={17} color="#FFFFFF" />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '800',
            marginLeft: 8,
            letterSpacing: 0.3,
          }}
        >
          View & Pay Fees
        </Text>
      </TouchableOpacity>
    </View>
  );
};
