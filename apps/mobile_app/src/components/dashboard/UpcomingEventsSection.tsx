import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface SchoolEventItem {
  id: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  statusBadge?: string;
  title: string;
  dateTime: string;
  venue: string;
  month?: string;
  day?: string;
  dayOfWeek?: string;
}

export interface UpcomingEventsSectionProps {
  events?: SchoolEventItem[];
  onEventAction?: (title: string) => void;
}

export const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = React.memo(
  ({ events, onEventAction }) => {
    const currentMonthYear = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const hasExplicitEvents = events !== undefined;
    const isEventsEmpty = hasExplicitEvents && events.length === 0;

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={18} color={DESIGN_TOKENS.colors.electricViolet} />
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{currentMonthYear}</Text>
        </View>

        {isEventsEmpty ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={24}
              color={DESIGN_TOKENS.colors.royalIndigo}
            />
            <Text style={styles.emptyTitle}>No Events Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              There are no upcoming school events or parent meetings scheduled for this period.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {/* Event 1: PTM */}
            <View style={styles.eventCard}>
              <View style={styles.eventIconBlockViolet}>
                <Ionicons name="people" size={24} color={DESIGN_TOKENS.colors.electricViolet} />
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.badgeRow}>
                  <View style={styles.categoryPillViolet}>
                    <Text style={styles.categoryTextViolet}>MEETING</Text>
                  </View>
                  <Text style={styles.statusTextRose}>Parent Portal</Text>
                </View>

                <Text style={styles.eventTitle} numberOfLines={1}>
                  Parent-Teacher Interaction (PTM)
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={DESIGN_TOKENS.colors.royalIndigo}
                    />
                    <Text style={styles.metaTextIndigo}>Upcoming Session</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color="#64748B" />
                    <Text style={styles.metaTextSecondary}>School Campus</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => onEventAction && onEventAction('PTM details saved to Calendar')}
                activeOpacity={0.75}
                style={styles.actionRoundButton}
                accessibilityRole="button"
                accessibilityLabel="Add PTM to calendar"
              >
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color={DESIGN_TOKENS.colors.royalIndigo}
                />
              </TouchableOpacity>
            </View>

            {/* Event 2: Annual Exhibition */}
            <View style={styles.eventCard}>
              <View style={styles.dateBlockAmber}>
                <Text style={styles.dateMonthAmber}>TERM</Text>
                <Text style={styles.dateDayAmber}>02</Text>
                <Text style={styles.dateDayOfWeek}>EVENT</Text>
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.badgeRow}>
                  <View style={styles.categoryPillAmber}>
                    <Text style={styles.categoryTextAmber}>ACADEMIC</Text>
                  </View>
                </View>

                <Text style={styles.eventTitle} numberOfLines={1}>
                  Annual Science & Innovation Gala
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={DESIGN_TOKENS.colors.amber} />
                    <Text style={styles.metaTextAmber}>Campus Auditorium</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color="#64748B" />
                    <Text style={styles.metaTextSecondary}>Open to Parents</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => onEventAction && onEventAction('Event details bookmarked')}
                activeOpacity={0.75}
                style={styles.actionRoundButton}
                accessibilityRole="button"
                accessibilityLabel="Bookmark event"
              >
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={DESIGN_TOKENS.colors.royalIndigo}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  },
);

UpcomingEventsSection.displayName = 'UpcomingEventsSection';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    fontWeight: '500',
  },
  eventsList: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  eventIconBlockViolet: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlockAmber: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dateMonthAmber: {
    fontSize: 10,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.amber,
  },
  dateDayAmber: {
    fontSize: 18,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.deepNavy,
    lineHeight: 20,
  },
  dateDayOfWeek: {
    fontSize: 8,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
  },
  eventDetails: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryPillViolet: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  categoryTextViolet: {
    fontSize: 9,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.electricViolet,
  },
  categoryPillAmber: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  categoryTextAmber: {
    fontSize: 9,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.amber,
  },
  statusTextRose: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.rose,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaTextIndigo: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  metaTextAmber: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.amber,
  },
  metaTextSecondary: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  actionRoundButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
