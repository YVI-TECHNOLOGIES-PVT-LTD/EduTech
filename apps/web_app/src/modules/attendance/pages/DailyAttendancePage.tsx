import { useState, useEffect } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceGrid } from '../components/attendance/AttendanceGrid';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Save, Calendar, CheckSquare } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export function DailyAttendancePage() {
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

    const { session, bulkMark, isBulking }: any = useAttendance();

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
        const loadStudentsAndRecords = async () => {
            try {
                // Get student registry
                const stuRes = await apiClient.get('/students', { params: { sectionId: selectedSectionId } });
                const studentList = Array.isArray(stuRes.data) ? stuRes.data : stuRes.data.data || [];
                setStudents(studentList);

                // Check session existing records
                const recRes = await apiClient.get(`/attendance/section/${selectedSectionId}?date=${date}`);
                if (recRes.data.session) {
                    const mapped: Record<string, string> = {};
                    if (Array.isArray(recRes.data.records)) {
                        recRes.data.records.forEach((r: any) => mapped[r.student_id] = r.status);
                    }
                    setAttendanceMap(mapped);
                } else {
                    const defaults: Record<string, string> = {};
                    studentList.forEach((s: any) => defaults[s.id] = 'present');
                    setAttendanceMap(defaults);
                }
            } catch (err) {
                console.error('Error fetching register', err);
            }
        };
        loadStudentsAndRecords();
    }, [selectedSectionId, date]);

    const handleGridChange = (studentId: string, status: string) => {
        setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    };

    const handleBulkMark = (status: string) => {
        const updated = { ...attendanceMap };
        students.forEach(s => updated[s.id] = status);
        setAttendanceMap(updated);
    };

    const handleSave = async () => {
        if (!selectedSectionId) return;
        try {
            // Get session id
            const sessRes = await apiClient.post('/v1/student/attendance/session', {
                school_id: '457bbda3-f542-47dc-9d41-3d7729226f86',
                academic_year_id: '8db7f474-3252-475a-bc84-9092be0f8f12',
                grade: 'Grade 10',
                section_id: selectedSectionId,
                date,
            });

            await bulkMark({
                session_id: sessRes.data.id,
                records: Object.entries(attendanceMap).map(([sid, status]) => ({
                    student_id: sid,
                    status
                }))
            });

            alert('Daily attendance register saved successfully!');
        } catch (err) {
            console.error('Failed to submit bulk register', err);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CheckSquare className="w-8 h-8 text-primary animate-pulse" /> Daily Register marking
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Select class, date, and bulk submit records.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold shadow-sm"
                    />
                    <select
                        id="section-selection-dropdown"
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
                    <Button onClick={handleSave} disabled={isBulking} className="bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <Save className="w-4 h-4" /> {isBulking ? 'Saving...' : 'Save Register'}
                    </Button>
                </div>
            </div>

            <AttendanceGrid
                students={students}
                attendanceMap={attendanceMap}
                onChange={handleGridChange}
                onBulkChange={handleBulkMark}
            />
        </div>
    );
}

export default DailyAttendancePage;
