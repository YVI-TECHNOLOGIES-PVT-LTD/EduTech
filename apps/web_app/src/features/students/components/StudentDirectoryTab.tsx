import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useGetStudentsQuery, StudentRecord } from '@/shared/api/student.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';

export const StudentDirectoryTab: React.FC = () => {
  const { data: students, isLoading } = useGetStudentsQuery();

  const dummyStudents: StudentRecord[] = [
    {
      id: 'stu-1',
      studentId: 'STU-2026-001',
      admissionNumber: 'ADM-2026-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      grade: 'Grade 9',
      section: 'Section A',
      parentName: 'Ramesh Sharma',
      parentPhone: '+91 98765 11111',
      status: 'ENROLLED',
      enrollmentDate: '2026-08-05',
    },
    {
      id: 'stu-2',
      studentId: 'STU-2026-002',
      admissionNumber: 'ADM-2026-002',
      firstName: 'Ananya',
      lastName: 'Verma',
      grade: 'Grade 11',
      section: 'Section B',
      parentName: 'Sanjay Verma',
      parentPhone: '+91 98765 22222',
      status: 'ENROLLED',
      enrollmentDate: '2026-08-06',
    },
  ];

  const tableData = students && students.length > 0 ? students : dummyStudents;

  const columns: ColumnDef<StudentRecord>[] = [
    {
      accessorKey: 'admissionNumber',
      header: 'Admission #',
      cell: ({ row }: { row: { original: StudentRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">
          {row.original.admissionNumber}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Student Name',
      cell: ({ row }: { row: { original: StudentRecord } }) => (
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-xs">
            {row.original.firstName[0]}
            {row.original.lastName[0]}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              {row.original.firstName} {row.original.lastName}
            </span>
            <p className="text-[11px] text-slate-400">ID: {row.original.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'grade',
      header: 'Grade & Section',
      cell: ({ row }: { row: { original: StudentRecord } }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.original.grade}
          </span>
          <p className="text-[11px] text-slate-400">{row.original.section}</p>
        </div>
      ),
    },
    {
      accessorKey: 'parentName',
      header: 'Parent / Contact',
      cell: ({ row }: { row: { original: StudentRecord } }) => (
        <div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {row.original.parentName}
          </span>
          <p className="text-[11px] text-slate-400">{row.original.parentPhone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Stage-1 Status',
      cell: ({ row }: { row: { original: StudentRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
    {
      accessorKey: 'enrollmentDate',
      header: 'Enrolled On',
      cell: ({ row }: { row: { original: StudentRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.enrollmentDate}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <EnterpriseDataTable
        title="Enrolled Student Directory"
        subtitle="Official directory of students who have completed the full Stage-1 admission & enrollment lifecycle"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        searchPlaceholder="Search students by name, admission # or parent..."
      />
    </div>
  );
};
