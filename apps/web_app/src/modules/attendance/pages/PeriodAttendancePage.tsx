import { useState, useEffect } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import { PeriodAttendanceGrid } from '../components/attendance/PeriodAttendanceGrid';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Save, CalendarCheck } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export function PeriodAttendancePage() {
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [sections, setSections] = useState<any[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [periodMap, setPeriodMap] = useState<Record<string, Record<number, string>>>({});

    const { markPeriod }: any = useAttendance();

    const periodsList = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const res = await apiClient.get('/academic/sections/my');
                setSections(res.data);
                if (res.data.length > 0) {
                    setSelectedSectionId(res.data[0].section.id);
                }
            } catch (err) {
                console.error('Failed to load active sections', err);
            }
        };
        fetchSections();
    }, []);

    useEffect(() => {
        if (!selectedSectionId) return;
        const loadStudents = async () => {
            try {
                const stuRes = await apiClient.get('/students', { params: { sectionId: selectedSectionId } });
                const studentList = Array.isArray(stuRes.data) ? stuRes.data : stuRes.data.data || [];
                setStudents(studentList);

                // Default status for all periods
                const initialMap: Record<string, Record<number, string>> = {};
                studentList.forEach((s: any) => {
                    initialMap[s.id] = {};
                    periodsList.forEach(p => {
                        initialMap[s.id][p] = 'present';
                    });
                });
                setPeriodMap(initialMap);
            } catch (err) {
                console.error('Error fetching students', err);
            }
        };
        loadStudents();
    }, [selectedSectionId, date]);

    const handleCellChange = (studentId: string, period: number, status: string) => {
        setPeriodMap(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [period]: status,
            }
        }));
    };

    const handleSave = async () => {
        try {
            // Save period records one by one or simulated
            for (const [studentId, periods] of Object.entries(periodMap)) {
                for (const [periodNum, status] of Object.entries(periods)) {
                    await markPeriod({
                        student_id: studentId,
                        academic_year_id: '8db7f474-3252-475a-bc84-9092be0f8f12',
                        date,
                        period_number: Number(periodNum),
                        status,
                    });
                }
            }
            alert('Period-wise attendance registers saved successfully!');
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarCheck className="w-8 h-8 text-primary" /> Period-wise Register
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Mark and sync subject period cells (P1 - P8) per day.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold shadow-sm"
                    />
                    <select
                        id="period-section-select"
                        value={selectedSectionId}
                        onChange={e => setSelectedSectionId(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold shadow-sm"
                    >
                        {sections.map(s => (
                            <option key={s.section.id} value={s.section.id}>
                                {s.section.class.name} - {s.section.name}
                            </option>
                        ))}
                    </select>
                    <Button onClick={handleSave} className="bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <Save className="w-4 h-4" /> Save Period Records
                    </Button>
                </div>
            </div>

            <PeriodAttendanceGrid
                students={students}
                periods={periodsList}
                periodMap={periodMap}
                onCellChange={handleCellChange}
            />
        </div>
    );
}

export default PeriodAttendancePage;
