import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';
import { DataTableFramework, ColumnDefinition } from '../../../components/tables/DataTableFramework';
import { StudentStatusBadge } from '../components/shared/StudentStatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Plus, Eye, Download, UserCheck, ShieldCheck, Mail } from 'lucide-react';

export function StudentListPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data, isLoading } = useQuery({
        queryKey: ['students', 'list', page, search, statusFilter],
        queryFn: () => studentApi.list({ page, limit: 10, search, status: statusFilter }).then(res => res.data),
    });

    const columns: ColumnDefinition<any>[] = [
        { key: 'admission_no', header: 'Adm No' },
        {
            key: 'name',
            header: 'Full Name',
            render: (row: any) => `${row.first_name} ${row.last_name}`,
        },
        {
            key: 'grade',
            header: 'Grade & Section',
            render: (row: any) => {
                const sec = row.student_sections?.[0];
                return sec ? `Grade ${row.grade || 'N/A'} - Sec ${sec.section_id}` : `Grade ${row.grade || 'N/A'} - Unallocated`;
            },
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: any) => <StudentStatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row: any) => (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/app/students/${row.id}`)}
                    className="text-xs font-bold text-primary flex items-center gap-1"
                >
                    <Eye className="w-3.5 h-3.5" /> View 360°
                </Button>
            ),
        },
    ];

    const mockStudents = data?.data || [
        { id: 's1', admission_no: 'ADM-2026-001', first_name: 'Rahul', last_name: 'Soni', status: 'ACTIVE', grade: 'Grade 10' },
        { id: 's2', admission_no: 'ADM-2026-002', first_name: 'Diya', last_name: 'Sharma', status: 'PROMOTED', grade: 'Grade 11' },
        { id: 's3', admission_no: 'ADM-2026-003', first_name: 'Mohit', last_name: 'Sen', status: 'TRANSFERRED', grade: 'Grade 9' },
    ];

    const handleBulkExport = () => {
        alert('Exporting selected student list records...');
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">Search and manage the school student registry.</p>
                </div>
                <Button
                    onClick={() => navigate('/app/students/new')}
                    className="bg-primary text-white flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Register Student
                </Button>
            </div>

            {/* Filter and Command Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap items-center">
                    <Input
                        placeholder="Search by name, admission no..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-64"
                    />
                    <select
                        id="status-select-filter"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="NEW">New</option>
                        <option value="PROMOTED">Promoted</option>
                        <option value="TRANSFERRED">Transferred</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-1.5" onClick={handleBulkExport}>
                        <Download className="w-4 h-4" /> Export Directory
                    </Button>
                </div>
            </div>

            {/* List Table */}
            <div>
                <DataTableFramework
                    columns={columns}
                    data={mockStudents}
                    loading={isLoading}
                />
            </div>
        </div>
    );
}

export default StudentListPage;
