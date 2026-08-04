import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';

export const MyAttendance = () => {
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/attendance/my').then(res => setRecords(res.data));
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">My Attendance Log</h2>

            {records.length === 0 ? (
                <div className="bg-gray-100 p-8 rounded text-center">No attendance records found.</div>
            ) : (
                <div className="bg-white shadow rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Student</th>
                                <th className="px-6 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r, idx) => (
                                <tr key={idx} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm">{r.session?.date}</td>
                                    <td className="px-6 py-4">{r.student?.full_name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs capitalize font-bold
                                            ${r.status === 'present' ? 'text-green-700 bg-green-50' :
                                                r.status === 'absent' ? 'text-red-700 bg-red-50' : 'text-yellow-700 bg-yellow-50'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
