import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentType, AdmissionDocument } from '../../types/admission.types';
import { useTheme } from '../../theme';

export interface DocumentStatusCardProps {
  documentType: DocumentType;
  uploadedDoc?: AdmissionDocument;
  onViewSignedUrl?: (docId: string) => void;
  onUpload?: (docTypeId: string) => void;
  isLoadingUrl?: boolean;
  isUploading?: boolean;
}

export const DocumentStatusCard: React.FC<DocumentStatusCardProps> = ({
  documentType,
  uploadedDoc,
  onViewSignedUrl,
  onUpload,
  isLoadingUrl = false,
  isUploading = false,
}) => {
  const { colors } = useTheme();

  const status: string = uploadedDoc ? uploadedDoc.verify_status || 'uploaded' : 'missing';
  const isVerified = status === 'verified';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending' || status === 'uploaded';

  const fileName = uploadedDoc?.file_name || 'Attached Certificate';
  const uploadedDate =
    uploadedDoc?.uploaded_at || uploadedDoc?.created_at
      ? new Date(uploadedDoc.uploaded_at || uploadedDoc.created_at!).toLocaleDateString()
      : undefined;

  return (
    <View
      className={`bg-white dark:bg-slate-900 rounded-3xl p-5 mb-4 border shadow-sm ${
        isRejected
          ? 'border-red-300 dark:border-red-800/80 bg-red-50/10'
          : isVerified
            ? 'border-emerald-200 dark:border-emerald-800/80'
            : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Header: Title, Mandatory Tag, Status Badge */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center flex-wrap gap-1.5 mb-1">
            <Text className="text-sm font-black text-slate-900 dark:text-slate-100">
              {documentType.document_name}
            </Text>
            {documentType.is_mandatory ? (
              <View className="bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                <Text className="text-[10px] font-extrabold uppercase text-red-600 dark:text-red-400">
                  Mandatory
                </Text>
              </View>
            ) : (
              <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-slate-500">Optional</Text>
              </View>
            )}
          </View>
          {documentType.description && (
            <Text className="text-xs text-slate-400 leading-relaxed">
              {documentType.description}
            </Text>
          )}
        </View>

        <DocumentStatusBadge status={status} />
      </View>

      {/* Rejection Reason Banner (if rejected) */}
      {isRejected && uploadedDoc?.rejection_reason && (
        <View className="bg-red-50 dark:bg-red-950/40 p-3.5 rounded-2xl border border-red-200 dark:border-red-800 my-2.5">
          <View className="flex-row items-center mb-1">
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text className="text-xs font-bold text-red-700 dark:text-red-300 ml-1.5">
              Reviewer Feedback
            </Text>
          </View>
          <Text className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            {uploadedDoc.rejection_reason}
          </Text>
        </View>
      )}

      {/* Uploaded File Info Bar */}
      {uploadedDoc && (
        <View className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex-row items-center justify-between my-2">
          <View className="flex-row items-center flex-1 mr-2">
            <Feather
              name="file-text"
              size={18}
              color={isVerified ? '#10b981' : isRejected ? '#ef4444' : '#4f46e5'}
            />
            <View className="ml-2.5 flex-1">
              <Text
                className="text-xs font-bold text-slate-800 dark:text-slate-200"
                numberOfLines={1}
              >
                {fileName}
              </Text>
              {uploadedDate && (
                <Text className="text-[10px] text-slate-400 mt-0.5">
                  Uploaded on {uploadedDate}
                </Text>
              )}
            </View>
          </View>

          {/* View Document Button */}
          {onViewSignedUrl && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onViewSignedUrl(uploadedDoc.document_id)}
              disabled={isLoadingUrl}
              className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800"
            >
              {isLoadingUrl ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <>
                  <Feather name="external-link" size={13} color="#4f46e5" />
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                    View
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Row: Upload / Replace */}
      {onUpload && (!uploadedDoc || isRejected || isPending) && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onUpload(documentType.document_type_id)}
          disabled={isUploading}
          className={`py-3 px-4 rounded-2xl border flex-row items-center justify-center space-x-2 mt-1 ${
            isRejected
              ? 'bg-red-600 border-red-600'
              : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
          }`}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={isRejected ? '#ffffff' : '#4f46e5'} />
          ) : (
            <>
              <Feather
                name={uploadedDoc ? 'refresh-cw' : 'upload-cloud'}
                size={15}
                color={isRejected ? '#ffffff' : '#4f46e5'}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  isRejected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {uploadedDoc ? 'Re-upload / Replace Document' : 'Upload Document'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};
