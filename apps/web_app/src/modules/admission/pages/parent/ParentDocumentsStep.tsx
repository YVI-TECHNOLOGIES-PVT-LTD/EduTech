import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { DocumentUploadCard } from '../../components/DocumentUploadCard';
import { admissionApi } from '../../admission.api';

interface ParentDocumentsStepProps {
  applicationId?: string;
  orgId?: string;
  schoolId?: string;
  uploadedDocs: Record<string, { file_name: string; file_size: string }>;
  selectedFiles: Record<string, File>;
  onFileUpload: (docType: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDoc: (docType: string) => void;
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

interface DocumentTypeItem {
  id: string;
  name: string;
  mandatory: boolean;
  accept: string;
  maxSizeMb: number;
  hint: string;
}

export const ParentDocumentsStep: React.FC<ParentDocumentsStepProps> = ({
  applicationId,
  orgId,
  schoolId,
  uploadedDocs,
  selectedFiles,
  onFileUpload,
  onRemoveDoc,
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const [docTypes, setDocTypes] = useState<DocumentTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentTypes = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params: any = {};
      if (applicationId) {
        params.application_id = applicationId;
      } else if (orgId || schoolId) {
        params.org_id = orgId || schoolId;
      }
      const res = await admissionApi.getDocumentTypes(params);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDocTypes(
          res.data.map((dt: any) => {
            const isPhoto =
              dt.document_name.toLowerCase().includes('photo') ||
              dt.document_name.toLowerCase().includes('passport');
            return {
              id: dt.document_type_id,
              name: dt.document_name,
              mandatory: dt.is_mandatory,
              accept: isPhoto ? '.jpg,.jpeg,.png' : '.pdf,.jpg,.jpeg,.png',
              maxSizeMb: 5,
              hint: `${isPhoto ? 'JPG / PNG' : 'PDF / JPG / PNG'} • Max 5 MB${dt.is_mandatory ? '' : ' (Optional)'}`,
            };
          }),
        );
      } else {
        setDocTypes([]);
      }
    } catch (err: any) {
      setFetchError('Failed to load required document catalogue from school. Please click retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, [applicationId, orgId, schoolId]);

  const handleProceed = () => {
    const missingOrReselect = docTypes.filter(
      (d) => d.mandatory && (!selectedFiles[d.id] || !uploadedDocs[d.id]),
    );
    if (missingOrReselect.length > 0) {
      const targetDoc = missingOrReselect[0];
      const actionLabel = !uploadedDocs[targetDoc.id]
        ? 'upload required document'
        : 're-select file binary before proceeding';
      setError(`Please ${actionLabel}: ${targetDoc.name}`);
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
          <span>PORTAL</span>
          <span>&gt;</span>
          <span>STEP 05</span>
          <span>&gt;</span>
          <span>UPLOAD DOCUMENTS</span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
          Upload Required Documents
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Please provide clear scans or photographs of the original documents mentioned below.
        </p>
      </div>

      {/* Guidelines Banner */}
      <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100/80 flex items-start space-x-3.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
          !
        </div>
        <div className="space-y-1 text-xs text-amber-950">
          <h3 className="font-extrabold">File Upload Guidelines</h3>
          <ul className="space-y-0.5 text-amber-900 font-medium text-[11px]">
            <li>• Max file size: 5 MB per PDF, JPG, or PNG file</li>
            <li>• Ensure document text and photograph are clearly legible</li>
            <li>• Uploaded files will undergo security scanning and school desk verification</li>
          </ul>
        </div>
      </div>

      {/* Dynamic Document Types Catalogue */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 rounded-2xl border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-gray-500">
            Loading document checklist from catalogue...
          </p>
        </div>
      ) : fetchError ? (
        <div className="p-6 bg-red-50/60 rounded-2xl border border-red-100 flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center space-x-2 text-red-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{fetchError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocumentTypes}
            className="flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 border-red-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Catalogue Loading</span>
          </Button>
        </div>
      ) : docTypes.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500">
            No document types configured for this admission cycle.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {docTypes.map((doc) => {
            const isUploaded = !!uploadedDocs[doc.id];
            const hasFileObj = !!selectedFiles[doc.id];
            const isReselectRequired = isUploaded && !hasFileObj;

            return (
              <DocumentUploadCard
                key={doc.id}
                id={doc.id}
                name={doc.name}
                mandatory={doc.mandatory}
                hint={doc.hint}
                accept={doc.accept}
                maxSizeMb={doc.maxSizeMb}
                uploadedDoc={uploadedDocs[doc.id]}
                isReselectRequired={isReselectRequired}
                onFileUpload={(e) => onFileUpload(doc.id, e)}
                onRemoveDoc={() => onRemoveDoc(doc.id)}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>

        <span className="text-xs font-bold text-gray-400">Draft Autosaved</span>

        <Button
          onClick={handleProceed}
          disabled={loading || !!fetchError}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl disabled:opacity-50"
        >
          <span>Next Step: Fee Payment</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
