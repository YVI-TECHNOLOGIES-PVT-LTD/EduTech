import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Upload,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

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
    desc: 'aadhaar_scan_v1.pdf • 1.2 MB • AI VERIFIED INSTANTLY',
    status: 'VERIFIED',
    badgeText: 'VERIFICATION SUCCESS',
    badgeType: 'success',
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate',
    mandatory: true,
    desc: 'birth_cert_scan.pdf • 2.4 MB',
    status: 'IN REVIEW',
    badgeText: 'PENDING VERIFICATION',
    badgeType: 'warning',
  },
  {
    id: 'passport_photo',
    name: "Student's Photo",
    mandatory: true,
    desc: 'Reason: Photo is too blurry. Please upload a clear passport-size photo.',
    status: 'ACTION NEEDED',
    badgeText: 'RE-UPLOAD NEEDED',
    badgeType: 'error',
  },
  {
    id: 'academic_records',
    name: 'Previous Academic Records',
    mandatory: false,
    desc: 'Last 2 years report cards (if applicable)',
    status: 'OPTIONAL',
    badgeText: 'OPTIONAL',
    badgeType: 'neutral',
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
      (d) =>
        d.mandatory && !uploadedDocs[d.id] && d.status !== 'VERIFIED' && d.status !== 'IN REVIEW',
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
            <li>• Max file size: 5 MB per PDF, JPG, or PNG</li>
            <li>• Ensure text is clearly legible</li>
          </ul>
        </div>
      </div>

      {/* Document Cards List */}
      <div className="space-y-3.5">
        {REQUIRED_DOCS.map((doc) => {
          const uploaded = uploadedDocs[doc.id];
          const isVerified = doc.status === 'VERIFIED';
          const isInReview = doc.status === 'IN REVIEW';
          const isActionNeeded = doc.status === 'ACTION NEEDED';

          return (
            <div
              key={doc.id}
              className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                isActionNeeded
                  ? 'border-red-200 bg-red-50/10'
                  : isVerified
                    ? 'border-emerald-100'
                    : 'border-gray-100'
              }`}
            >
              {/* Document Icon & Information */}
              <div className="flex items-center space-x-4 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                    isVerified
                      ? 'bg-emerald-50 text-emerald-600'
                      : isInReview
                        ? 'bg-amber-50 text-amber-600'
                        : isActionNeeded
                          ? 'bg-red-50 text-red-600'
                          : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {isVerified ? (
                    <FileCheck className="w-5 h-5" />
                  ) : isActionNeeded ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-gray-900">{doc.name}</h3>
                    {doc.mandatory && <span className="text-red-500 font-bold">*</span>}

                    {/* Status Badge */}
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isInReview
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isActionNeeded
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <p
                    className={`text-[11px] font-medium truncate ${
                      isActionNeeded ? 'text-red-600 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {uploaded?.file_name
                      ? `${uploaded.file_name} • ${uploaded.file_size}`
                      : doc.desc}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-3 shrink-0">
                {isVerified ? (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      VERIFICATION SUCCESS
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                      title="View File"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ) : isInReview ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider gap-1">
                    <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                    PENDING VERIFICATION
                  </span>
                ) : isActionNeeded ? (
                  <label className="inline-flex items-center px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 transition-colors cursor-pointer gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Re-upload File</span>
                    <input
                      type="file"
                      disabled={isReadOnly}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => onFileUpload(doc.id, e)}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <label className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/80 transition-colors cursor-pointer gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      disabled={isReadOnly}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => onFileUpload(doc.id, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
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
