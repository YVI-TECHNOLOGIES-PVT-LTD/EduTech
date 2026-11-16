import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChildStore } from '../../stores/child.store';
import { BottomSheet } from '../ui/organisms/BottomSheet';
import { Avatar } from '../ui/atoms/Avatar';
import { Badge } from '../ui/atoms/Badge';
import { UnifiedChild } from '../../types/child.types';
import { ROUTES } from '../../constants/routes';

export interface ChildSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const ChildSwitcherSheet: React.FC<ChildSwitcherSheetProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const children = useChildStore((s) => s.children);
  const selectedChildId = useChildStore((s) => s.selectedChildId);
  const selectChild = useChildStore((s) => s.selectChild);

  const enrolledChildren = children.filter((c) => c.kind === 'enrolled');
  const applicantChildren = children.filter((c) => c.kind === 'applicant');

  const handleSelect = (childId: string) => {
    selectChild(childId);
    onClose();
  };

  const handleStartAdmission = () => {
    onClose();
    router.push(ROUTES.PARENT.WIZARD as any);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Child or Application">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        className="max-h-[500px]"
      >
        {children.length === 0 ? (
          <View className="py-8 items-center text-center">
            <View className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 items-center justify-center mb-3">
              <Ionicons name="people-outline" size={28} color="#4f46e5" />
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              No Linked Children Found
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs mb-6 leading-relaxed">
              Start an admission application or link your enrolled child to access daily school
              features.
            </Text>
            <TouchableOpacity
              onPress={handleStartAdmission}
              className="bg-indigo-600 px-5 py-3 rounded-xl flex-row items-center justify-center"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
              <Text className="text-sm font-bold text-white ml-2">Start Admission Application</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Section 1: Enrolled Students */}
            {enrolledChildren.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Enrolled Students ({enrolledChildren.length})
                </Text>
                {enrolledChildren.map((child: UnifiedChild) => {
                  const isSelected = child.id === selectedChildId;
                  const enrolled = child.kind === 'enrolled' ? child : null;

                  return (
                    <TouchableOpacity
                      key={child.id}
                      activeOpacity={0.75}
                      onPress={() => handleSelect(child.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={`p-3.5 rounded-2xl border mb-2.5 flex-row items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <Avatar name={child.fullName} uri={child.avatarUrl} size="md" />
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center flex-wrap gap-1 mb-0.5">
                            <Text
                              className={`text-sm font-bold ${
                                isSelected
                                  ? 'text-indigo-950 dark:text-indigo-100'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                              numberOfLines={1}
                            >
                              {child.fullName}
                            </Text>
                            <Badge label="Enrolled" variant="primary" />
                          </View>
                          {enrolled && (
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                              {enrolled.gradeLevel} - Sec {enrolled.section} • Adm #
                              {enrolled.admissionNumber}
                            </Text>
                          )}
                        </View>
                      </View>

                      {isSelected ? (
                        <View className="w-6 h-6 rounded-full bg-indigo-600 items-center justify-center">
                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Section 2: Admission Applicants */}
            {applicantChildren.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Admission Applicants ({applicantChildren.length})
                </Text>
                {applicantChildren.map((child: UnifiedChild) => {
                  const isSelected = child.id === selectedChildId;
                  const applicant = child.kind === 'applicant' ? child : null;

                  return (
                    <TouchableOpacity
                      key={child.id}
                      activeOpacity={0.75}
                      onPress={() => handleSelect(child.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={`p-3.5 rounded-2xl border mb-2.5 flex-row items-center justify-between ${
                        isSelected
                          ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <Avatar name={child.fullName} uri={child.avatarUrl} size="md" />
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center flex-wrap gap-1 mb-0.5">
                            <Text
                              className={`text-sm font-bold ${
                                isSelected
                                  ? 'text-amber-950 dark:text-amber-100'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                              numberOfLines={1}
                            >
                              {child.fullName}
                            </Text>
                            <Badge label="Applicant" variant="warning" />
                          </View>
                          {applicant && (
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                              Applying: {applicant.applyingGrade} • {applicant.applicationNumber}
                            </Text>
                          )}
                        </View>
                      </View>

                      {isSelected ? (
                        <View className="w-6 h-6 rounded-full bg-amber-600 items-center justify-center">
                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Action Row */}
            <TouchableOpacity
              onPress={handleStartAdmission}
              className="mt-3 p-3.5 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800 flex-row items-center justify-center bg-indigo-50/30 dark:bg-indigo-950/20"
              accessibilityRole="button"
              accessibilityLabel="Apply for another child"
            >
              <Ionicons name="add-circle-outline" size={18} color="#4f46e5" />
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-2">
                Apply for Another Child / New Admission
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
};
