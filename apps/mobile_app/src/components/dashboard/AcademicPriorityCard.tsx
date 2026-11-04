import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface AcademicPriorityCardProps {
  pendingAssignmentsCount?: number;
  assignmentsSummary?: string;
  upcomingExamNotice?: string | null;
}

export const AcademicPriorityCard: React.FC<AcademicPriorityCardProps> = ({
  pendingAssignmentsCount: propPendingCount,
  assignmentsSummary: propSummary,
  upcomingExamNotice: propExamNotice,
}) => {
  const router = useRouter();
  const homework = useAcademicsStore((s) => s.homework);
  const exams = useAcademicsStore((s) => s.exams);
  const setActiveTab = useAcademicsStore((s) => s.setActiveTab);

  // Compute from real store data if not passed as prop
  const pendingHomework = homework.filter((h) => h.status === 'pending');
  const pendingCount = propPendingCount !== undefined ? propPendingCount : pendingHomework.length;
  const assignmentsSummary =
    propSummary ||
    (pendingHomework.length > 0
      ? `${pendingHomework[0].subject}: ${pendingHomework[0].title} (Due ${pendingHomework[0].dueDate})`
      : undefined);

  const upcomingExamNotice =
    propExamNotice !== undefined
      ? propExamNotice
      : exams.length > 0
        ? `${exams[0].subject} (${exams[0].examDate} at ${exams[0].startTime})`
        : null;

  const hasPriorities = pendingCount > 0 || Boolean(upcomingExamNotice);

  const handleOpenAssignments = () => {
    setActiveTab('homework');
    router.push(ROUTES.MAIN.ACADEMICS as any);
  };

  const handleOpenExams = () => {
    setActiveTab('exams');
    router.push(ROUTES.MAIN.ACADEMICS as any);
  };

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
          <Ionicons name="book-outline" size={17} color="#9333EA" />
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
            Academic Priorities
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('homework');
            router.push(ROUTES.MAIN.ACADEMICS as any);
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: DESIGN_TOKENS.colors.primary }}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {hasPriorities ? (
        <View style={{ gap: 10 }}>
          {pendingCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenAssignments}
              style={{
                backgroundColor: '#FAF5FF',
                borderColor: '#E9D5FF',
                borderWidth: 1,
                borderRadius: DESIGN_TOKENS.radius.small,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#6B21A8' }}>
                  {pendingCount} Assignment{pendingCount > 1 ? 's' : ''} Pending
                </Text>
                {assignmentsSummary ? (
                  <Text
                    style={{
                      fontSize: 11,
                      color: DESIGN_TOKENS.colors.textSecondary,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {assignmentsSummary}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={14} color="#9333EA" />
            </TouchableOpacity>
          )}

          {upcomingExamNotice && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenExams}
              style={{
                backgroundColor: '#FFF7ED',
                borderColor: '#FFEDD5',
                borderWidth: 1,
                borderRadius: DESIGN_TOKENS.radius.small,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#9A3412' }}>
                  Upcoming Examination Notice
                </Text>
                <Text
                  style={{ fontSize: 11, color: DESIGN_TOKENS.colors.textSecondary, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {upcomingExamNotice}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#EA580C" />
            </TouchableOpacity>
          )}
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
          <Text style={{ fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary }}>
            No pending assignments or urgent academic alerts for today.
          </Text>
        </View>
      )}
    </View>
  );
};
