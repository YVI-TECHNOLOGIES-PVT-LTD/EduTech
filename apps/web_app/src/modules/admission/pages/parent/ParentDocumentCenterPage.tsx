import React, { useState } from 'react';
import { useApplicationList } from '../../hooks/useApplication';
import { PageContainer, PageHeader, SectionHeader } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DocumentVerificationCard } from '../../components/DocumentVerificationCard';

export function ParentDocumentCenterPage() {
  const { applications, isLoading } = useApplicationList({ limit: 10 }, { mine: true });

  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { file_name: string; file_size: string; status: string; reason?: string }>
  >({
    birth_cert: { file_name: 'birth_cert_official.pdf', file_size: '1.8 MB', status: 'VERIFIED' },
    aadhaar_card: { file_name: 'aadhaar_card_scan.pdf', file_size: '1.2 MB', status: 'VERIFIED' },
    transfer_cert: {
      file_name: 'transfer_cert_school.pdf',
      file_size: '2.4 MB',
      status: 'IN REVIEW',
    },
    photo: {
      file_name: 'passport_photo_v1.jpg',
      file_size: '850 KB',
      status: 'ACTION NEEDED',
      reason: 'Photograph is unclear. Please upload a clear color photo.',
    },
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
      mandatory: true,
      hint: 'Government-issued birth certificate',
    },
    {
      key: 'aadhaar_card',
      name: "Student's Aadhaar / ID Card",
      mandatory: true,
      hint: 'Aadhaar Card or Passport copy',
    },
    {
      key: 'transfer_cert',
      name: 'Transfer Certificate (TC)',
      mandatory: false,
      hint: 'Previous school leaving certificate',
    },
    {
      key: 'photo',
      name: 'Passport Size Photograph',
      mandatory: true,
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
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Parent Self-Service
          </Badge>
        }
        actions={
          primaryApp && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-muted-foreground">ACTIVE APP:</span>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {primaryApp.application_number || primaryApp.id || 'APP-2026-00368'}
              </span>
            </div>
          )
        }
      />

      {/* Submitted Certificates Grid */}
      <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
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

            return (
              <DocumentVerificationCard
                key={def.key}
                docKey={def.key}
                name={def.name}
                mandatory={def.mandatory}
                hint={def.hint}
                uploaded={uploaded}
                onUpload={(e) => handleFileUpload(def.key, e)}
                onRemove={uploaded ? () => handleRemoveDoc(def.key) : undefined}
                onView={
                  uploaded
                    ? () => alert(`Viewing document: ${uploaded.file_name} (${uploaded.status})`)
                    : undefined
                }
              />
            );
          })}
        </div>
      </Card>
    </PageContainer>
  );
}

export default ParentDocumentCenterPage;
