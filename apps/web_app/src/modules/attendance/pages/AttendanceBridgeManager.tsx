import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Search, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface StudentBridgeData {
    id: string;
    full_name: string;
    student_code: string;
    attendance?: {
        attendance_percentage: number;
        source: 'REAL' | 'BOOTSTRAP' | 'ADMIN' | 'SYSTEM';
    };
    fees?: {
        fee_status: 'PAID' | 'PARTIAL' | 'UNPAID';
        is_cleared: boolean;
        source: 'REAL' | 'BOOTSTRAP' | 'ADMIN';
    };
}

export const AttendanceBridgeManager = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<StudentBridgeData[]>([]);
    const [loading, setLoading] = useState(false);
    const [academicYearId, setAcademicYearId] = useState(''); // Would ideally fetch current active year

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch Classes & Active Year
        const fetchInit = async () => {
            try {
                const [clsRes, yearRes] = await Promise.all([
                    apiClient.get('/academic/classes'),
                    apiClient.get('/academic-years?status=OPEN')
                ]);
                setClasses(clsRes.data);
                if (yearRes.data?.length > 0) {
                    setAcademicYearId(yearRes.data[0].id);
                }
            } catch (err) {
                console.error("Init failed", err);
            }
        };
        fetchInit();
    }, []);

    useEffect(() => {
        if (selectedClass && academicYearId) {
            fetchStudents();
        }
    }, [selectedClass, academicYearId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/exams/admin/bridge/${selectedClass}/status?academicYearId=${academicYearId}`);
            setStudents(res.data);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (studentId: string) => {
        const val = parseFloat(editValue);
        if (isNaN(val) || val < 0 || val > 100) {
            alert("Invalid percentage");
            return;
        }

        setSaving(true);
        try {
            await apiClient.post('/exams/admin/bridge/attendance', {
                studentId,
                academicYearId,
                percentage: val
            });
            setEditingId(null);
            fetchStudents(); // Refresh
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save override");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Bridge</h1>
                    <p className="text-gray-500">Override attendance data for Exam Eligibility</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="border rounded-md p-2"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Student</th>
                            <th className="p-4 font-semibold text-gray-600">Current %</th>
                            <th className="p-4 font-semibold text-gray-600">Source</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Select a class to view data</td></tr>
                        ) : (
                            students.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{s.full_name}</div>
                                        <div className="text-xs text-gray-400">{s.student_code}</div>
                                    </td>
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <input
                                                type="number"
                                                className="w-20 border rounded p-1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={`font-bold ${(s.attendance?.attendance_percentage || 0) < 75 ? 'text-red-600' : 'text-emerald-600'
                                                }`}>
                                                {s.attendance?.attendance_percentage?.toFixed(1) || '0.0'}%
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {s.attendance?.source === 'ADMIN' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                <AlertCircle className="w-3 h-3" /> Admin Override
                                            </span>
                                        )}
                                        {s.attendance?.source === 'BOOTSTRAP' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                                Bootstrap
                                            </span>
                                        )}
                                        {(!s.attendance?.source || s.attendance?.source === 'REAL') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                                Live System
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSave(s.id)}
                                                    disabled={saving}
                                                    className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingId(s.id);
                                                    setEditValue(s.attendance?.attendance_percentage?.toString() || '');
                                                }}
                                                className="text-blue-600 font-medium text-sm hover:underline"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
