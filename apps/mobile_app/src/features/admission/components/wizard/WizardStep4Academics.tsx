import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { AcademicsFormData } from '../../schemas/wizard.schemas';
import { GradeClass } from '../../../../types/admission.types';
import { useTheme } from '../../../../theme';

export interface WizardStep4AcademicsProps {
  control: Control<AcademicsFormData>;
  errors: FieldErrors<AcademicsFormData>;
  availableGrades: GradeClass[];
  academicYearLabel?: string;
}

const DEFAULT_GRADES = [
  'Nursery',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

export const WizardStep4Academics: React.FC<WizardStep4AcademicsProps> = ({
  control,
  errors,
  availableGrades = [],
  academicYearLabel = '2026-2027',
}) => {
  const { colors } = useTheme();

  const gradesList =
    availableGrades.length > 0
      ? availableGrades.map((g) => ({ label: g.grade_name, value: g.grade_name, id: g.grade_id }))
      : DEFAULT_GRADES.map((g) => ({ label: g, value: g, id: g }));

  return (
    <View className="space-y-4">
      {/* Section Header */}
      <View className="mb-2">
        <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Academic Information
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Select target enrollment class and provide prior schooling background
        </Text>
      </View>

      {/* Academic Year Banner */}
      <View className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Feather name="calendar" size={16} color="#4f46e5" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-2">
            Target Academic Session
          </Text>
        </View>
        <Text className="text-xs font-black text-indigo-600 dark:text-indigo-400">
          {academicYearLabel}
        </Text>
      </View>

      {/* Grade Applied For */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Grade Applied For *
        </Text>
        <Controller
          control={control}
          name="grade_applied_for"
          render={({ field: { onChange, value } }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
              {gradesList.map((g) => {
                const isSelected = value === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    activeOpacity={0.8}
                    onPress={() => onChange(g.value)}
                    className={`px-4 py-2.5 rounded-2xl mr-2 border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        />
        {errors.grade_applied_for && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.grade_applied_for.message}
          </Text>
        )}
      </View>

      {/* Previous Schooling History (Optional Header) */}
      <View className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Previous School Details (If applicable)
        </Text>

        {/* Previous School Name */}
        <View className="mb-3">
          <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
            Previous School Name
          </Text>
          <Controller
            control={control}
            name="previous_school_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
                <Feather name="book-open" size={18} color={colors.iconSecondary} />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. St. Xavier High School"
                  placeholderTextColor={colors.placeholder}
                  className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                />
              </View>
            )}
          />
        </View>

        {/* Previous Grade */}
        <View className="mb-3">
          <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
            Last Grade / Class Completed
          </Text>
          <Controller
            control={control}
            name="previous_grade"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
                <Feather name="award" size={18} color={colors.iconSecondary} />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Kindergarten / Grade 1"
                  placeholderTextColor={colors.placeholder}
                  className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                />
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
};
