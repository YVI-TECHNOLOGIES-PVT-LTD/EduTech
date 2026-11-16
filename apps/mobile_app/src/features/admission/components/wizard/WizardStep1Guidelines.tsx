import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../theme';

export interface WizardStep1GuidelinesProps {
  accepted: boolean;
  onToggleAccept: (accepted: boolean) => void;
}

export const WizardStep1Guidelines: React.FC<WizardStep1GuidelinesProps> = ({
  accepted,
  onToggleAccept,
}) => {
  const { colors } = useTheme();

  return (
    <View className="space-y-5">
      {/* Introduction Card */}
      <View className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-2.5">
            <Ionicons name="information" size={18} color="#ffffff" />
          </View>
          <Text className="text-base font-black text-slate-900 dark:text-slate-100">
            Admission Instructions
          </Text>
        </View>
        <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Please review the admission policies and requirements before filling out the form. You can
          save your progress as a draft and resume anytime.
        </Text>
      </View>

      {/* Guidelines List */}
      <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <View className="flex-row items-start">
          <Ionicons name="checkmark-circle" size={18} color="#4f46e5" className="mt-0.5 mr-2.5" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Accurate Personal Information
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Ensure student details match official government documents (e.g. Birth Certificate).
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <Ionicons name="checkmark-circle" size={18} color="#4f46e5" className="mt-0.5 mr-2.5" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Mandatory Document Uploads
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Prepare scanned PDFs or clear photos of Birth Certificate, Report Cards, and Photos
              (under 10MB).
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <Ionicons name="checkmark-circle" size={18} color="#4f46e5" className="mt-0.5 mr-2.5" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Processing & Verification
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Upon submission, the admission desk will review your credentials and schedule entrance
              evaluation if applicable.
            </Text>
          </View>
        </View>
      </View>

      {/* Acceptance Checkbox */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onToggleAccept(!accepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        className={`p-4 rounded-2xl border flex-row items-center ${
          accepted
            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-600'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <View
          className={`w-6 h-6 rounded-lg items-center justify-center mr-3 ${
            accepted
              ? 'bg-indigo-600'
              : 'border border-slate-300 dark:border-slate-700 bg-transparent'
          }`}
        >
          {accepted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
        </View>
        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1 leading-relaxed">
          I have read, understood, and accept the admission guidelines and instructions.
        </Text>
      </TouchableOpacity>
    </View>
  );
};
