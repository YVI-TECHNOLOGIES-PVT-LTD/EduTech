import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useDocumentTypes } from '../../../../src/features/admission/hooks/useDocumentTypes';
import { useApplicationDocuments } from '../../../../src/features/admission/hooks/useApplicationDocuments';
import { useUploadDocument } from '../../../../src/features/admission/hooks/useUploadDocument';
import { documentsApi } from '../../../../src/api/documents.api';
import { DocumentStatusCard } from '../../../../src/components/admission/DocumentStatusCard';
import { DocumentType, AdmissionDocument } from '../../../../src/types/admission.types';
import { useTheme } from '../../../../src/theme';
import { DESIGN_TOKENS } from '../../../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../../../src/components/common/ParentPortalHeader';
import { ParentEmptyState } from '../../../../src/components/common/ParentEmptyState';
import { ParentLoadingSkeleton } from '../../../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function DocumentCenterScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const appId = rawId && rawId !== '[id]' ? rawId : '';

  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [uploadingTypeId, setUploadingTypeId] = useState<string | null>(null);

  // 1. Fetch Dynamic Document Requirements
  const { data: documentTypes = [], isLoading: loadingTypes } = useDocumentTypes();

  // 2. Fetch Uploaded Application Documents
  const {
    data: uploadedDocs = [],
    isLoading: loadingDocs,
    isError,
    error,
    refetch,
    isRefetching,
  } = useApplicationDocuments(appId);

  // 3. Upload Mutation
  const { mutate: uploadDoc } = useUploadDocument();

  // View Signed URL Handler
  const handleOpenSignedDoc = async (docId: string) => {
    try {
      setLoadingDocId(docId);
      const res = await documentsApi.getSignedUrl(docId);
      const url = res.signed_url || (res as any).url;

      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Unable to Open Document',
            'No supported viewer application was found on this device.',
          );
        }
      } else {
        Alert.alert(
          'Document Unavailable',
          'Could not retrieve a valid signed URL for this document.',
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to retrieve secure document link.');
    } finally {
      setLoadingDocId(null);
    }
  };

  // Upload / Replace Document Handler
  const handlePickAndUpload = async (docTypeId: string, maxMb = 10) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size === 0) {
          Alert.alert(
            'Empty File',
            'The selected file is empty (0 bytes). Please select a valid document.',
          );
          return;
        }

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > maxMb) {
          Alert.alert(
            'File Too Large',
            `The selected file is ${sizeMb.toFixed(1)}MB. Maximum allowed is ${maxMb}MB.`,
          );
          return;
        }

        const lastDot = file.name.lastIndexOf('.');
        const ext = lastDot !== -1 ? file.name.substring(lastDot).toLowerCase() : '';
        if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
          Alert.alert('Unsupported Format', 'Please select a PDF, JPG, or PNG document.');
          return;
        }

        setUploadingTypeId(docTypeId);
        uploadDoc(
          {
            applicationId: appId,
            documentTypeId: docTypeId,
            file: {
              uri: URL.createObjectURL(file),
              name: file.name,
              type: file.type || 'application/octet-stream',
              rawFile: file,
            },
          },
          {
            onSuccess: () => {
              setUploadingTypeId(null);
              Alert.alert(
                'Upload Successful',
                'Your document has been submitted for verification.',
              );
              refetch();
            },
            onError: (err) => {
              setUploadingTypeId(null);
              Alert.alert('Upload Failed', err.message || 'Failed to upload document file.');
            },
          },
        );
      };
      input.click();
      return;
    }

    // Native mobile selection: Provide direct Gallery or Files picker to avoid Google Drive redirection
    const pickFromGallery = async () => {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
        });

        if (!res.canceled && res.assets && res.assets.length > 0) {
          const asset = res.assets[0];
          const sizeMb = (asset.fileSize || 0) / (1024 * 1024);

          if (sizeMb > maxMb) {
            Alert.alert(
              'File Too Large',
              `The selected photo is ${sizeMb.toFixed(1)}MB. Maximum allowed is ${maxMb}MB.`,
            );
            return;
          }

          setUploadingTypeId(docTypeId);
          uploadDoc(
            {
              applicationId: appId,
              documentTypeId: docTypeId,
              file: {
                uri: asset.uri,
                name: asset.fileName || `document_${Date.now()}.jpg`,
                type: asset.mimeType || 'image/jpeg',
              },
            },
            {
              onSuccess: () => {
                setUploadingTypeId(null);
                Alert.alert(
                  'Upload Successful',
                  'Your document has been submitted for verification.',
                );
                refetch();
              },
              onError: (err) => {
                setUploadingTypeId(null);
                Alert.alert('Upload Failed', err.message || 'Failed to upload document file.');
              },
            },
          );
        }
      } catch (err) {
        console.warn('Gallery pick cancelled or failed', err);
      }
    };

    const pickFromFileSystem = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png'],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const sizeMb = (asset.size || 0) / (1024 * 1024);

          if (sizeMb > maxMb) {
            Alert.alert(
              'File Too Large',
              `The selected file is ${sizeMb.toFixed(1)}MB. Maximum allowed is ${maxMb}MB.`,
            );
            return;
          }

          setUploadingTypeId(docTypeId);

          uploadDoc(
            {
              applicationId: appId,
              documentTypeId: docTypeId,
              file: {
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'application/octet-stream',
              },
            },
            {
              onSuccess: () => {
                setUploadingTypeId(null);
                Alert.alert(
                  'Upload Successful',
                  'Your document has been submitted for verification.',
                );
                refetch();
              },
              onError: (err) => {
                setUploadingTypeId(null);
                Alert.alert('Upload Failed', err.message || 'Failed to upload document file.');
              },
            },
          );
        }
      } catch (err) {
        setUploadingTypeId(null);
        console.warn('Document picking cancelled or failed', err);
      }
    };

    Alert.alert(
      'Select Document Source',
      'Choose where you would like to select this document from on your device:',
      [
        {
          text: 'Device Photo Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Browse Local Files',
          onPress: pickFromFileSystem,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const isLoading = loadingTypes || loadingDocs;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Header */}
      <ParentPortalHeader
        title="Document Centre"
        subtitle="Certificates & Verification Vault"
        showBack={true}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => refetch()}
            style={[styles.refreshButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh documents"
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
      >
        {/* Info Banner */}
        <View
          style={[
            styles.vaultBanner,
            {
              backgroundColor: isDark
                ? 'rgba(81, 70, 229, 0.15)'
                : DESIGN_TOKENS.colors.primaryLight,
              borderColor: isDark ? 'rgba(81, 70, 229, 0.35)' : '#C7D2FE',
            },
          ]}
        >
          <View style={styles.bannerIconWrapper}>
            <Feather name="shield" size={20} color={DESIGN_TOKENS.colors.primary} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: isDark ? '#E0E7FF' : '#312E81' }]}>
              Verified Certificate Vault
            </Text>
            <Text style={[styles.bannerDescription, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
              Uploaded documents are reviewed by the admissions desk. You will be notified if
              replacements are needed.
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && <ParentLoadingSkeleton type="cards" />}

        {/* Error State */}
        {!isLoading && isError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(220, 38, 38, 0.15)'
                  : DESIGN_TOKENS.colors.errorLight,
                borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA',
              },
            ]}
          >
            <View style={styles.errorHeader}>
              <Feather name="alert-circle" size={20} color={DESIGN_TOKENS.colors.error} />
              <Text
                style={[
                  styles.errorTitle,
                  { color: isDark ? '#FCA5A5' : DESIGN_TOKENS.colors.error },
                ]}
              >
                Failed to load document records
              </Text>
            </View>
            <Text style={[styles.errorMessage, { color: isDark ? '#F87171' : '#991B1B' }]}>
              {error?.message || 'A network error occurred while retrieving documents.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && documentTypes.length === 0 && (
          <ParentEmptyState
            ionIcon="document-text-outline"
            title="No Documents Required"
            description="There are no specific document uploads configured for this application at this stage."
          />
        )}

        {/* Dynamic Document Cards List */}
        {!isLoading && !isError && documentTypes.length > 0 && (
          <View style={styles.documentsList}>
            {documentTypes.map((type: DocumentType) => {
              const typeId = type.document_type_id || (type as any).id;
              const uploadedDoc = uploadedDocs.find(
                (d: AdmissionDocument) => (d.document_type_id || (d as any).type_id) === typeId,
              );

              return (
                <DocumentStatusCard
                  key={typeId}
                  documentType={type}
                  uploadedDoc={uploadedDoc}
                  isUploading={uploadingTypeId === typeId}
                  isLoadingUrl={loadingDocId === uploadedDoc?.document_id}
                  onUpload={() => handlePickAndUpload(typeId, type.max_size_mb || 10)}
                  onViewSignedUrl={
                    uploadedDoc ? () => handleOpenSignedDoc(uploadedDoc.document_id) : undefined
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: DESIGN_TOKENS.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultBanner: {
    padding: 16,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(81, 70, 229, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  documentsList: {
    gap: 14,
  },
});
