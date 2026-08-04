import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DataTableFramework } from '../../../components/tables/DataTableFramework';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';

export function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState('directory');

    const directoryData = [
        { id: '1', name: 'Rahul Soni', roll: '14', section: 'A', contact: '+91 98765 43210' },
        { id: '2', name: 'Diya Sharma', roll: '22', section: 'B', contact: '+91 98765 43212' },
    ];

    const birthdayData = [
        { id: '1', name: 'Amit Saxena', dob: '2012-07-02', age: '14', section: 'A' },
        { id: '2', name: 'Sonia Seth', dob: '2012-07-15', age: '14', section: 'B' },
    ];

    const columnsMap: Record<string, any[]> = {
        directory: [
            { key: 'name', header: 'Student Name' },
            { key: 'roll', header: 'Roll No' },
            { key: 'section', header: 'Section' },
            { key: 'contact', header: 'Parent Contact' },
        ],
        birthdays: [
            { key: 'name', header: 'Student Name' },
            { key: 'dob', header: 'Date of Birth' },
            { key: 'age', header: 'Age' },
            { key: 'section', header: 'Section' },
        ],
    };

    const handleExport = (format: 'csv' | 'pdf') => {
        alert(`Exporting ${selectedReport} as ${format.toUpperCase()}...`);
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Reports Desk</h1>
                    <p className="text-sm text-gray-500 mt-1">Generate and export class directories, birthday lists, and rosters.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleExport('csv')} className="bg-primary text-white flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('pdf')} className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">Report Category</h2>
                    {[
                        { id: 'directory', label: 'Roster Directory', desc: 'Roster directory contacts list' },
                        { id: 'birthdays', label: 'Upcoming Birthdays', desc: 'Students birthdays list' },
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
                        data={(selectedReport === 'directory' ? directoryData : birthdayData) as any[]}
                    />
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
