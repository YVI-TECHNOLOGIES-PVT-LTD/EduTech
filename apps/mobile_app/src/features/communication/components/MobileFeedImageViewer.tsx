import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface MobileFeedImageItem {
  url: string;
  caption?: string | null;
  fileName?: string;
}

interface MobileFeedImageViewerProps {
  visible: boolean;
  images: MobileFeedImageItem[];
  initialIndex?: number;
  onClose: () => void;
}

export const MobileFeedImageViewer: React.FC<MobileFeedImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)));
      setIsLoading(true);
      setHasError(false);
    }
  }, [visible, initialIndex, images.length]);

  useEffect(() => {
    if (!visible) return;
    const backAction = () => {
      onClose();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, onClose]);

  if (!visible || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex] || images[0];
  const hasMultiple = images.length > 1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLoading(true);
      setHasError(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLoading(true);
      setHasError(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Top Navigation Bar with Safe Area Clearance */}
        <View
          style={[
            styles.headerBar,
            {
              paddingTop: Math.max(insets.top, 24) + 8,
            },
          ]}
        >
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main Image Display Area */}
        <View style={styles.imageStage}>
          {isLoading && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={48} color="#71717A" />
              <Text style={styles.errorText}>Unable to load image.</Text>
            </View>
          ) : (
            <Image
              source={{ uri: currentImage.url }}
              style={styles.fullImage}
              contentFit="contain"
              transition={200}
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}

          {/* Left Arrow Button */}
          {hasMultiple && currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrev}
              style={[styles.navArrowButton, styles.leftArrow]}
              accessibilityLabel="Previous image"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Right Arrow Button */}
          {hasMultiple && currentIndex < images.length - 1 && (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navArrowButton, styles.rightArrow]}
              accessibilityLabel="Next image"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Caption & Information Footer */}
        <View
          style={[
            styles.footerBar,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {currentImage.caption ? (
            <Text style={styles.captionText} numberOfLines={3}>
              {currentImage.caption}
            </Text>
          ) : currentImage.fileName ? (
            <Text style={styles.fileNameText} numberOfLines={1}>
              {currentImage.fileName}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
  },
  counterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  counterText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  navArrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  leftArrow: {
    left: 14,
  },
  rightArrow: {
    right: 14,
  },
  footerBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    zIndex: 10,
  },
  captionText: {
    color: '#F4F4F5',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  fileNameText: {
    color: '#A1A1AA',
    fontSize: 12,
    textAlign: 'center',
  },
});
