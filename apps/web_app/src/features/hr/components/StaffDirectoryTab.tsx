import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { UserPlus } from 'lucide-react';
import { useGetStaffListQuery, StaffRecord } from '@/shared/api/staff.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';
import { Button } from '@/components/ui/button';

export const StaffDirectoryTab: React.FC = () => {
  const { data: staffList, isLoading } = useGetStaffListQuery();

  const dummyStaff: StaffRecord[] = [
    {
      id: 'stf-1',
      employeeId: 'EMP-001',
      firstName: 'Dr. Suresh',
      lastName: 'Mehta',
      email: 'suresh.m@apexacademy.edu',
      phone: '+91 98111 22334',
      department: 'Academic Affairs',
      designation: 'Principal / Head of Institution',
      status: 'ACTIVE',
    },
    {
      id: 'stf-2',
      employeeId: 'EMP-002',
      firstName: 'Meenakshi',
      lastName: 'Sundaram',
      email: 'meenakshi.s@apexacademy.edu',
      phone: '+91 98222 33445',
      department: 'Admissions & Outreach',
      designation: 'Senior Admissions Officer',
      status: 'ACTIVE',
    },
    {
      id: 'stf-3',
      employeeId: 'EMP-003',
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'rohan.v@apexacademy.edu',
      phone: '+91 98333 44556',
      department: 'Finance & Accounts',
      designation: 'Senior Accountant',
      status: 'ACTIVE',
    },
  ];

  const tableData = staffList && staffList.length > 0 ? staffList : dummyStaff;

  const columns: ColumnDef<StaffRecord>[] = [
    {
      accessorKey: 'employeeId',
      header: 'Employee ID',
      cell: ({ row }: { row: { original: StaffRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.employeeId}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Staff Member',
      cell: ({ row }: { row: { original: StaffRecord } }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            {row.original.firstName} {row.original.lastName}
          </span>
          <p className="text-[11px] text-slate-400">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }: { row: { original: StaffRecord } }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.department}
        </span>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }: { row: { original: StaffRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.designation}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: StaffRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <UserPlus size={14} className="mr-1.5" />
          Onboard Staff Member
        </Button>
      </div>

      <EnterpriseDataTable
        title="Staff Directory"
        subtitle="Complete list of institutional faculty and administrative staff"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name, ID or department..."
      />
    </div>
  );
};
