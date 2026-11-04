import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { useTheme } from '../../theme';

export interface ParentLoadingSkeletonProps {
  type?: 'cards' | 'banner' | 'details' | 'list';
}

export const ParentLoadingSkeleton: React.FC<ParentLoadingSkeletonProps> = ({ type = 'cards' }) => {
  const { isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [animatedValue]);

  const baseColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <View style={styles.container}>
      {type === 'cards' && (
        <>
          <Animated.View
            style={[styles.cardSkeleton, { backgroundColor: baseColor, opacity: animatedValue }]}
          />
          <Animated.View
            style={[
              styles.cardSkeleton,
              { backgroundColor: baseColor, opacity: animatedValue, height: 120 },
            ]}
          />
        </>
      )}

      {type === 'banner' && (
        <Animated.View
          style={[styles.bannerSkeleton, { backgroundColor: baseColor, opacity: animatedValue }]}
        />
      )}

      {type === 'list' && (
        <>
          {[1, 2, 3, 4].map((key) => (
            <Animated.View
              key={key}
              style={[
                styles.listItemSkeleton,
                { backgroundColor: baseColor, opacity: animatedValue },
              ]}
            />
          ))}
        </>
      )}

      {type === 'details' && (
        <View style={styles.detailsContainer}>
          <Animated.View
            style={[
              styles.detailsHeaderSkeleton,
              { backgroundColor: baseColor, opacity: animatedValue },
            ]}
          />
          <Animated.View
            style={[
              styles.detailsBodySkeleton,
              { backgroundColor: baseColor, opacity: animatedValue },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  cardSkeleton: {
    height: 150,
    borderRadius: DESIGN_TOKENS.radius.card,
    marginBottom: 16,
    width: '100%',
  },
  bannerSkeleton: {
    height: 160,
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    marginBottom: 20,
    width: '100%',
  },
  listItemSkeleton: {
    height: 76,
    borderRadius: DESIGN_TOKENS.radius.card,
    marginBottom: 12,
    width: '100%',
  },
  detailsContainer: {
    padding: 4,
  },
  detailsHeaderSkeleton: {
    height: 100,
    borderRadius: DESIGN_TOKENS.radius.card,
    marginBottom: 16,
    width: '100%',
  },
  detailsBodySkeleton: {
    height: 220,
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    width: '100%',
  },
});
