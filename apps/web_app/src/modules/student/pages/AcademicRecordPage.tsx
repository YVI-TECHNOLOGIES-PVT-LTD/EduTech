import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { DataTableFramework, ColumnDefinition } from '../../../components/tables/DataTableFramework';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

export function AcademicRecordPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { history } = useStudent(id || '');

    const columns: ColumnDefinition<any>[] = [
        { key: 'academic_year_id', header: 'Academic Year' },
        { key: 'grade', header: 'Grade Level' },
        { key: 'section_id', header: 'Section assigned' },
        { key: 'roll_number', header: 'Roll Number' },
        {
            key: 'allocated_at',
            header: 'Allocation Date',
            render: (row: any) => new Date(row.allocated_at || Date.now()).toLocaleDateString(),
        },
    ];

    const mockHistory = history.length > 0 ? history : [
        { id: 'h1', academic_year_id: '2025-26', grade: 'Grade 9', section_id: 'A', roll_number: '12', allocated_at: '2025-06-01T10:00:00.000Z' },
        { id: 'h2', academic_year_id: '2026-27', grade: 'Grade 10', section_id: 'A', roll_number: '14', allocated_at: '2026-06-01T10:00:00.000Z' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Academic History</h1>
                    <p className="text-sm text-gray-500 mt-1">Review student academic roll tracking across active years.</p>
                </div>
            </div>

            <Card className="p-6 border-0 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-primary" /> Promotion & Section Assignment Logs
                </h3>
                <DataTableFramework
                    columns={columns}
                    data={mockHistory}
                />
            </Card>
        </div>
    );
}

export default AcademicRecordPage;
