import React, { useState } from 'react';
import { useActiveAdmissionApplication } from '../../hooks/useActiveAdmissionApplication';
import {
  useGetDocumentTypesQuery,
  useGetApplicationDocumentsQuery,
  useUploadAdmissionDocumentMutation,
  useDeleteAdmissionDocumentMutation,
  useLazyGetDocumentSignedUrlQuery,
  type DocumentResponseDto,
  type DocumentTypeDto,
} from '@/shared/api/admission.api';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentVerificationCard } from '../../components/DocumentVerificationCard';
import { AlertCircle, Plus, RefreshCw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatFileSize(bytes?: number | null): string {
  if (!bytes || isNaN(bytes)) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeDocStatus(status?: string): string {
  if (!status) return 'NOT_UPLOADED';
  const s = status.toLowerCase();
  if (s === 'verified' || s === 'approved') return 'VERIFIED';
  if (s === 'rejected') return 'REJECTED';
  if (s === 'resubmission_requested' || s === 'correction_required') return 'ACTION NEEDED';
  if (s === 'pending' || s === 'under_review' || s === 'in_review') return 'IN REVIEW';
  return status.toUpperCase();
}

export function ParentDocumentCenterPage() {
  const navigate = useNavigate();
  const {
    activeApplication,
    activeApplicationId,
    applications,
    setActiveApplicationId,
    hasMultiple,
    studentName,
    appNumber,
    gradeApplied,
    isLoading: isAppLoading,
    error: appError,
    refetch: refetchApps,
  } = useActiveAdmissionApplication();

  const { data: docTypes = [], isLoading: isDocTypesLoading } = useGetDocumentTypesQuery(
    activeApplicationId ? { application_id: activeApplicationId } : undefined,
  );

  const {
    data: uploadedDocs = [],
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useGetApplicationDocumentsQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  const [uploadDoc, { isLoading: isUploading }] = useUploadAdmissionDocumentMutation();
  const [deleteDoc] = useDeleteAdmissionDocumentMutation();
  const [getSignedUrl] = useLazyGetDocumentSignedUrlQuery();

  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fallback default checklist requirements if backend document_types table is empty
  const defaultDocRequirements: Partial<DocumentTypeDto>[] = [
    {
      document_type_id: 'doc_type_birth_cert',
      document_name: "Student's Birth Certificate",
      description: 'Government-issued birth certificate copy',
      is_mandatory: true,
    },
    {
      document_type_id: 'doc_type_aadhaar',
      document_name: "Student's Aadhaar / ID Card",
      description: 'Aadhaar Card or Passport copy',
      is_mandatory: true,
    },
    {
      document_type_id: 'doc_type_photo',
      document_name: 'Passport Size Photograph',
      description: 'Recent color photograph (JPG/PNG)',
      is_mandatory: true,
    },
    {
      document_type_id: 'doc_type_tc',
      document_name: 'Transfer Certificate (TC)',
      description: 'Previous school leaving certificate',
      is_mandatory: false,
    },
  ];

  const effectiveDocTypes: (DocumentTypeDto | Partial<DocumentTypeDto>)[] =
    docTypes && docTypes.length > 0 ? docTypes : defaultDocRequirements;

  const handleFileUpload = async (docTypeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeApplicationId) return;

    setActionError(null);

    if (file.size > 10 * 1024 * 1024) {
      setActionError('File size exceeds maximum allowed limit of 10MB.');
      return;
    }

    setUploadingDocId(docTypeId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type_id', docTypeId);
      formData.append('application_id', activeApplicationId);

      await uploadDoc({ applicationId: activeApplicationId, formData }).unwrap();
      refetchDocs();
      refetchApps();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setActionError(
        err?.data?.message || err?.message || 'Failed to upload document. Please try again.',
      );
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleRemoveDoc = async (documentId: string) => {
    if (!documentId || !activeApplicationId) return;
    setActionError(null);
    try {
      await deleteDoc({ documentId, applicationId: activeApplicationId }).unwrap();
      refetchDocs();
      refetchApps();
    } catch (err: any) {
      console.error('Failed to remove document:', err);
      setActionError(
        err?.data?.message || err?.message || 'Failed to remove document. Please try again.',
      );
    }
  };

  const handleViewDoc = async (documentId: string) => {
    if (!documentId) return;
    try {
      const res = await getSignedUrl(documentId).unwrap();
      if (res?.signed_url) {
        window.open(res.signed_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to get signed download URL:', err);
    }
  };

  if (isAppLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Loading document vault...</p>
        </div>
      </PageContainer>
    );
  }

  if (appError) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load applications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve your admission applications. Please try again.
            </p>
          </div>
          <Button
            onClick={() => refetchApps()}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!activeApplication) {
    return (
      <PageContainer variant="default">
        <PageHeader
          title="Document Center & Verification Vault"
          description="Manage student birth certificates, Aadhaar cards, report cards, and verification clearance."
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
            >
              Admission Self-Service
            </Badge>
          }
        />
        <EmptyState
          title="No Admission Applications Found"
          description="You need an active admission application to upload verification certificates."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Application
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Document Center & Verification Vault"
        description="Manage student birth certificates, Aadhaar cards, report cards, and verification clearance."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Admission Self-Service
          </Badge>
        }
        actions={
          <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <span className="text-[10px] font-bold text-muted-foreground">ACTIVE APP:</span>
            <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {appNumber}
            </span>
          </div>
        }
      />

      {/* Multi-Application Selector Banner (if parent has multiple applications) */}
      {hasMultiple && (
        <div className="p-4 bg-muted/40 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Multiple Applications Registered</p>
              <p className="text-[11px] text-muted-foreground">
                Currently managing documents for{' '}
                <span className="font-bold text-foreground">{studentName}</span> ({gradeApplied}).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-muted-foreground shrink-0">
              Switch Child:
            </label>
            <select
              value={activeApplicationId}
              onChange={(e) => setActiveApplicationId(e.target.value)}
              aria-label="Select Active Admission Application"
              className="bg-card text-foreground text-xs font-bold px-3 py-1.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            >
              {applications.map((app) => {
                const name =
                  app.student_name ||
                  (app.leads
                    ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                    : app.lead
                      ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                      : 'Applicant');
                const num =
                  app.application_number ||
                  app.applicationNumber ||
                  app.application_id?.slice(0, 8);
                const id = app.application_id || app.id;
                return (
                  <option key={id} value={id}>
                    {name} ({num})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Submitted Certificates Grid */}
      <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
        <SectionHeader
          title={`Verification Documents Vault (${uploadedDocs.length} Uploaded)`}
          description="Uploaded certificates are securely audited by the school admission desk."
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  refetchDocs();
                  refetchApps();
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                SECURE VAULT
              </span>
            </div>
          }
        />

        {isDocsLoading || isDocTypesLoading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-semibold">
              Updating documents list...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {effectiveDocTypes.map((typeDef) => {
              const docTypeId = typeDef.document_type_id || '';
              const docTypeName = typeDef.document_name || 'Verification Document';
              const isMandatory = typeDef.is_mandatory ?? true;
              const hintText = typeDef.description || 'Upload official document scan (PDF/JPG/PNG)';

              // Match uploaded record against this requirement
              const matchedDoc = uploadedDocs.find((doc: DocumentResponseDto) => {
                if (doc.document_type_id && doc.document_type_id === docTypeId) return true;
                if (
                  doc.document_type_name &&
                  doc.document_type_name.toLowerCase() === docTypeName.toLowerCase()
                )
                  return true;
                if (
                  doc.document_types?.document_name &&
                  doc.document_types.document_name.toLowerCase() === docTypeName.toLowerCase()
                )
                  return true;
                return false;
              });

              const uploadedInfo = matchedDoc
                ? {
                    file_name: matchedDoc.original_file_name || `${docTypeName}.pdf`,
                    file_size: formatFileSize(matchedDoc.file_size),
                    status: normalizeDocStatus(matchedDoc.verify_status),
                    reason: matchedDoc.verification_remarks || undefined,
                  }
                : undefined;

              return (
                <DocumentVerificationCard
                  key={docTypeId || docTypeName}
                  docKey={docTypeId || docTypeName}
                  name={docTypeName}
                  mandatory={isMandatory}
                  hint={hintText}
                  uploaded={uploadedInfo}
                  onUpload={(e) => handleFileUpload(docTypeId, e)}
                  onRemove={matchedDoc ? () => handleRemoveDoc(matchedDoc.document_id) : undefined}
                  onView={matchedDoc ? () => handleViewDoc(matchedDoc.document_id) : undefined}
                />
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

export default ParentDocumentCenterPage;
