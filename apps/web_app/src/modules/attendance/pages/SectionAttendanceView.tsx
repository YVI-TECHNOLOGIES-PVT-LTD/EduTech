import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';

export const SectionAttendanceView = () => {
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewData, setViewData] = useState<any>(null);

    useEffect(() => {
        // Fetch All sections (Admin View) or My Sections (Faculty) based on roles?
        // Let's use generic endpoint, but here let's assume Admin checking any section.
        // We'll reuse Class->Section list logic if needed, or just fetch all?
        // For simple MVP, let's just fetch "My Sections" again or add an endpoint for all sections for admin.
        // Re-using /academic/sections?classId is tedious. 
        // Let's just use existing My Sections for Faculty flow primarily.
        apiClient.get('/academic/sections/my').then(res => setSections(res.data));
    }, []);

    const fetchAttendance = () => {
        if (!selectedSectionId) return;
        apiClient.get(`/attendance/section/${selectedSectionId}?date=${date}`)
            .then(res => setViewData(res.data));
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Attendance Report</h2>

            <div className="flex gap-4 mb-6 bg-white p-4 rounded shadow">
                <div className="flex-1">
                    <label className="block text-sm font-bold mb-1">Date</label>
                    <input type="date" className="w-full border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-bold mb-1">Section</label>
                    <select className="w-full border p-2 rounded" onChange={e => setSelectedSectionId(e.target.value)}>
                        <option value="">-- Select --</option>
                        {sections.map((s: any) => (
                            <option key={s.section.id} value={s.section.id}>
                                {s.section.name} ({s.section.class.name})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={fetchAttendance} className="bg-blue-600 text-white px-4 py-2 rounded">View</button>
                </div>
            </div>

            {viewData && (
                <div className="bg-white shadow rounded overflow-hidden">
                    {!viewData.session ? (
                        <div className="p-8 text-center text-gray-500">No attendance marked for this day.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Student</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewData.session?.marker?.user_roles?.some((ur: any) => ur.role?.name === 'ADMIN') && (
                                    <tr>
                                        <td colSpan={3} className="bg-amber-50 text-amber-800 text-xs font-bold text-center py-2 border-b border-amber-100">
                                            ⚠️ TEST DATA (ADMIN SEEDED)
                                        </td>
                                    </tr>
                                )}
                                {viewData.records.map((r: any) => (
                                    <tr key={r.id} className="border-t">
                                        <td className="px-6 py-4 font-medium">{r.student.full_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs capitalize 
                                                ${r.status === 'present' ? 'bg-green-100 text-green-800' :
                                                    r.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {new Date(r.marked_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};
