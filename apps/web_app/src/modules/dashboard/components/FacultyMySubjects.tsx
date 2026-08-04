import React, { useState, useEffect } from 'react';
import { FacultyApi } from '../../../api/facultyStaff.api';

interface MyAssignment {
    id: string;
    subject: { name: string; code: string };
    section: { name: string; class: { name: string } };
}

export const FacultyMySubjects: React.FC = () => {
    const [assignments, setAssignments] = useState<MyAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await FacultyApi.getMySubjects();
                setAssignments(data);
            } catch (error) {
                console.error("Error loading my subjects", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="p-6">Loading subjects...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Subject Assignments</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assign) => (
                    <div key={assign.id} className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{assign.subject?.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{assign.subject?.code}</p>
                                <div className="mt-4">
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                        {assign.section?.class?.name} - {assign.section?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {assignments.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">You have not been assigned any specific subjects yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
