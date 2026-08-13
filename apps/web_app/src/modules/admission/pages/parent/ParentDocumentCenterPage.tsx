import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApplicationList } from '../../hooks/useApplication';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ParentDocumentCenterPage() {
  const { applications, isLoading, refetch } = useApplicationList({ limit: 10 }, { mine: true });

  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { file_name: string; file_size: string; status: string }>
  >({
    birth_cert: { file_name: 'birth_cert_official.pdf', file_size: '1.8 MB', status: 'VERIFIED' },
    aadhaar_card: { file_name: 'aadhaar_card_scan.pdf', file_size: '1.2 MB', status: 'VERIFIED' },
    transfer_cert: {
      file_name: 'transfer_cert_school.pdf',
      file_size: '2.4 MB',
      status: 'IN REVIEW',
    },
    photo: { file_name: 'passport_photo_v1.jpg', file_size: '850 KB', status: 'VERIFIED' },
  });

  const handleFileUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds maximum allowed limit of 5MB.');
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedDocs((prev) => ({
      ...prev,
      [docKey]: { file_name: file.name, file_size: `${sizeMb} MB`, status: 'IN REVIEW' },
    }));
  };

  const handleRemoveDoc = (docKey: string) => {
    setUploadedDocs((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading document vault...</p>
        </div>
      </PageContainer>
    );
  }

  const primaryApp = applications[0] || null;

  const docRequirementDefs = [
    {
      key: 'birth_cert',
      name: "Student's Birth Certificate",
      req: 'Mandatory',
      hint: 'Government-issued birth certificate',
    },
    {
      key: 'aadhaar_card',
      name: "Student's Aadhaar / ID Card",
      req: 'Mandatory',
      hint: 'Aadhaar Card or Passport copy',
    },
    {
      key: 'transfer_cert',
      name: 'Transfer Certificate (TC)',
      req: 'Optional',
      hint: 'Previous school leaving certificate',
    },
    {
      key: 'photo',
      name: 'Passport Size Photograph',
      req: 'Mandatory',
      hint: 'Recent color photograph (JPG/PNG)',
    },
  ];

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Document Center & Verification Vault"
        description="Manage student birth certificates, Aadhaar cards, report cards, and verification clearance."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-indigo-600 border-indigo-200"
          >
            Parent Self-Service
          </Badge>
        }
        actions={
          primaryApp && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-slate-400">ACTIVE APP:</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {primaryApp.application_number || primaryApp.id || 'APP-2026-00368'}
              </span>
            </div>
          )
        }
      />

      {/* Submitted Certificates Grid */}
      <Card className="p-6 rounded-3xl border-slate-200/80 dark:border-border shadow-xs space-y-6">
        <SectionHeader
          title="Verification Documents Vault"
          description="Uploaded certificates are securely audited by the school admission desk."
          action={
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              SECURE VAULT
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-4">
          {docRequirementDefs.map((def) => {
            const uploaded = uploadedDocs[def.key];
            const isVerified = uploaded?.status === 'VERIFIED';

            return (
              <div
                key={def.key}
                className="p-5 rounded-2xl border border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-800">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {def.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">({def.req})</span>
                    </div>
                    {uploaded ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                        {uploaded.file_name} • {uploaded.file_size}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {def.hint}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-border">
                  {uploaded ? (
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {uploaded.status}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-muted rounded-full">
                      NOT UPLOADED
                    </span>
                  )}

                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(def.key, e)}
                        className="hidden"
                      />
                      <span className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1.5 shadow-sm">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploaded ? 'Replace' : 'Upload'}</span>
                      </span>
                    </label>

                    {uploaded && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(def.key)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </PageContainer>
  );
}

export default ParentDocumentCenterPage;
