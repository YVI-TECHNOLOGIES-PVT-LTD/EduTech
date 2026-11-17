import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GradientSurface } from '../ui/atoms/GradientSurface';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { ROUTES } from '../../constants/routes';
import { UnifiedChild } from '../../types/child.types';
import { useAcademicsStore } from '../../stores/academics.store';
import { useFinanceStore } from '../../stores/finance.store';
import { NotificationItem } from '../../types/notification.types';

export interface ParentHeroCarouselProps {
  child: UnifiedChild | null;
  parentName: string;
  latestNotice?: NotificationItem | null;
  onShowToast?: (msg: string) => void;
}

interface CarouselSlideData {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  secondaryCtaText?: string;
  gradientColors: readonly string[] | string[];
  onPress: () => void;
  onSecondaryPress?: () => void;
}

export const ParentHeroCarousel: React.FC<ParentHeroCarouselProps> = React.memo(
  ({ child, parentName, latestNotice, onShowToast }) => {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const cardWidth = Math.max(windowWidth - 32, 280);

    const homework = useAcademicsStore((s) => s.homework);
    const exams = useAcademicsStore((s) => s.exams);
    const setActiveTab = useAcademicsStore((s) => s.setActiveTab);
    const ledger = useFinanceStore((s) => s.ledger);

    const isEnrolled = child?.kind === 'enrolled';
    const childFirstName = child ? child.firstName || child.fullName.split(' ')[0] : 'your child';

    // Dynamic slides reflecting child state, academic status & school announcements
    const slides: CarouselSlideData[] = [
      // Slide 1: Welcome to EduTrack
      {
        id: 'welcome',
        badge: 'Portal Guide',
        title: 'Welcome to EduTrack',
        subtitle: 'Real-time attendance, fee receipts & grade analytics in one tap.',
        ctaText: 'Explore Tour',
        secondaryCtaText: 'Handbook',
        gradientColors: DESIGN_TOKENS.colors.gradients.welcomeSlide,
        onPress: () => {
          if (onShowToast) onShowToast('Campus Tour Guide launched!');
          else router.push(ROUTES.MAIN.ACADEMICS as any);
        },
        onSecondaryPress: () => {
          if (onShowToast) onShowToast('Parent orientation booklet downloaded.');
        },
      },
      // Slide 2: Academic Excellence
      {
        id: 'stem',
        badge: 'Academics',
        title: 'Academic Excellence',
        subtitle: isEnrolled
          ? `View ${childFirstName}'s curriculum progress, homework assignments & exams.`
          : 'Explore grade-level interactive curriculum & admission criteria.',
        ctaText: 'View Academics',
        gradientColors: DESIGN_TOKENS.colors.gradients.excellenceSlide,
        onPress: () => {
          setActiveTab('homework');
          router.push(ROUTES.MAIN.ACADEMICS as any);
        },
      },
      // Slide 3: School Activities / Notice
      {
        id: 'sports',
        badge: latestNotice?.category || 'Campus Life',
        title: latestNotice?.title || 'School Activities & Sports',
        subtitle:
          latestNotice?.message ||
          `Annual athletic trials and extracurricular activities open for ${childFirstName}'s session.`,
        ctaText: 'View Details',
        gradientColors: DESIGN_TOKENS.colors.gradients.activitiesSlide,
        onPress: () => {
          router.push(ROUTES.MAIN.COMMUNICATION as any);
        },
      },
      // Slide 4: Stay Updated / School Community
      {
        id: 'pulse',
        badge: 'School Community',
        title: 'Parent Council Portal',
        subtitle: isEnrolled
          ? `Stay connected with class teachers and parent representatives for ${child.gradeLevel || 'Class'}.`
          : 'Stay connected with admissions counselors and school administration.',
        ctaText: 'Open Forum',
        gradientColors: DESIGN_TOKENS.colors.gradients.updatedSlide,
        onPress: () => {
          router.push(ROUTES.MAIN.COMMUNICATION as any);
        },
      },
    ];

    const totalSlides = slides.length;

    const scrollToSlide = (index: number) => {
      const targetIndex = (index + totalSlides) % totalSlides;
      setActiveIndex(targetIndex);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: targetIndex * (cardWidth + 12),
          animated: true,
        });
      }
    };

    const nextSlide = () => scrollToSlide(activeIndex + 1);
    const prevSlide = () => scrollToSlide(activeIndex - 1);

    // Auto-rotate every 6 seconds, pausing on interaction
    useEffect(() => {
      if (!isInteracting && totalSlides > 1) {
        timerRef.current = setInterval(() => {
          setActiveIndex((prev) => {
            const nextIdx = (prev + 1) % totalSlides;
            if (scrollRef.current) {
              scrollRef.current.scrollTo({
                x: nextIdx * (cardWidth + 12),
                animated: true,
              });
            }
            return nextIdx;
          });
        }, 6000);
      }
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [isInteracting, totalSlides, cardWidth]);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (cardWidth + 12));
      if (index >= 0 && index < totalSlides && index !== activeIndex) {
        setActiveIndex(index);
      }
    };

    return (
      <View style={styles.carouselContainer}>
        <View style={styles.carouselFrame}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled={false}
            snapToInterval={cardWidth + 12}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            onScrollBeginDrag={() => setIsInteracting(true)}
            onScrollEndDrag={() => setIsInteracting(false)}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            {slides.map((slide) => (
              <TouchableOpacity
                key={slide.id}
                activeOpacity={0.94}
                onPress={slide.onPress}
                style={[styles.slideCardWrapper, { width: cardWidth }]}
                accessibilityRole="button"
                accessibilityLabel={`${slide.badge}: ${slide.title}. ${slide.subtitle}`}
              >
                <GradientSurface
                  colors={slide.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  borderRadius={20}
                  style={styles.gradientCard}
                >
                  {/* Subtle Geometric Overlay */}
                  <View style={styles.glowOverlay} />

                  {/* Header Tag */}
                  <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>{slide.badge}</Text>
                  </View>

                  {/* Body Content */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {slide.title}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {slide.subtitle}
                    </Text>
                  </View>

                  {/* Buttons Row */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={slide.onPress}
                      style={styles.primaryPillButton}
                    >
                      <Text style={styles.primaryPillText}>{slide.ctaText}</Text>
                    </TouchableOpacity>

                    {slide.secondaryCtaText && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={slide.onSecondaryPress}
                        style={styles.secondaryPillButton}
                      >
                        <Text style={styles.secondaryPillText}>{slide.secondaryCtaText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </GradientSurface>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Top-Right Prev/Next Chevron Controls */}
          <View style={styles.topRightControls}>
            <TouchableOpacity
              onPress={prevSlide}
              style={styles.miniControlBtn}
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
            >
              <Ionicons name="chevron-back" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextSlide}
              style={styles.miniControlBtn}
              accessibilityRole="button"
              accessibilityLabel="Next slide"
            >
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom-Right Pill Pagination Dots */}
          <View style={styles.bottomRightDots}>
            {slides.map((s, idx) => {
              const isActive = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => scrollToSlide(idx)}
                  style={[styles.dotItem, isActive ? styles.dotItemActive : styles.dotItemInactive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  },
);

ParentHeroCarousel.displayName = 'ParentHeroCarousel';

const styles = StyleSheet.create({
  carouselContainer: {
    marginBottom: 16,
  },
  carouselFrame: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  slideCardWrapper: {
    marginRight: 12,
  },
  gradientCard: {
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    position: 'relative',
    ...DESIGN_TOKENS.shadows.card,
  },
  glowOverlay: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  primaryPillButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  primaryPillText: {
    color: DESIGN_TOKENS.colors.deepNavy,
    fontSize: 11,
    fontWeight: '800',
  },
  secondaryPillButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  secondaryPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  topRightControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  miniControlBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRightDots: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  dotItem: {
    height: 5,
    borderRadius: 2.5,
  },
  dotItemActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  dotItemInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
