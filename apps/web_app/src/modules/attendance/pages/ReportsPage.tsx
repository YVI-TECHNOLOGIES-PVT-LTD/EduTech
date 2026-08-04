import { useState } from 'react';
import { useAttendanceReports } from '../hooks/useAttendanceReports';
import { AttendanceExportDialog } from '../components/shared/AttendanceFilterBar';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { FileSpreadsheet, ShieldAlert, BarChart } from 'lucide-react';

export function ReportsPage() {
    const { generateReport, isGenerating } = useAttendanceReports();
    const [reportType, setReportType] = useState('daily');

    const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
        try {
            const res = await generateReport({
                school_id: '457bbda3-f542-47dc-9d41-3d7729226f86',
                academic_year_id: '8db7f474-3252-475a-bc84-9092be0f8f12',
                report_type: reportType,
                parameters: { format }
            });
            alert(`Report generated successfully! Link: ${res.data.file_url || 'N/A'}`);
        } catch (err) {
            console.error('Failed to generate report', err);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 text-primary" /> Reports Desk
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configure and export attendance registers, lists, and summary charts.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                {/* Selectors category */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">Report Category</h2>
                    {[
                        { id: 'daily', label: 'Daily Roster Register', desc: 'Daily roster attendance state' },
                        { id: 'monthly', label: 'Monthly Summary Matrix', desc: 'Monthly summary statistics grid' },
                        { id: 'defaulters', label: 'Defaulters Low Attendance', desc: 'Students with attendance < 75%' },
                    ].map(rep => (
                        <button
                            key={rep.id}
                            onClick={() => setReportType(rep.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                reportType === rep.id
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-50 bg-gray-50 text-gray-600'
                            }`}
                        >
                            <p className="text-xs font-bold">{rep.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{rep.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3 space-y-6">
                    <AttendanceExportDialog onExport={handleExport} />

                    <Card className="p-6 border-0 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                            <BarChart className="w-4 h-4 text-primary" /> Report Preview
                        </h3>
                        <div className="text-xs text-gray-400 italic py-10 text-center">
                            Select category and format to download the generated files.
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
