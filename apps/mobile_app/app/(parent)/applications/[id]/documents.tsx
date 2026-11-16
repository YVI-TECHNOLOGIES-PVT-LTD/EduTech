import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useDocumentTypes } from '../../../../src/features/admission/hooks/useDocumentTypes';
import { useApplicationDocuments } from '../../../../src/features/admission/hooks/useApplicationDocuments';
import { useUploadDocument } from '../../../../src/features/admission/hooks/useUploadDocument';
import { documentsApi } from '../../../../src/api/documents.api';
import { DocumentStatusCard } from '../../../../src/components/admission/DocumentStatusCard';
import { DocumentType, AdmissionDocument } from '../../../../src/types/admission.types';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/atoms/Button';

export default function DocumentCenterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appId = id || '';

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
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
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

  const isLoading = loadingTypes || loadingDocs;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.iconSecondary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Document Center
            </Text>
            <Text className="text-xs font-semibold text-slate-400">
              Certificates & Verification Vault
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          accessibilityLabel="Refresh documents"
        >
          <Feather name="refresh-cw" size={18} color={colors.iconSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Info Banner */}
        <View className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-900 flex-row items-center mb-5">
          <Ionicons name="shield-checkmark" size={20} color="#4f46e5" />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              Verified Certificate Vault
            </Text>
            <Text className="text-[11px] text-indigo-800/80 dark:text-indigo-300 mt-0.5">
              Uploaded documents are reviewed by the admissions desk. You will be notified if
              replacements are needed.
            </Text>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-bold text-slate-500 mt-3">
              Loading document records...
            </Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                Failed to load documents
              </Text>
            </View>
            <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
              {error?.message || 'A network error occurred while retrieving document records.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Document Checklist Cards */}
        {!isLoading &&
          !isError &&
          documentTypes.map((docType: DocumentType) => {
            const uploaded = uploadedDocs.find(
              (d: AdmissionDocument) => d.document_type_id === docType.document_type_id,
            );

            return (
              <DocumentStatusCard
                key={docType.document_type_id}
                documentType={docType}
                uploadedDoc={uploaded}
                onViewSignedUrl={handleOpenSignedDoc}
                onUpload={(typeId) => handlePickAndUpload(typeId, docType.max_size_mb)}
                isLoadingUrl={loadingDocId === uploaded?.document_id}
                isUploading={uploadingTypeId === docType.document_type_id}
              />
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
