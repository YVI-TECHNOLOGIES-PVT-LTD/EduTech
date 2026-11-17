import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export const HomeLoadingSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Animated.View
            style={[styles.skeletonPill, { width: 140, height: 12, opacity: shimmerAnim }]}
          />
          <Animated.View
            style={[
              styles.skeletonPill,
              { width: 200, height: 26, marginTop: 8, opacity: shimmerAnim },
            ]}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Animated.View
            style={[styles.skeletonCircle, { width: 42, height: 42, opacity: shimmerAnim }]}
          />
          <Animated.View
            style={[styles.skeletonCircle, { width: 42, height: 42, opacity: shimmerAnim }]}
          />
        </View>
      </View>

      {/* Child Card Skeleton */}
      <Animated.View style={[styles.skeletonCard, { height: 86, opacity: shimmerAnim }]} />

      {/* Hero Carousel Skeleton */}
      <Animated.View
        style={[
          styles.skeletonCard,
          { height: 165, opacity: shimmerAnim, backgroundColor: '#EEF2FF' },
        ]}
      />

      {/* Attendance Pill Skeleton */}
      <Animated.View style={[styles.skeletonCard, { height: 50, opacity: shimmerAnim }]} />

      {/* Schedule Card Skeleton */}
      <Animated.View style={[styles.skeletonCard, { height: 130, opacity: shimmerAnim }]} />

      {/* Quick Actions Skeleton */}
      <View style={styles.gridRow}>
        {[1, 2, 3].map((i) => (
          <Animated.View key={i} style={[styles.skeletonGridItem, { opacity: shimmerAnim }]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DESIGN_TOKENS.spacing.comfortable,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonPill: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  skeletonCircle: {
    backgroundColor: '#E2E8F0',
    borderRadius: 21,
  },
  skeletonCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: DESIGN_TOKENS.radius.card,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  skeletonGridItem: {
    flex: 1,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
