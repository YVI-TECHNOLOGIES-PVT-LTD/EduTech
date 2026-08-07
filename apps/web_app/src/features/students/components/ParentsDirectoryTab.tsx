import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useGetParentsQuery, ParentRecord } from '@/shared/api/student.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';

export const ParentsDirectoryTab: React.FC = () => {
  const { data: parents, isLoading } = useGetParentsQuery();

  const dummyParents: ParentRecord[] = [
    {
      id: 'par-1',
      name: 'Ramesh Sharma',
      relation: 'FATHER',
      email: 'ramesh.sharma@example.com',
      phone: '+91 98765 11111',
      occupation: 'Software Engineer',
    },
    {
      id: 'par-2',
      name: 'Sanjay Verma',
      relation: 'FATHER',
      email: 'sanjay.verma@example.com',
      phone: '+91 98765 22222',
      occupation: 'Business Owner',
    },
  ];

  const tableData = parents && parents.length > 0 ? parents : dummyParents;

  const columns: ColumnDef<ParentRecord>[] = [
    {
      accessorKey: 'name',
      header: 'Parent Name',
      cell: ({ row }: { row: { original: ParentRecord } }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
          <p className="text-[11px] text-slate-400">Relation: {row.original.relation}</p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
      cell: ({ row }: { row: { original: ParentRecord } }) => (
        <span className="text-xs text-slate-600 font-medium">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone Number',
      cell: ({ row }: { row: { original: ParentRecord } }) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: 'occupation',
      header: 'Occupation',
      cell: ({ row }: { row: { original: ParentRecord } }) => (
        <span className="text-xs text-slate-500">{row.original.occupation || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <EnterpriseDataTable
        title="Parents & Guardians Directory"
        subtitle="Contact and relationship details for enrolled students' parents"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
