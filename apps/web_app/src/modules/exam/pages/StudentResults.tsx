import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';

export const StudentResults = () => {
    const [marks, setMarks] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/exams/marks/my')
            .then(res => setMarks(res.data))
            .catch(err => {
                console.error("Failed to load marks:", err);
                // Optionally handle 404/403 differently or just show nothing
                setMarks([]);
            });
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">My Results</h2>
            {marks.length === 0 ? (
                <div className="bg-gray-100 p-8 rounded text-center">No marks found.</div>
            ) : (
                <div className="grid gap-6">
                    {marks.map((m, idx) => (
                        <div key={idx} className="bg-white p-6 rounded shadow border-l-4 border-indigo-500">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{m.subject?.name}</h3>
                                    <p className="text-sm text-gray-500">{m.exam?.name}</p>
                                    <p className="text-xs text-gray-400">Student: {m.student?.full_name}</p>
                                </div>
                                <div className="text-3xl font-bold text-indigo-600">
                                    {m.marks_obtained} <span className="text-sm text-gray-400 font-normal">/ 100</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
