import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';

interface AuditLogRecord {
  id: string;
  action: string;
  module: string;
  performedBy: string;
  ipAddress: string;
  timestamp: string;
  details: string;
}

export const AuditPage: React.FC = () => {
  const dummyLogs: AuditLogRecord[] = [
    {
      id: 'log-101',
      action: 'STUDENT_ENROLLED',
      module: 'STUDENTS',
      performedBy: 'Vikram Aditya (ORG_ADMIN)',
      ipAddress: '192.168.1.45',
      timestamp: '2026-08-07 06:45:12',
      details: 'Executed Stage-1 Enrollment for Student Aarav Sharma (Grade 9-A)',
    },
    {
      id: 'log-102',
      action: 'FEE_PAYMENT_COLLECTED',
      module: 'ADMISSIONS',
      performedBy: 'Rajesh Kumar (FINANCE_OFFICER)',
      ipAddress: '192.168.1.88',
      timestamp: '2026-08-07 06:12:30',
      details: 'Collected admission fee payment ₹25,000 for Application APP-2026-043',
    },
    {
      id: 'log-103',
      action: 'ADMISSION_APPROVED',
      module: 'ADMISSIONS',
      performedBy: 'Ananya Roy (ADMISSION_OFFICER)',
      ipAddress: '192.168.1.12',
      timestamp: '2026-08-07 05:30:00',
      details: 'Approved admission decision for Application APP-2026-042',
    },
  ];

  const columns: ColumnDef<AuditLogRecord>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }: { row: { original: AuditLogRecord } }) => (
        <span className="font-mono text-[11px] text-slate-500 font-semibold">
          {row.original.timestamp}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action / Operation',
      cell: ({ row }: { row: { original: AuditLogRecord } }) => (
        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Audit Trail Details',
      cell: ({ row }: { row: { original: AuditLogRecord } }) => (
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          {row.original.details}
        </span>
      ),
    },
    {
      accessorKey: 'performedBy',
      header: 'Performed By',
      cell: ({ row }: { row: { original: AuditLogRecord } }) => (
        <div>
          <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
            {row.original.performedBy}
          </span>
          <p className="text-[10px] font-mono text-slate-400">IP: {row.original.ipAddress}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Audit Trail & Security Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          System-wide audit trail recording user operations, authorization events, and state
          mutations
        </p>
      </div>

      <EnterpriseDataTable
        title="Audit Logs"
        subtitle="Filterable audit trail of system events"
        columns={columns}
        data={dummyLogs}
        searchPlaceholder="Search audit logs by action, user or details..."
      />
    </div>
  );
};

export default AuditPage;
