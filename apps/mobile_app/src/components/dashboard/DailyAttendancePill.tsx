import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';

export interface DailyAttendancePillProps {
  status?: 'present' | 'absent' | 'late' | 'holiday' | 'unmarked';
  timestamp?: string;
  onPress?: () => void;
}

export const DailyAttendancePill: React.FC<DailyAttendancePillProps> = ({
  status = 'unmarked',
  timestamp,
  onPress,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(ROUTES.MAIN.ACADEMICS as any);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'present':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-200',
          icon: 'checkmark-circle' as const,
          iconColor: '#059669',
          title: timestamp ? `Present Today • Marked at ${timestamp}` : 'Present Today',
        };
      case 'absent':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          text: 'text-rose-800 dark:text-rose-200',
          icon: 'alert-circle' as const,
          iconColor: '#dc2626',
          title: 'Marked Absent Today • Contact School',
        };
      case 'late':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          text: 'text-amber-800 dark:text-amber-200',
          icon: 'time' as const,
          iconColor: '#d97706',
          title: timestamp ? `Arrived Late at ${timestamp}` : 'Marked Late Today',
        };
      case 'holiday':
        return {
          bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
          text: 'text-sky-800 dark:text-sky-200',
          icon: 'calendar' as const,
          iconColor: '#0284c7',
          title: 'School Holiday • No Classes',
        };
      case 'unmarked':
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
          icon: 'time-outline' as const,
          iconColor: '#64748b',
          title: 'Attendance not yet marked for today',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className={`border rounded-2xl px-4 py-3 flex-row items-center justify-between shadow-sm mb-4 ${config.bg}`}
      accessibilityRole="button"
      accessibilityLabel={`Attendance status: ${config.title}`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Ionicons name={config.icon} size={20} color={config.iconColor} />
        <Text className={`text-xs font-bold ml-2.5 flex-1 ${config.text}`} numberOfLines={1}>
          {config.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
    </TouchableOpacity>
  );
};
