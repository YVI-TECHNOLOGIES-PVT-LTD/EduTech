import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface AnnouncementItem {
  id: string;
  category: string;
  title: string;
  date: string;
  snippet: string;
  author?: string;
}

export interface AnnouncementCarouselProps {
  announcements?: AnnouncementItem[];
  onSelectAnnouncement?: (item: AnnouncementItem) => void;
}

export const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = React.memo(
  ({ announcements = [], onSelectAnnouncement }) => {
    const router = useRouter();

    const handleViewAll = () => {
      router.push(ROUTES.MAIN.COMMUNICATION as any);
    };

    const getCategoryBadgeStyle = (category: string) => {
      const cat = category.toUpperCase();
      if (cat.includes('SPORT')) {
        return { bg: DESIGN_TOKENS.colors.emerald, text: '#FFFFFF' };
      }
      return { bg: DESIGN_TOKENS.colors.deepNavy, text: '#FFFFFF' };
    };

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="megaphone" size={20} color={DESIGN_TOKENS.colors.royalIndigo} />
            <Text style={styles.sectionTitle}>School Announcements</Text>
          </View>
          <TouchableOpacity
            onPress={handleViewAll}
            activeOpacity={0.75}
            style={styles.viewAllBtn}
            accessibilityRole="button"
            accessibilityLabel="View all school circulars"
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Content: Real announcements or clean empty state */}
        {announcements.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="newspaper-outline"
                size={24}
                color={DESIGN_TOKENS.colors.royalIndigo}
              />
            </View>
            <Text style={styles.emptyTitle}>No New Circulars</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up with official school notices and announcements.
            </Text>
            <TouchableOpacity onPress={handleViewAll} activeOpacity={0.8} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>View Notice History</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {announcements.map((item) => {
              const badgeStyle = getCategoryBadgeStyle(item.category);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (onSelectAnnouncement) {
                      onSelectAnnouncement(item);
                    } else {
                      handleViewAll();
                    }
                  }}
                  style={styles.announcementCard}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.category}: ${item.title}`}
                >
                  {/* Visual Header Banner */}
                  <View style={styles.imageBannerPlaceholder}>
                    <View style={[styles.categoryTag, { backgroundColor: badgeStyle.bg }]}>
                      <Text style={[styles.categoryTagText, { color: badgeStyle.text }]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardBody}>
                    <View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardSnippet} numberOfLines={2}>
                        {item.snippet}
                      </Text>
                    </View>

                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.dateRow}>
                        <Ionicons name="time-outline" size={12} color="#64748B" />
                        <Text style={styles.dateText}>{item.date}</Text>
                      </View>
                      <View style={styles.readRow}>
                        <Text style={styles.readText}>Read</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color={DESIGN_TOKENS.colors.royalIndigo}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  },
);

AnnouncementCarousel.displayName = 'AnnouncementCarousel';

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
  viewAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  announcementCard: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  imageBannerPlaceholder: {
    height: 100,
    backgroundColor: '#EEF2FF',
    position: 'relative',
    padding: 10,
    justifyContent: 'flex-start',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardSnippet: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.royalIndigo,
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
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(67, 56, 202, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 14,
  },
  emptyBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
});
