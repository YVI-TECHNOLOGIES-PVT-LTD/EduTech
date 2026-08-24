import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Button } from '../../../../components/ui/atoms/Button';

export interface WizardStep8ConfirmationProps {
  applicationNumber: string;
  studentName: string;
  gradeApplied: string;
  onGoToDashboard: () => void;
  onGoToApplications: () => void;
}

export const WizardStep8Confirmation: React.FC<WizardStep8ConfirmationProps> = ({
  applicationNumber,
  studentName,
  gradeApplied,
  onGoToDashboard,
  onGoToApplications,
}) => {
  return (
    <View className="items-center text-center space-y-5">
      {/* Success Icon */}
      <View className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 mb-2">
        <Ionicons name="checkmark-sharp" size={40} color="#10b981" />
      </View>

      <Text className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">
        Application Submitted!
      </Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-xs">
        Your admission application has been registered with the school admissions office.
      </Text>

      {/* Application Reference Card */}
      <View className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <View className="items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Application Reference Number
          </Text>
          <Text className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {applicationNumber}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-500 font-medium">Applicant</Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {studentName}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-500 font-medium">Grade Applied</Text>
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {gradeApplied}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-500 font-medium">Status</Text>
          <View className="bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            <Text className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-300">
              Submitted
            </Text>
          </View>
        </View>
      </View>

      {/* Next Steps Roadmap */}
      <View className="w-full bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-900 space-y-2">
        <Text className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 mb-1">
          Next Milestones
        </Text>
        <View className="flex-row items-center">
          <Feather name="check" size={14} color="#10b981" />
          <Text className="text-xs text-slate-600 dark:text-slate-300 ml-2">
            1. Document verification by school admission team
          </Text>
        </View>
        <View className="flex-row items-center">
          <Feather name="clock" size={14} color="#6366f1" />
          <Text className="text-xs text-slate-600 dark:text-slate-300 ml-2">
            2. Entrance interaction / academic assessment
          </Text>
        </View>
        <View className="flex-row items-center">
          <Feather name="award" size={14} color="#6366f1" />
          <Text className="text-xs text-slate-600 dark:text-slate-300 ml-2">
            3. Decision release and admission offer letter
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="w-full space-y-2.5 pt-2">
        <Button
          title="Go to Parent Dashboard"
          variant="primary"
          size="lg"
          onPress={onGoToDashboard}
        />
        <Button
          title="View My Applications"
          variant="outline"
          size="md"
          onPress={onGoToApplications}
        />
      </View>
    </View>
  );
};
