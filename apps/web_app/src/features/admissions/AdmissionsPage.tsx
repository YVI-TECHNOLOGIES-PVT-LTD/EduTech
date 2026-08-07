import React, { useState } from 'react';
import { FileText, FileCheck, ClipboardCheck, CreditCard } from 'lucide-react';
import { ApplicationsListTab } from './components/ApplicationsListTab';
import { DocumentVerificationTab } from './components/DocumentVerificationTab';
import { AssessmentsTab } from './components/AssessmentsTab';
import { FeePaymentTab } from './components/FeePaymentTab';
import { cn } from '@/lib/utils';

export const AdmissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'documents' | 'assessments' | 'fees'>(
    'applications',
  );

  const tabs = [
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'documents', label: 'Document Verification', icon: FileCheck },
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
    { id: 'fees', label: 'Fee Payment', icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admissions Pipeline
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Process student applications, verify submitted documents, record assessment scores, and
          collect fees
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 border-b-2 px-1 pb-3 text-xs font-bold transition-all',
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'applications' && <ApplicationsListTab />}
        {activeTab === 'documents' && <DocumentVerificationTab />}
        {activeTab === 'assessments' && <AssessmentsTab />}
        {activeTab === 'fees' && <FeePaymentTab />}
      </div>
    </div>
  );
};

export default AdmissionsPage;
