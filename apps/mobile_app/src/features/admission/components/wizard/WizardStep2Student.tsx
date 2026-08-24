import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { StudentDetailsFormData } from '../../schemas/wizard.schemas';
import { useTheme } from '../../../../theme';

export interface WizardStep2StudentProps {
  control: Control<StudentDetailsFormData>;
  errors: FieldErrors<StudentDetailsFormData>;
}

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export const WizardStep2Student: React.FC<WizardStep2StudentProps> = ({ control, errors }) => {
  const { colors } = useTheme();

  return (
    <View className="space-y-4">
      {/* Section Header */}
      <View className="mb-2">
        <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Student Identity
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Enter official student details as they appear on identification documents
        </Text>
      </View>

      {/* First Name */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Student First Name *
        </Text>
        <Controller
          control={control}
          name="student_first_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.student_first_name
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="user" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Leo"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                autoCapitalize="words"
              />
            </View>
          )}
        />
        {errors.student_first_name && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.student_first_name.message}
          </Text>
        )}
      </View>

      {/* Last Name */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Student Last Name *
        </Text>
        <Controller
          control={control}
          name="student_last_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.student_last_name
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="user" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Miller"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                autoCapitalize="words"
              />
            </View>
          )}
        />
        {errors.student_last_name && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.student_last_name.message}
          </Text>
        )}
      </View>

      {/* Date of Birth */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Date of Birth (YYYY-MM-DD) *
        </Text>
        <Controller
          control={control}
          name="date_of_birth"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.date_of_birth
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="calendar" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="2018-05-15"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          )}
        />
        {errors.date_of_birth && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.date_of_birth.message}
          </Text>
        )}
      </View>

      {/* Gender Selection */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Gender *
        </Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row space-x-2">
              {GENDERS.map((g) => {
                const isSelected = value === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    activeOpacity={0.8}
                    onPress={() => onChange(g.value)}
                    className={`flex-1 py-3 rounded-2xl border items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600'
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
            </View>
          )}
        />
        {errors.gender && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.gender.message}
          </Text>
        )}
      </View>

      {/* Nationality */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Nationality *
        </Text>
        <Controller
          control={control}
          name="nationality"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.nationality
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="globe" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Indian"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
              />
            </View>
          )}
        />
        {errors.nationality && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.nationality.message}
          </Text>
        )}
      </View>
    </View>
  );
};
