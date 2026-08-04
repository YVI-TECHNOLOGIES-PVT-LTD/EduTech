import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { DataTableFramework, ColumnDefinition } from '../../../components/tables/DataTableFramework';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';

export function ApplicationListPage() {
    const navigate = useNavigate();
    const { data: applications, isLoading } = useQuery({
        queryKey: ['admissions', 'list'],
        queryFn: () => admissionApi.list().then(res => res.data),
    });

    const columns: ColumnDefinition<any>[] = [
        { key: 'student_name', header: 'Student Name' },
        { key: 'parent_name', header: 'Parent Name' },
        { key: 'grade_applied_for', header: 'Grade' },
        { key: 'admission_type', header: 'Type', render: (row: any) => row.admission_type || 'Regular' },
        {
            key: 'status',
            header: 'Status',
            render: (row: any) => {
                const statusColors: Record<string, string> = {
                    draft: 'bg-gray-100 text-gray-600',
                    submitted: 'bg-blue-100 text-blue-600',
                    under_review: 'bg-yellow-100 text-yellow-600',
                    approved: 'bg-green-100 text-green-600',
                    rejected: 'bg-red-100 text-red-600',
                };
                return (
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${statusColors[row.status] || 'bg-blue-50 text-blue-600'}`}>
                        {row.status}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row: any) => (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/app/admissions/${row.id}`)}
                    className="text-xs text-primary font-bold flex items-center gap-1"
                >
                    <Eye className="w-3.5 h-3.5" /> View
                </Button>
            ),
        },
    ];

    const mockApplications = (applications as any)?.data || [
        { id: '1', student_name: 'Rahul Khanna', parent_name: 'Arun Khanna', grade_applied_for: 'Grade 10', admission_type: 'Regular', status: 'submitted' },
        { id: '2', student_name: 'Sneha Patel', parent_name: 'Karan Patel', grade_applied_for: 'Grade 1', admission_type: 'RTE', status: 'under_review' },
        { id: '3', student_name: 'Kabir Dev', parent_name: 'Kapil Dev', grade_applied_for: 'Grade 5', admission_type: 'Management', status: 'approved' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Application Desk</h1>
                    <p className="text-sm text-gray-500 mt-1">Review student applications across all stages.</p>
                </div>
                <Button
                    onClick={() => navigate('/app/admissions/new')}
                    className="bg-primary text-white flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> New Application
                </Button>
            </div>

            <div>
                <DataTableFramework
                    columns={columns}
                    data={mockApplications}
                    loading={isLoading}
                />
            </div>
        </div>
    );
}

export default ApplicationListPage;
