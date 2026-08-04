import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    CheckCircle2,
    Calendar as CalendarIcon,
    Users,
    ArrowLeft,
    Save,
    UserCheck,
    UserX,
    Clock,
    AlertTriangle,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const AttendanceMarking = () => {
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [activeYear, setActiveYear] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                const [yearRes, secRes] = await Promise.all([
                    apiClient.get('/academic-years/current'),
                    apiClient.get('/academic/sections/my')
                ]);
                setActiveYear(yearRes.data);
                setSections(secRes.data);
                if (secRes.data.length > 0) {
                    setSelectedSectionId(secRes.data[0].section.id);
                }
            } catch (err) {
                console.error("Initialization failed", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!selectedSectionId || !date) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Students for the section
                const stuRes = await apiClient.get('/students', { params: { sectionId: selectedSectionId } });
                setStudents(Array.isArray(stuRes.data) ? stuRes.data : stuRes.data.data || []);

                // 2. Check if session exists and get existing records
                const sessionRes = await apiClient.get(`/attendance/section/${selectedSectionId}?date=${date}`);

                if (sessionRes.data.session) {
                    setSessionId(sessionRes.data.session.id);
                    const existing: any = {};
                    if (Array.isArray(sessionRes.data.records)) {
                        sessionRes.data.records.forEach((r: any) => existing[r.student_id] = r.status);
                    }
                    setAttendanceMap(existing);
                } else {
                    setSessionId(null);
                    // Default everyone to present if no session exists
                    const initial: any = {};
                    if (Array.isArray(stuRes.data)) {
                        stuRes.data.forEach((s: any) => initial[s.id] = 'present');
                    } else if (stuRes.data && Array.isArray(stuRes.data.data)) {
                        // Handle paginated response structure if applicable
                        stuRes.data.data.forEach((s: any) => initial[s.id] = 'present');
                    }
                    setAttendanceMap(initial);
                }
            } catch (err) {
                console.error("Failed to fetch students/session", err);
            }
        };

        fetchData();
    }, [selectedSectionId, date]);

    const handleSave = async () => {
        if (!activeYear || !selectedSectionId) return;
        setSaving(true);

        try {
            // 1. Create/Get Session
            const { data: session } = await apiClient.post('/attendance/session', {
                academic_year_id: activeYear.id,
                section_id: selectedSectionId,
                date
            });

            // 2. Mark Records
            await apiClient.post(`/attendance/session/${session.id}/records`, {
                records: Object.entries(attendanceMap).map(([sid, status]) => ({
                    student_id: sid,
                    status
                }))
            });

            setSessionId(session.id);
            // Show success toast or something (omitted for now)
        } catch (err) {
            alert("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    const markAllAs = (status: string) => {
        const newMap = { ...attendanceMap };
        students.forEach(s => newMap[s.id] = status);
        setAttendanceMap(newMap);
    };

    const filteredStudents = (Array.isArray(students) ? students : []).filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: students.length,
        present: Object.values(attendanceMap).filter(v => v === 'present').length,
        absent: Object.values(attendanceMap).filter(v => v === 'absent').length,
        other: Object.values(attendanceMap).filter(v => v !== 'present' && v !== 'absent').length
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <Link to="/app/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <UserCheck className="w-10 h-10 text-indigo-600" />
                        Daily Attendance
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            className="text-sm font-bold text-gray-700 outline-none"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        value={selectedSectionId}
                        onChange={e => setSelectedSectionId(e.target.value)}
                    >
                        {sections.map((s: any) => (
                            <option key={s.section.id} value={s.section.id}>
                                {s.section.class.name} - {s.section.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Records'}
                    </button>
                </div>
            </div>

            {/* Quick Stats & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Students</div>
                        <div className="text-2xl font-black text-gray-900">{stats.total}</div>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-mono">Present</div>
                        <div className="text-2xl font-black text-emerald-700">{stats.present}</div>
                    </div>
                    <UserCheck className="w-8 h-8 text-emerald-200" />
                </div>
                <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest font-mono">Absent</div>
                        <div className="text-2xl font-black text-rose-700">{stats.absent}</div>
                    </div>
                    <UserX className="w-8 h-8 text-rose-200" />
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center gap-2">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Bulk actions</div>
                    <div className="flex gap-2">
                        <button onClick={() => markAllAs('present')} className="flex-1 text-[10px] font-black uppercase bg-emerald-600 text-white rounded-lg py-1.5 shadow-sm shadow-emerald-100">All Present</button>
                        <button onClick={() => markAllAs('absent')} className="flex-1 text-[10px] font-black uppercase bg-rose-600 text-white rounded-lg py-1.5 shadow-sm shadow-rose-100">All Absent</button>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {sessionId && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmed for today
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student info</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.map((stu) => (
                                <motion.tr
                                    layout
                                    key={stu.id}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                                                {stu.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{stu.full_name}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stu.student_code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex justify-center gap-2">
                                            {[
                                                { id: 'present', label: 'Present', icon: UserCheck, color: 'emerald' },
                                                { id: 'absent', label: 'Absent', icon: UserX, color: 'rose' },
                                                { id: 'late', label: 'Late', icon: Clock, color: 'amber' },
                                                { id: 'excused', label: 'Excused', icon: AlertTriangle, color: 'blue' }
                                            ].map((status) => (
                                                <button
                                                    key={status.id}
                                                    onClick={() => setAttendanceMap({ ...attendanceMap, [stu.id]: status.id })}
                                                    className={`
                                                        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
                                                        ${attendanceMap[stu.id] === status.id
                                                            ? `bg-${status.color}-600 text-white shadow-lg shadow-${status.color}-100 transform scale-105`
                                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                        }
                                                    `}
                                                >
                                                    <status.icon className="w-3.5 h-3.5" />
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-8 py-20 text-center text-gray-400 font-bold italic">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-gray-500 font-medium max-w-md">
                        Ensure all records are accurate before saving. Attendance data will be shared with parents and students instantly.
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                        className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-[1.2rem] font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Processing...' : 'Finalize & Save Attendance'}
                    </button>
                </div>
            </div>
        </div>
    );
};
