import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ApplicationTimelineEvent } from '../../types/admission.types';

export interface TimelineStepCardProps {
  event: ApplicationTimelineEvent;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TimelineStepCard: React.FC<TimelineStepCardProps> = ({
  event,
  isFirst = false,
  isLast = false,
}) => {
  const dateStr = event.timestamp
    ? new Date(event.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent update';

  let iconName: any = 'checkmark-circle';
  let iconBg = 'bg-indigo-600';
  let iconColor = '#ffffff';

  switch (event.type) {
    case 'APPLICATION_CREATED':
      iconName = 'document-text';
      iconBg = 'bg-blue-600';
      break;
    case 'DOCUMENT_UPLOADED':
    case 'DOCUMENT_VERIFIED':
      iconName = 'shield-checkmark';
      iconBg = 'bg-emerald-600';
      break;
    case 'ASSESSMENT_RECORDED':
      iconName = 'school';
      iconBg = 'bg-purple-600';
      break;
    case 'DECISION_RECORDED':
      iconName = 'ribbon';
      iconBg = 'bg-amber-600';
      break;
    case 'PAYMENT_RECORDED':
      iconName = 'card';
      iconBg = 'bg-teal-600';
      break;
    default:
      iconName = 'time';
      iconBg = 'bg-indigo-600';
  }

  return (
    <View className="flex-row items-start">
      {/* Node Column */}
      <View className="items-center mr-4">
        {/* Top Connecting Line */}
        {!isFirst ? (
          <View className="w-0.5 h-3 bg-indigo-200 dark:bg-indigo-900" />
        ) : (
          <View className="w-0.5 h-3 bg-transparent" />
        )}

        {/* Node Circle */}
        <View className={`w-8 h-8 rounded-full ${iconBg} items-center justify-center shadow-sm`}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>

        {/* Bottom Connecting Line */}
        {!isLast && <View className="w-0.5 h-16 bg-indigo-200 dark:bg-indigo-900 my-1" />}
      </View>

      {/* Content Card */}
      <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 mb-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className="text-sm font-black text-slate-900 dark:text-slate-100 flex-1 mr-2"
            numberOfLines={1}
          >
            {event.title}
          </Text>
          <Text className="text-[10px] font-semibold text-slate-400">{dateStr}</Text>
        </View>

        {event.description && (
          <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
            {event.description}
          </Text>
        )}
      </View>
    </View>
  );
};
