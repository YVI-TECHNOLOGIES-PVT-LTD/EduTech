import React, { useState } from 'react';
import { AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { DocumentUploadCard } from '../../components/DocumentUploadCard';

interface ParentDocumentsStepProps {
  uploadedDocs: Record<string, { file_name: string; file_size: string }>;
  onFileUpload: (docType: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDoc: (docType: string) => void;
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

const REQUIRED_DOCS = [
  {
    id: 'aadhaar_card',
    name: "Student's Aadhaar Card",
    mandatory: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSizeMb: 5,
    hint: 'PDF / JPG / PNG • Max 5 MB',
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate',
    mandatory: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSizeMb: 5,
    hint: 'PDF / JPG / PNG • Max 5 MB',
  },
  {
    id: 'passport_photo',
    name: "Student's Photo",
    mandatory: true,
    accept: '.jpg,.jpeg,.png',
    maxSizeMb: 5,
    hint: 'JPG / PNG • Max 5 MB',
  },
  {
    id: 'academic_records',
    name: 'Previous Academic Records',
    mandatory: false,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSizeMb: 5,
    hint: 'PDF / JPG / PNG • Max 5 MB (Optional)',
  },
];

export const ParentDocumentsStep: React.FC<ParentDocumentsStepProps> = ({
  uploadedDocs,
  onFileUpload,
  onRemoveDoc,
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    const missingMandatory = REQUIRED_DOCS.filter(
      (d) => d.mandatory && !uploadedDocs[d.id],
    );
    if (missingMandatory.length > 0) {
      setError(`Please upload required document: ${missingMandatory[0].name}`);
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

      {/* Document Upload Cards List */}
      <div className="space-y-3.5">
        {REQUIRED_DOCS.map((doc) => (
          <DocumentUploadCard
            key={doc.id}
            id={doc.id}
            name={doc.name}
            mandatory={doc.mandatory}
            hint={doc.hint}
            accept={doc.accept}
            maxSizeMb={doc.maxSizeMb}
            uploadedDoc={uploadedDocs[doc.id]}
            onFileUpload={(e) => onFileUpload(doc.id, e)}
            onRemoveDoc={() => onRemoveDoc(doc.id)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>

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
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl"
        >
          <span>Next Step: Fee Payment</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
