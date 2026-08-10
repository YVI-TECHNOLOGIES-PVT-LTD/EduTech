import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useGetApplicationsQuery, ApplicationRecord } from '@/shared/api/admission.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';
import { Button } from '@/components/ui/button';

export const ApplicationsListTab: React.FC = () => {
  const { data: apps, isLoading } = useGetApplicationsQuery();

  const dummyApps: any[] = [
    {
      id: 'app-1',
      applicationNumber: 'APP-2026-042',
      applicantName: 'Aarav Sharma',
      parentName: 'Ramesh Sharma',
      gradeApplyingFor: 'Grade 9',
      status: 'DOCUMENT_VERIFIED',
      submissionDate: '2026-08-02',
      assessmentScore: 85,
    },
    {
      id: 'app-2',
      applicationNumber: 'APP-2026-043',
      applicantName: 'Ananya Verma',
      parentName: 'Sanjay Verma',
      gradeApplyingFor: 'Grade 11',
      status: 'APPROVED',
      submissionDate: '2026-08-04',
      assessmentScore: 90,
      feePaidAmount: 25000,
    },
    {
      id: 'app-3',
      applicationNumber: 'APP-2026-044',
      applicantName: 'Kabir Mehta',
      parentName: 'Alok Mehta',
      gradeApplyingFor: 'Grade 10',
      status: 'SUBMITTED',
      submissionDate: '2026-08-06',
    },
  ];

  const tableData = apps && apps.length > 0 ? apps : dummyApps;

  const columns: ColumnDef<ApplicationRecord>[] = [
    {
      accessorKey: 'applicationNumber',
      header: 'Application #',
      cell: ({ row }: { row: { original: ApplicationRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">
          {row.original.applicationNumber}
        </span>
      ),
    },
    {
      accessorKey: 'applicantName',
      header: 'Applicant Name',
      cell: ({ row }: { row: { original: ApplicationRecord } }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            {row.original.applicantName}
          </span>
          <p className="text-[11px] text-slate-400">Parent: {row.original.parentName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'gradeApplyingFor',
      header: 'Target Grade',
      cell: ({ row }: { row: { original: ApplicationRecord } }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.gradeApplyingFor}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Pipeline Status',
      cell: ({ row }: { row: { original: ApplicationRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
    {
      accessorKey: 'submissionDate',
      header: 'Submitted On',
      cell: ({ row }: { row: { original: ApplicationRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.submissionDate}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Create New Application
        </Button>
      </div>

      <EnterpriseDataTable
        title="Admission Applications"
        subtitle="Review, verify documents, and process formal admission applications"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        searchPlaceholder="Search applications by applicant name or number..."
      />
    </div>
  );
};
