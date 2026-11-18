import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FeedAttachment } from '../index';

interface MobileFeedGalleryProps {
  attachments?: FeedAttachment[];
  onImagePress: (index: number) => void;
}

export const MobileFeedGallery: React.FC<MobileFeedGalleryProps> = ({
  attachments = [],
  onImagePress,
}) => {
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});

  const sortedImages = [...attachments]
    .sort((a, b) => {
      const orderA = a.displayOrder ?? a.display_order ?? 0;
      const orderB = b.displayOrder ?? b.display_order ?? 0;
      return orderA - orderB;
    })
    .filter((att) => Boolean(att.signedUrl || att.signed_url));

  if (sortedImages.length === 0) {
    return null;
  }

  const handleImageError = (id: string) => {
    setLoadErrors((prev) => ({ ...prev, [id]: true }));
  };

  const renderThumbnail = (
    att: FeedAttachment,
    index: number,
    aspectStyle: any,
    containerStyle?: any,
  ) => {
    const url = att.signedUrl || att.signed_url || '';
    const id = att.attachmentId || att.attachment_id || `img-${index}`;
    const hasError = loadErrors[id];

    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.85}
        onPress={() => onImagePress(index)}
        style={[styles.thumbnailTouchable, containerStyle]}
        accessibilityRole="button"
        accessibilityLabel={`View image ${index + 1} of ${sortedImages.length}`}
      >
        {hasError ? (
          <View style={[styles.errorPlaceholder, aspectStyle]}>
            <Ionicons name="image-outline" size={24} color="#94A3B8" />
            <Text style={styles.errorPlaceholderText}>Image failed to load</Text>
          </View>
        ) : (
          <Image
            source={{ uri: url }}
            style={[styles.imageStyle, aspectStyle]}
            contentFit="cover"
            transition={200}
            onError={() => handleImageError(id)}
          />
        )}
      </TouchableOpacity>
    );
  };

  const count = sortedImages.length;

  // Single Image Layout
  if (count === 1) {
    return (
      <View style={styles.container}>
        {renderThumbnail(sortedImages[0], 0, styles.singleImage)}
      </View>
    );
  }

  // 2 Images Layout (Side-by-side equal columns)
  if (count === 2) {
    return (
      <View style={[styles.container, styles.rowContainer]}>
        {renderThumbnail(sortedImages[0], 0, styles.twoImages, styles.flexOne)}
        <View style={styles.gutterSmall} />
        {renderThumbnail(sortedImages[1], 1, styles.twoImages, styles.flexOne)}
      </View>
    );
  }

  // 3 Images Layout (1 Hero on top, 2 side-by-side below)
  if (count === 3) {
    return (
      <View style={styles.container}>
        {renderThumbnail(sortedImages[0], 0, styles.threeHeroImage)}
        <View style={styles.gutterVertical} />
        <View style={styles.rowContainer}>
          {renderThumbnail(sortedImages[1], 1, styles.threeSubImage, styles.flexOne)}
          <View style={styles.gutterSmall} />
          {renderThumbnail(sortedImages[2], 2, styles.threeSubImage, styles.flexOne)}
        </View>
      </View>
    );
  }

  // 4 Images Layout (2x2 Grid)
  if (count === 4) {
    return (
      <View style={styles.container}>
        <View style={styles.rowContainer}>
          {renderThumbnail(sortedImages[0], 0, styles.gridImage, styles.flexOne)}
          <View style={styles.gutterSmall} />
          {renderThumbnail(sortedImages[1], 1, styles.gridImage, styles.flexOne)}
        </View>
        <View style={styles.gutterVertical} />
        <View style={styles.rowContainer}>
          {renderThumbnail(sortedImages[2], 2, styles.gridImage, styles.flexOne)}
          <View style={styles.gutterSmall} />
          {renderThumbnail(sortedImages[3], 3, styles.gridImage, styles.flexOne)}
        </View>
      </View>
    );
  }

  // 5 Images Layout (2 on top, 3 on bottom)
  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        {renderThumbnail(sortedImages[0], 0, styles.fiveTopImage, styles.flexOne)}
        <View style={styles.gutterSmall} />
        {renderThumbnail(sortedImages[1], 1, styles.fiveTopImage, styles.flexOne)}
      </View>
      <View style={styles.gutterVertical} />
      <View style={styles.rowContainer}>
        {renderThumbnail(sortedImages[2], 2, styles.fiveBottomImage, styles.flexOne)}
        <View style={styles.gutterSmall} />
        {renderThumbnail(sortedImages[3], 3, styles.fiveBottomImage, styles.flexOne)}
        <View style={styles.gutterSmall} />
        {renderThumbnail(sortedImages[4], 4, styles.fiveBottomImage, styles.flexOne)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  rowContainer: {
    flexDirection: 'row',
  },
  flexOne: {
    flex: 1,
  },
  gutterSmall: {
    width: 4,
  },
  gutterVertical: {
    height: 4,
  },
  thumbnailTouchable: {
    overflow: 'hidden',
  },
  imageStyle: {
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  singleImage: {
    height: 220,
    borderRadius: 14,
  },
  twoImages: {
    height: 170,
  },
  threeHeroImage: {
    height: 160,
  },
  threeSubImage: {
    height: 110,
  },
  gridImage: {
    height: 125,
  },
  fiveTopImage: {
    height: 135,
  },
  fiveBottomImage: {
    height: 100,
  },
  errorPlaceholder: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  errorPlaceholderText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
});
