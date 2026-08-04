import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Search, Calendar, Layers, FileSpreadsheet, FileText } from 'lucide-react';

export interface AttendanceFilterBarProps {
    onFilterChange: (filters: { sectionId: string; date: string; search: string }) => void;
    sections: Array<{ id: string; name: string; className: string }>;
}

export function AttendanceFilterBar({ onFilterChange, sections }: AttendanceFilterBarProps) {
    const [sectionId, setSectionId] = useState(sections[0]?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');

    const handleApply = () => {
        onFilterChange({ sectionId, date, search });
    };

    return (
        <Card className="p-4 border-0 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                    id="section-filter-select"
                    value={sectionId}
                    onChange={e => setSectionId(e.target.value)}
                    className="w-full md:w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                    {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.className} - {s.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
            </div>

            <Button onClick={handleApply} className="w-full md:w-auto bg-primary text-white text-xs font-bold">
                Apply Filters
            </Button>
        </Card>
    );
}

export function AttendanceExportDialog({ onExport }: { onExport: (format: 'pdf' | 'excel' | 'csv') => void }) {
    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Export Attendance Records</h3>
            <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => onExport('csv')} className="flex items-center gap-1.5 text-xs font-bold">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV
                </Button>
                <Button variant="outline" onClick={() => onExport('excel')} className="flex items-center gap-1.5 text-xs font-bold">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Excel
                </Button>
                <Button variant="outline" onClick={() => onExport('pdf')} className="flex items-center gap-1.5 text-xs font-bold">
                    <FileText className="w-4 h-4 text-rose-600" /> PDF
                </Button>
            </div>
        </Card>
    );
}
