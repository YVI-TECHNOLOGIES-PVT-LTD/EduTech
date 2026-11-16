import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { DocumentType } from '../../../../types/admission.types';
import { useTheme } from '../../../../theme';

export interface WizardStep5DocumentsProps {
  documentTypes: DocumentType[];
  attachedFiles: Record<string, { uri: string; name: string; type: string; size?: number }>;
  onAttachFile: (
    docTypeId: string,
    file: { uri: string; name: string; type: string; size?: number },
  ) => void;
  onRemoveFile: (docTypeId: string) => void;
}

const DEFAULT_DOC_TYPES: DocumentType[] = [
  {
    document_type_id: 'doc_type_birth_cert',
    document_name: 'Birth Certificate',
    description: 'Official birth certificate issued by municipal authority',
    is_mandatory: true,
    max_size_mb: 10,
    allowed_formats: ['PDF', 'JPG', 'PNG'],
  },
  {
    document_type_id: 'doc_type_photo',
    document_name: 'Student Passport Photo',
    description: 'Recent passport size photo with clear white background',
    is_mandatory: true,
    max_size_mb: 5,
    allowed_formats: ['JPG', 'PNG'],
  },
  {
    document_type_id: 'doc_type_report_card',
    document_name: 'Previous Academic Report Card',
    description: 'Latest mark sheet or progress report from previous school',
    is_mandatory: false,
    max_size_mb: 10,
    allowed_formats: ['PDF', 'JPG', 'PNG'],
  },
  {
    document_type_id: 'doc_type_address_proof',
    document_name: 'Proof of Residence',
    description: 'Utility bill, Aadhaar, or rental agreement',
    is_mandatory: false,
    max_size_mb: 10,
    allowed_formats: ['PDF', 'JPG', 'PNG'],
  },
];

export const WizardStep5Documents: React.FC<WizardStep5DocumentsProps> = ({
  documentTypes = [],
  attachedFiles = {},
  onAttachFile,
  onRemoveFile,
}) => {
  const { colors } = useTheme();

  const typesList = documentTypes.length > 0 ? documentTypes : DEFAULT_DOC_TYPES;

  const handlePickDocument = async (docTypeId: string, maxMb = 10) => {
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

        onAttachFile(docTypeId, {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        });
      }
    } catch (err) {
      console.warn('Document picking cancelled or failed', err);
    }
  };

  return (
    <View className="space-y-4">
      {/* Section Header */}
      <View className="mb-2">
        <Text className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Document Uploads
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Attach required certificates for admission verification (PDF or Image under 10MB)
        </Text>
      </View>

      {/* Document Checklist Items */}
      {typesList.map((docType) => {
        const attached = attachedFiles[docType.document_type_id];

        return (
          <View
            key={docType.document_type_id}
            className={`p-4 rounded-3xl border mb-3 shadow-sm ${
              attached
                ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center flex-wrap gap-1.5 mb-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {docType.document_name}
                  </Text>
                  {docType.is_mandatory ? (
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
                {docType.description && (
                  <Text className="text-xs text-slate-400 leading-relaxed">
                    {docType.description}
                  </Text>
                )}
              </View>

              {/* Status Indicator */}
              {attached ? (
                <View className="flex-row items-center bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full">
                  <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                  <Text className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-200 ml-1">
                    Attached
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  <Ionicons name="time" size={14} color="#f59e0b" />
                  <Text className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 ml-1">
                    Pending
                  </Text>
                </View>
              )}
            </View>

            {/* Attached File Bar or Upload Button */}
            {attached ? (
              <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 mt-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <Feather name="file-text" size={18} color="#10b981" />
                  <Text
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 ml-2 flex-1"
                    numberOfLines={1}
                  >
                    {attached.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onRemoveFile(docType.document_type_id)}
                  accessibilityLabel={`Remove ${docType.document_name}`}
                  className="p-1"
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePickDocument(docType.document_type_id, docType.max_size_mb)}
                accessibilityRole="button"
                accessibilityLabel={`Upload ${docType.document_name}`}
                className="mt-2 py-3 px-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex-row items-center justify-center space-x-2"
              >
                <Feather name="upload-cloud" size={16} color="#4f46e5" />
                <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">
                  Select Document File
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};
