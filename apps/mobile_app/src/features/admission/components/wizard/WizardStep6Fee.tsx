import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../theme';

export interface WizardStep6FeeProps {
  paymentMode: string;
  onSelectPaymentMode: (mode: 'upi' | 'card' | 'netbanking') => void;
  applicationFee?: number;
  processingFee?: number;
}

export const WizardStep6Fee: React.FC<WizardStep6FeeProps> = ({
  paymentMode = 'upi',
  onSelectPaymentMode,
  applicationFee = 500,
  processingFee = 250,
}) => {
  const { colors } = useTheme();
  const total = applicationFee + processingFee;

  return (
    <View className="space-y-4">
      {/* Section Header */}
      <View className="mb-2">
        <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Fee Statement
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Review initial admission application and processing fee breakdown
        </Text>
      </View>

      {/* Fee Statement Card */}
      <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Summary Breakdown
        </Text>

        <View className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Application Registration Fee
          </Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            ₹{applicationFee.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Document Processing Charge
          </Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            ₹{processingFee.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between pt-3">
          <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
            Total Application Amount
          </Text>
          <Text className="text-base font-black text-indigo-600 dark:text-indigo-400">
            ₹{total.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Payment Method Selector */}
      <View className="mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
          Preferred Settlement Mode
        </Text>

        <View className="flex-row space-x-2">
          {(['upi', 'card', 'netbanking'] as const).map((mode) => {
            const isSelected = paymentMode === mode;
            const label = mode === 'upi' ? 'UPI' : mode === 'card' ? 'Debit/Credit' : 'Net Banking';
            const iconName = mode === 'upi' ? 'qr-code' : mode === 'card' ? 'card' : 'globe';

            return (
              <TouchableOpacity
                key={mode}
                activeOpacity={0.8}
                onPress={() => onSelectPaymentMode(mode)}
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

      {/* Note Notice */}
      <View className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex-row items-center">
        <Ionicons name="shield-checkmark" size={18} color="#4f46e5" />
        <Text className="text-xs text-indigo-900 dark:text-indigo-200 ml-2.5 flex-1 leading-relaxed">
          Application payment receipt will be generated and issued immediately upon submission.
        </Text>
      </View>
    </View>
  );
};
