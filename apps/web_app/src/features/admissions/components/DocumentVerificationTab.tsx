import React from 'react';
import { FileCheck, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const DocumentVerificationTab: React.FC = () => {
  const documents = [
    {
      id: 'doc-1',
      appNo: 'APP-2026-042',
      name: 'Birth Certificate',
      student: 'Aarav Sharma',
      status: 'PENDING',
    },
    {
      id: 'doc-2',
      appNo: 'APP-2026-042',
      name: 'Previous School Marksheet',
      student: 'Aarav Sharma',
      status: 'VERIFIED',
    },
    {
      id: 'doc-3',
      appNo: 'APP-2026-043',
      name: 'Transfer Certificate (TC)',
      student: 'Ananya Verma',
      status: 'VERIFIED',
    },
  ];

  const handleVerify = (docId: string) => {
    toast.success(`Document #${docId} verified successfully`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground">
        <h3 className="text-base font-bold text-foreground">Document Verification Queue</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Review uploaded birth certificates, transcripts, and transfer certificates
        </p>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-600">{doc.appNo}</span>
                  <span className="text-xs font-bold text-foreground">{doc.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Student: {doc.student}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye size={14} className="mr-1" />
                  View Doc
                </Button>
                <Button
                  onClick={() => handleVerify(doc.id)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Verify
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
