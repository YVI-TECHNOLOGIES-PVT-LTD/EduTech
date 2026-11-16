import React from 'react';
import { View, Text } from 'react-native';

export interface WizardProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_TITLES = [
  'Guidelines',
  'Student Details',
  'Parent Details',
  'Academics',
  'Documents',
  'Fee Statement',
  'Review & Submit',
  'Confirmation',
];

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  totalSteps = 8,
}) => {
  const progressPercent = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
  const currentTitle = STEP_TITLES[currentStep - 1] || `Step ${currentStep}`;

  return (
    <View className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800">
      {/* Step Info */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Step {currentStep} of {totalSteps}
        </Text>
        <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentTitle}</Text>
      </View>

      {/* Progress Track */}
      <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <View
          style={{ width: `${progressPercent}%` }}
          className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
        />
      </View>
    </View>
  );
};
