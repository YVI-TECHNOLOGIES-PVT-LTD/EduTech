import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface ScheduleClassItem {
  title: string;
  time: string;
  room?: string;
  instructor?: string;
  periodName?: string;
  nextClass?: string;
}

export interface TodayScheduleGlanceProps {
  currentClass?: ScheduleClassItem | null;
  onPress?: () => void;
}

export const TodayScheduleGlance: React.FC<TodayScheduleGlanceProps> = ({
  currentClass,
  onPress,
}) => {
  const router = useRouter();
  const timetable = useAcademicsStore((s) => s.timetable);
  const isLoading = useAcademicsStore((s) => s.isLoading);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(ROUTES.MAIN.ACADEMICS as any);
    }
  };

  // Determine current day of week
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const dayNames: (
    'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  )[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[today.getDay()];

  // Find today's periods from store if not provided via props
  const todaySchedule = timetable.find((d) => d.day === currentDayName)?.periods || [];
  const displayClass =
    currentClass ||
    (todaySchedule.length > 0
      ? {
          periodName: `Period 1 • ${todaySchedule[0].subject}`,
          title: todaySchedule[0].subject,
          time: `${todaySchedule[0].startTime} - ${todaySchedule[0].endTime}`,
          room: todaySchedule[0].room,
          instructor: todaySchedule[0].teacherName,
          nextClass: todaySchedule.length > 1 ? todaySchedule[1].subject : undefined,
        }
      : null);

  return (
    <View
      style={{
        backgroundColor: DESIGN_TOKENS.colors.surface,
        borderColor: DESIGN_TOKENS.colors.border,
        borderWidth: 1,
        borderRadius: DESIGN_TOKENS.radius.card,
        padding: DESIGN_TOKENS.spacing.standard,
        marginBottom: DESIGN_TOKENS.spacing.standard,
        ...DESIGN_TOKENS.shadows.subtle,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: DESIGN_TOKENS.spacing.small,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={17} color={DESIGN_TOKENS.colors.primary} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: DESIGN_TOKENS.colors.textSecondary,
              marginLeft: 6,
            }}
          >
            Today's Schedule
          </Text>
        </View>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: DESIGN_TOKENS.colors.primary }}>
            Full Timetable
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !displayClass ? (
        <View style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={DESIGN_TOKENS.colors.primary} />
          <Text style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary, marginLeft: 8 }}>
            Retrieving schedule...
          </Text>
        </View>
      ) : isWeekend ? (
        <View style={{ paddingVertical: 8, alignItems: 'center' }}>
          <Text
            style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary, fontWeight: '500' }}
          >
            No academic classes scheduled for today (Weekend).
          </Text>
        </View>
      ) : displayClass ? (
        <View
          style={{
            backgroundColor: DESIGN_TOKENS.colors.primaryLight,
            borderColor: '#C7D2FE',
            borderWidth: 1,
            borderRadius: DESIGN_TOKENS.radius.small,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: DESIGN_TOKENS.colors.success,
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: DESIGN_TOKENS.colors.primaryDark,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {displayClass.periodName || 'Class in Session'}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '900',
                color: DESIGN_TOKENS.colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              {displayClass.title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: DESIGN_TOKENS.colors.textSecondary,
                marginTop: 2,
                fontWeight: '500',
              }}
            >
              {displayClass.time}
              {displayClass.room ? ` • ${displayClass.room}` : ''}
              {displayClass.instructor ? ` • ${displayClass.instructor}` : ''}
            </Text>
          </View>
          {displayClass.nextClass ? (
            <View
              style={{
                backgroundColor: DESIGN_TOKENS.colors.surface,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: DESIGN_TOKENS.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: DESIGN_TOKENS.colors.textSecondary,
                }}
              >
                Next: {displayClass.nextClass}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: DESIGN_TOKENS.colors.secondarySurface,
            borderRadius: DESIGN_TOKENS.radius.small,
            borderWidth: 1,
            borderColor: DESIGN_TOKENS.colors.borderLight,
          }}
        >
          <Text style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary, lineHeight: 17 }}>
            No classes scheduled for today. Tap Full Timetable to view the weekly curriculum.
          </Text>
        </View>
      )}
    </View>
  );
};
