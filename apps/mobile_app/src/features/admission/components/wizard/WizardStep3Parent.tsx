import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { ParentDetailsFormData } from '../../schemas/wizard.schemas';
import { useTheme } from '../../../../theme';

export interface WizardStep3ParentProps {
  control: Control<ParentDetailsFormData>;
  errors: FieldErrors<ParentDetailsFormData>;
}

const RELATIONSHIPS = [
  { label: 'Father', value: 'father' },
  { label: 'Mother', value: 'mother' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'Other', value: 'other' },
];

export const WizardStep3Parent: React.FC<WizardStep3ParentProps> = ({ control, errors }) => {
  const { colors } = useTheme();

  return (
    <View className="space-y-4">
      {/* Section Header */}
      <View className="mb-2">
        <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Parent & Guardian Details
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Enter primary contact information for admission communications
        </Text>
      </View>

      {/* Parent Full Name */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Parent / Guardian Full Name *
        </Text>
        <Controller
          control={control}
          name="parent_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.parent_name
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="user" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Sarah Jenkins"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                autoCapitalize="words"
              />
            </View>
          )}
        />
        {errors.parent_name && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.parent_name.message}
          </Text>
        )}
      </View>

      {/* Relationship Selector */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Relationship to Student *
        </Text>
        <Controller
          control={control}
          name="contact_relationship"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row space-x-2">
              {RELATIONSHIPS.map((rel) => {
                const isSelected = value === rel.value;
                return (
                  <TouchableOpacity
                    key={rel.value}
                    activeOpacity={0.8}
                    onPress={() => onChange(rel.value)}
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
                      {rel.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
        {errors.contact_relationship && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.contact_relationship.message}
          </Text>
        )}
      </View>

      {/* Phone Number */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Primary Mobile Phone *
        </Text>
        <Controller
          control={control}
          name="parent_phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.parent_phone
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="phone" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="9876543210"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                keyboardType="phone-pad"
              />
            </View>
          )}
        />
        {errors.parent_phone && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.parent_phone.message}
          </Text>
        )}
      </View>

      {/* Email Address */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Primary Email Address *
        </Text>
        <Controller
          control={control}
          name="parent_email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm ${
                errors.parent_email
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Feather name="mail" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="parent@example.com"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}
        />
        {errors.parent_email && (
          <Text className="text-xs font-semibold text-red-500 mt-1 ml-1">
            {errors.parent_email.message}
          </Text>
        )}
      </View>

      {/* Parent Occupation */}
      <View className="mb-3">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          Occupation (Optional)
        </Text>
        <Controller
          control={control}
          name="parent_occupation"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
              <Feather name="briefcase" size={18} color={colors.iconSecondary} />
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Software Engineer"
                placeholderTextColor={colors.placeholder}
                className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100 ml-3"
              />
            </View>
          )}
        />
      </View>
    </View>
  );
};
