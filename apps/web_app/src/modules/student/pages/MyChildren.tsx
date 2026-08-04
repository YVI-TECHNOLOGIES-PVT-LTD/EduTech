import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';

export const MyChildren = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/students/my/children')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">My Children</h2>

            {data.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded text-center">No enrolled students linked to your account.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.map(student => (
                        <div key={student.id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">{student.full_name}</h3>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{student.status}</span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div><span className="font-medium">Student Code:</span> {student.student_code}</div>
                                <div><span className="font-medium">DOB:</span> {student.date_of_birth}</div>
                                <div><span className="font-medium">Gender:</span> {student.gender}</div>
                                <div><span className="font-medium">School:</span> {student.school?.name}</div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Full Profile →</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
