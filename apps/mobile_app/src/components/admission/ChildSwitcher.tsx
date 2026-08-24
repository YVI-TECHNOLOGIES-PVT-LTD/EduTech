import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AdmissionApplication } from '../../types/admission.types';

export interface ChildSwitcherProps {
  applications: AdmissionApplication[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const ChildSwitcher: React.FC<ChildSwitcherProps> = ({
  applications,
  selectedId,
  onSelect,
}) => {
  if (!applications || applications.length <= 1) {
    return null;
  }

  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Select Child / Application ({applications.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
        className="flex-row"
      >
        {applications.map((app: AdmissionApplication) => {
          const id = app.application_id || (app as any).id;
          const isSelected = id === selectedId;

          const studentName =
            app.student_name ||
            (app.student_first_name
              ? `${app.student_first_name} ${app.student_last_name || ''}`.trim()
              : app.leads
                ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                : app.lead
                  ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                  : 'Child') ||
            'Child';

          const firstName = studentName.split(' ')[0] || studentName;
          const initial = firstName.charAt(0).toUpperCase() || 'C';

          return (
            <TouchableOpacity
              key={id}
              activeOpacity={0.8}
              onPress={() => onSelect(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Select application for ${studentName}`}
              className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-2.5 border shadow-sm ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <View
                className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${
                  isSelected ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-950/60'
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {initial}
                </Text>
              </View>
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {firstName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
