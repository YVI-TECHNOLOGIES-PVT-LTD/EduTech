import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Sparkles } from 'lucide-react';
import { useGetLeadsQuery, LeadRecord } from '@/shared/api/crm.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';
import { Button } from '@/components/ui/button';
import { FEATURE_FLAGS } from '@/config/features';

export const LeadsListTab: React.FC = () => {
  const { data: leads, isLoading } = useGetLeadsQuery();

  const dummyLeads: LeadRecord[] = [
    {
      id: 'lead-1',
      leadNumber: 'LEAD-2026-001',
      studentName: 'Aarav Sharma',
      parentName: 'Ramesh Sharma',
      email: 'ramesh.sharma@example.com',
      phone: '+91 98765 11111',
      gradeApplyingFor: 'Grade 9',
      status: 'CAMPUS_VISITED',
      source: 'Website Inquiry',
      aiScore: 88,
      createdAt: '2026-08-01',
    },
    {
      id: 'lead-2',
      leadNumber: 'LEAD-2026-002',
      studentName: 'Ananya Verma',
      parentName: 'Sanjay Verma',
      email: 'sanjay.verma@example.com',
      phone: '+91 98765 22222',
      gradeApplyingFor: 'Grade 11',
      status: 'COUNSELLING_SCHEDULED',
      source: 'Education Fair',
      aiScore: 92,
      createdAt: '2026-08-03',
    },
    {
      id: 'lead-3',
      leadNumber: 'LEAD-2026-003',
      studentName: 'Kabir Mehta',
      parentName: 'Alok Mehta',
      email: 'alok.mehta@example.com',
      phone: '+91 98765 33333',
      gradeApplyingFor: 'Grade 10',
      status: 'NEW',
      source: 'Google Ads',
      aiScore: 65,
      createdAt: '2026-08-05',
    },
  ];

  const tableData = leads && leads.length > 0 ? leads : dummyLeads;

  const columns: ColumnDef<LeadRecord>[] = [
    {
      accessorKey: 'leadNumber',
      header: 'Lead Ref #',
      cell: ({ row }: { row: { original: LeadRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.leadNumber}</span>
      ),
    },
    {
      accessorKey: 'studentName',
      header: 'Student & Parent',
      cell: ({ row }: { row: { original: LeadRecord } }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            {row.original.studentName}
          </span>
          <p className="text-[11px] text-slate-400">Parent: {row.original.parentName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'gradeApplyingFor',
      header: 'Target Grade',
      cell: ({ row }: { row: { original: LeadRecord } }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.gradeApplyingFor}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Pipeline Status',
      cell: ({ row }: { row: { original: LeadRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
    ...(FEATURE_FLAGS.AI_LEAD_SCORING
      ? [
          {
            accessorKey: 'aiScore' as keyof LeadRecord,
            header: 'AI Lead Score',
            cell: ({ row }: { row: { original: LeadRecord } }) => {
              const score = row.original.aiScore || 70;
              const isHigh = score >= 80;

              return (
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Sparkles size={14} className={isHigh ? 'text-amber-500' : 'text-slate-400'} />
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] ${
                      isHigh
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {score} / 100
                  </span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: 'createdAt',
      header: 'Inquiry Date',
      cell: ({ row }: { row: { original: LeadRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.createdAt}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Capture New Lead Inquiry
        </Button>
      </div>

      <EnterpriseDataTable
        title="Inbound Lead Pipeline"
        subtitle="Manage prospective student inquiries, counselling notes, and AI conversion scores"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        searchPlaceholder="Search leads by student name, parent or phone..."
      />
    </div>
  );
};
