import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { FullWizardState } from '../../schemas/wizard.schemas';
import { useTheme } from '../../../../theme';

export interface WizardStep7ReviewProps {
  wizardState: FullWizardState;
  onJumpToStep: (step: number) => void;
  declarationAccepted: boolean;
  onToggleDeclaration: (accepted: boolean) => void;
  declarationError?: string;
}

export const WizardStep7Review: React.FC<WizardStep7ReviewProps> = ({
  wizardState,
  onJumpToStep,
  declarationAccepted,
  onToggleDeclaration,
  declarationError,
}) => {
  const { colors } = useTheme();

  const attachedCount = Object.keys(wizardState.documents || {}).length;

  return (
    <View className="space-y-4">
      {/* Section Header */}
      <View className="mb-2">
        <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Review & Declaration
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Please verify all details before final application submission
        </Text>
      </View>

      {/* 1. Student Summary */}
      <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Student Identity
          </Text>
          <TouchableOpacity onPress={() => onJumpToStep(2)}>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
          {wizardState.student.student_first_name} {wizardState.student.student_last_name}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          DOB: {wizardState.student.date_of_birth} | Gender: {wizardState.student.gender} |
          Nationality: {wizardState.student.nationality}
        </Text>
      </View>

      {/* 2. Parent Summary */}
      <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Parent / Guardian
          </Text>
          <TouchableOpacity onPress={() => onJumpToStep(3)}>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
          {wizardState.parent.parent_name} ({wizardState.parent.contact_relationship})
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          Phone: {wizardState.parent.parent_phone} | Email: {wizardState.parent.parent_email}
        </Text>
      </View>

      {/* 3. Academic Summary */}
      <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Academic Information
          </Text>
          <TouchableOpacity onPress={() => onJumpToStep(4)}>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
          Grade Applied: {wizardState.academics.grade_applied_for}
        </Text>
        {wizardState.academics.previous_school_name ? (
          <Text className="text-xs text-slate-500 mt-0.5">
            Previous School: {wizardState.academics.previous_school_name} (
            {wizardState.academics.previous_grade || 'Completed'})
          </Text>
        ) : null}
      </View>

      {/* 4. Documents Summary */}
      <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Uploaded Documents
          </Text>
          <TouchableOpacity onPress={() => onJumpToStep(5)}>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {attachedCount} Document {attachedCount === 1 ? 'file' : 'files'} attached
        </Text>
      </View>

      {/* 5. Fee Summary */}
      <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Application Fee
          </Text>
          <TouchableOpacity onPress={() => onJumpToStep(6)}>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
          Total: ₹750 (Mode: {wizardState.declaration.payment_mode.toUpperCase()})
        </Text>
      </View>

      {/* Declaration Checkbox */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onToggleDeclaration(!declarationAccepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: declarationAccepted }}
        className={`p-4 rounded-3xl border flex-row items-start ${
          declarationAccepted
            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-600'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <View
          className={`w-6 h-6 rounded-lg items-center justify-center mr-3 mt-0.5 ${
            declarationAccepted
              ? 'bg-indigo-600'
              : 'border border-slate-300 dark:border-slate-700 bg-transparent'
          }`}
        >
          {declarationAccepted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
        </View>
        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1 leading-relaxed">
          I hereby declare that all information supplied in this application is accurate and
          verifiable. I understand that any misstatement may lead to cancellation of admission.
        </Text>
      </TouchableOpacity>

      {declarationError && (
        <Text className="text-xs font-bold text-red-500 ml-1">{declarationError}</Text>
      )}
    </View>
  );
};
