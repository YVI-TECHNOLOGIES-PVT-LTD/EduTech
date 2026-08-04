import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Download, BarChart3, PieChart, FileSpreadsheet, FileText } from 'lucide-react';
import { DataTableFramework } from '../../../components/tables/DataTableFramework';

export function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState('aging');

    const agingData = [
        { id: '1', grade: 'Grade 1', count: 18, avgDays: '12 days', conversionRate: '75%' },
        { id: '2', grade: 'Grade 5', count: 24, avgDays: '15 days', conversionRate: '68%' },
        { id: '3', grade: 'Grade 10', count: 12, avgDays: '22 days', conversionRate: '54%' },
    ];

    const counselorData = [
        { id: '1', name: 'Counselor Priya', allocated: 45, converted: 30, pending: 15, rating: '4.8/5' },
        { id: '2', name: 'Counselor Ramesh', allocated: 40, converted: 22, pending: 18, rating: '4.2/5' },
    ];

    const columnsMap: Record<string, any[]> = {
        aging: [
            { key: 'grade', header: 'Target Grade' },
            { key: 'count', header: 'Total Applicants' },
            { key: 'avgDays', header: 'Avg Processing Duration' },
            { key: 'conversionRate', header: 'Stage Conversion %' },
        ],
        counselor: [
            { key: 'name', header: 'Counselor Name' },
            { key: 'allocated', header: 'Assigned Leads' },
            { key: 'converted', header: 'Converted Applications' },
            { key: 'pending', header: 'Pending Followups' },
            { key: 'rating', header: 'Satisfaction Rating' },
        ],
    };

    const handleExport = (type: 'csv' | 'pdf') => {
        alert(`Exporting ${selectedReport} report as ${type.toUpperCase()}...`);
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Executive Reports</h1>
                    <p className="text-sm text-gray-500 mt-1">Export list statistics for counselors, ages, and categories.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleExport('csv')}
                        className="bg-primary text-white flex items-center gap-1.5"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-1.5"
                    >
                        <FileText className="w-4 h-4" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Sidebar toggle buttons */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Select Report</h2>
                    {[
                        { id: 'aging', label: 'Application Aging', desc: 'Avg processing duration' },
                        { id: 'counselor', label: 'Counselor Performance', desc: 'Leads conversions details' },
                    ].map(rep => (
                        <button
                            key={rep.id}
                            onClick={() => setSelectedReport(rep.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                selectedReport === rep.id
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-50 bg-gray-50 text-gray-600'
                            }`}
                        >
                            <p className="text-xs font-bold">{rep.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{rep.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3">
                    <DataTableFramework
                        columns={columnsMap[selectedReport] || []}
                        data={(selectedReport === 'aging' ? agingData : counselorData) as any[]}
                    />
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
