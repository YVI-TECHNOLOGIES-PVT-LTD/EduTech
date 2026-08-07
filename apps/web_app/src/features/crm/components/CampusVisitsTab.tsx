import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, Plus } from 'lucide-react';
import { useGetCampusVisitsQuery, CampusVisitRecord } from '@/shared/api/crm.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';
import { Button } from '@/components/ui/button';

export const CampusVisitsTab: React.FC = () => {
  const { data: visits, isLoading } = useGetCampusVisitsQuery();

  const dummyVisits: CampusVisitRecord[] = [
    {
      id: 'visit-1',
      leadId: 'LEAD-2026-001',
      visitorName: 'Ramesh Sharma & Aarav',
      scheduledDate: '2026-08-08',
      scheduledTime: '10:30 AM',
      status: 'SCHEDULED',
      counsellorName: 'Meenakshi Sundaram',
    },
    {
      id: 'visit-2',
      leadId: 'LEAD-2026-002',
      visitorName: 'Sanjay Verma & Ananya',
      scheduledDate: '2026-08-07',
      scheduledTime: '02:00 PM',
      status: 'COMPLETED',
      counsellorName: 'Vikram Aditya',
    },
  ];

  const tableData = visits && visits.length > 0 ? visits : dummyVisits;

  const columns: ColumnDef<CampusVisitRecord>[] = [
    {
      accessorKey: 'leadId',
      header: 'Lead Ref',
      cell: ({ row }: { row: { original: CampusVisitRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.leadId}</span>
      ),
    },
    {
      accessorKey: 'visitorName',
      header: 'Visitors',
      cell: ({ row }: { row: { original: CampusVisitRecord } }) => (
        <span className="font-bold text-slate-900 dark:text-white">{row.original.visitorName}</span>
      ),
    },
    {
      accessorKey: 'scheduledDate',
      header: 'Date & Time',
      cell: ({ row }: { row: { original: CampusVisitRecord } }) => (
        <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
          <Calendar size={13} className="text-slate-400" />
          <span>
            {row.original.scheduledDate} ({row.original.scheduledTime})
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'counsellorName',
      header: 'Assigned Counsellor',
      cell: ({ row }: { row: { original: CampusVisitRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.counsellorName}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Visit Status',
      cell: ({ row }: { row: { original: CampusVisitRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Schedule Campus Visit
        </Button>
      </div>

      <EnterpriseDataTable
        title="Scheduled Campus Visits"
        subtitle="Track prospective student campus tours and in-person counselling appointments"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
