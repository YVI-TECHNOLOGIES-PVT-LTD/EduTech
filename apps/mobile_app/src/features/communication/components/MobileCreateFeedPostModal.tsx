import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { communicationApi } from '../../../api/communication.api';
import { DESIGN_TOKENS } from '../../../theme/tokens/designTokens';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface SelectedImage {
  uri: string;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  caption?: string;
}

interface MobileCreateFeedPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MobileCreateFeedPostModal: React.FC<MobileCreateFeedPostModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedImages([]);
    setUploadProgress(null);
  };

  const handlePickImages = async () => {
    if (selectedImages.length >= MAX_ATTACHMENTS) {
      Alert.alert('Limit Reached', `You can only attach up to ${MAX_ATTACHMENTS} images per post.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to attach images to feed posts.',
      );
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - selectedImages.length;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.85,
      });

      if (result.canceled || !result.assets) {
        return;
      }

      const validNewImages: SelectedImage[] = [];

      for (const asset of result.assets) {
        // Enforce max count
        if (selectedImages.length + validNewImages.length >= MAX_ATTACHMENTS) {
          Alert.alert(
            'Maximum 5 Images',
            `Only up to ${MAX_ATTACHMENTS} images can be attached. Additional images were ignored.`,
          );
          break;
        }

        // Validate file size if available
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
          Alert.alert(
            'File Too Large',
            `"${asset.fileName || 'Selected image'}" exceeds the 10 MB limit (${(
              asset.fileSize /
              (1024 * 1024)
            ).toFixed(1)} MB).`,
          );
          continue;
        }

        // Validate MIME type
        const mime = asset.mimeType || 'image/jpeg';
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(mime.toLowerCase())) {
          Alert.alert('Unsupported Image Type', `Only JPEG, PNG, and WebP images are supported.`);
          continue;
        }

        validNewImages.push({
          uri: asset.uri,
          fileName: asset.fileName || `photo_${Date.now()}_${validNewImages.length}.jpg`,
          fileSize: asset.fileSize,
          mimeType: mime,
        });
      }

      if (validNewImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...validNewImages]);
      }
    } catch {
      Alert.alert('Image Selection Error', 'An error occurred while opening the image library.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert('Required Content', 'Please enter content for the feed post.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('Creating post...');

    try {
      // Step 1: Create the Feed Post
      const postRes = await communicationApi.createPost({
        title: title.trim() || undefined,
        content: trimmedContent,
        feed_type: 'staff_community',
        audience_scope: 'organization',
        status: 'published',
        comments_enabled: true,
        reactions_enabled: true,
      });

      const createdPost: any = (postRes as any)?.data ?? postRes;
      const postId = createdPost?.feedPostId || createdPost?.feed_post_id;

      if (!postId) {
        throw new Error('Failed to retrieve post identifier after creation.');
      }

      // Step 2: Sequentially upload each attachment if any
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const item = selectedImages[i];
          setUploadProgress(`Uploading image ${i + 1} of ${selectedImages.length}...`);

          const formData = new FormData();
          const fileToUpload: any = {
            uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''),
            name: item.fileName,
            type: item.mimeType,
          };

          formData.append('file', fileToUpload);
          formData.append('display_order', String(i + 1));
          if (item.caption) {
            formData.append('caption', item.caption);
          }

          await communicationApi.uploadAttachment(postId, formData);
        }
      }

      setUploadProgress(null);
      setIsSubmitting(false);
      resetForm();
      onSuccess();
      onClose();
      Alert.alert('Success', 'Your post has been published to the School Feed.');
    } catch (err: any) {
      setIsSubmitting(false);
      setUploadProgress(null);
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to publish post or attachments.';
      Alert.alert(
        'Publication Error',
        `${msg}\n\nYour post text and selected images have been preserved. You may retry.`,
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            disabled={isSubmitting}
            style={styles.cancelButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Feed Post</Text>

          <TouchableOpacity
            onPress={handlePublish}
            disabled={isSubmitting || !content.trim()}
            style={[
              styles.publishButton,
              (!content.trim() || isSubmitting) && styles.publishButtonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Notification */}
        {uploadProgress && (
          <View style={styles.progressBanner}>
            <ActivityIndicator size="small" color={DESIGN_TOKENS.colors.primary} />
            <Text style={styles.progressText}>{uploadProgress}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Post Title Input */}
          <TextInput
            placeholder="Post Title (Optional)"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            editable={!isSubmitting}
            style={styles.titleInput}
            maxLength={120}
          />

          {/* Post Body Input */}
          <TextInput
            placeholder="What's happening in your school community? Write your update here..."
            placeholderTextColor="#94A3B8"
            value={content}
            onChangeText={setContent}
            editable={!isSubmitting}
            multiline
            numberOfLines={6}
            style={styles.bodyInput}
            textAlignVertical="top"
          />

          {/* Attachments Section */}
          <View style={styles.attachmentsSection}>
            <View style={styles.attachmentsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="images-outline"
                  size={18}
                  color="#475569"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.attachmentsTitle}>Image Attachments</Text>
              </View>
              <Text style={styles.attachmentsCounter}>
                {selectedImages.length} / {MAX_ATTACHMENTS}
              </Text>
            </View>

            {/* Selected Images Horizontal Preview Scroll */}
            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailsContainer}
              >
                {selectedImages.map((img, index) => (
                  <View key={`${img.uri}-${index}`} style={styles.thumbnailWrapper}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.thumbnailImage}
                      contentFit="cover"
                    />
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeText}>{index + 1}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      disabled={isSubmitting}
                      style={styles.removeBadge}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Remove image"
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Add Images Button */}
            {selectedImages.length < MAX_ATTACHMENTS && (
              <TouchableOpacity
                onPress={handlePickImages}
                disabled={isSubmitting}
                style={styles.addImageButton}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={20} color={DESIGN_TOKENS.colors.primary} />
                <Text style={styles.addImageText}>
                  {selectedImages.length === 0 ? 'Add Photos (Max 5)' : 'Add More Photos'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.hintText}>
              Supported formats: JPEG, PNG, WebP. Up to 10 MB per image. Max 5 images.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  publishButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    color: DESIGN_TOKENS.colors.primary,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bodyInput: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    minHeight: 140,
    paddingVertical: 14,
  },
  attachmentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attachmentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attachmentsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  attachmentsCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  orderBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  addImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.primary,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});
