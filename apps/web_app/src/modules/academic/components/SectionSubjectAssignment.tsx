import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { FacultyApi } from '../../../api/facultyStaff.api';

// Props: Section ID to manage
interface Props {
    sectionId: string;
}

interface SubjectAssignment {
    id: string;
    subject_id: string;
    faculty_profile_id: string;
    subject: { name: string; code: string };
    faculty: {
        id: string;
        user: { full_name: string; email: string };
    };
}

interface Subject {
    id: string;
    name: string;
    code: string;
}

interface FacultyProfile {
    id: string;
    user: { full_name: string };
}

export const SectionSubjectAssignment: React.FC<Props> = ({ sectionId }) => {
    const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
    const [loading, setLoading] = useState(false);

    // Selection for new assignment
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');

    useEffect(() => {
        if (sectionId) {
            fetchData();
        }
    }, [sectionId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get existing assignments
            const existing = await FacultyApi.getSectionAssignments(sectionId);
            setAssignments(existing);

            // 2. Get subjects for this section (via class)
            // Need the classId first
            const { data: section } = await supabase.from('sections').select('class_id').eq('id', sectionId).single();
            if (section) {
                const { data: subs } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('class_id', section.class_id);
                setSubjects(subs || []);
            }

            // 3. Get all faculty profiles (for assignment dropdown)
            const allFaculty = await FacultyApi.getAllProfiles();
            setFacultyList(allFaculty);

        } catch (err) {
            console.error("Error loading assignment data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedSubject || !selectedFaculty) return;
        try {
            await FacultyApi.assignSubject(sectionId, selectedSubject, selectedFaculty);
            // Refresh
            const existing = await FacultyApi.getSectionAssignments(sectionId);
            setAssignments(existing);
            // Clear selection
            setSelectedSubject('');
            setSelectedFaculty('');
        } catch (err: any) {
            alert('Assignment Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="p-4 text-center">Loading Data...</div>;

    const assignedSubjectIds = assignments.map(a => a.subject_id);
    // Determine which subjects are "free" or if we allow multiple teachers per subject. 
    // Usually we allow multiple. 

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Subject-Faculty Assignments</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <select
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                    >
                        <option value="">-- Choose Subject --</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code || '-'})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Faculty</label>
                    <select
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        value={selectedFaculty}
                        onChange={e => setSelectedFaculty(e.target.value)}
                    >
                        <option value="">-- Choose Faculty --</option>
                        {facultyList.map(f => (
                            <option key={f.id} value={f.id}>{f.user?.full_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleAssign}
                        disabled={!selectedSubject || !selectedFaculty}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Assign
                    </button>
                </div>
            </div>

            {/* List */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Faculty</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map(assign => (
                        <tr key={assign.id}>
                            <td className="px-6 py-4">{assign.subject?.name} <span className="text-xs text-gray-400">({assign.subject?.code})</span></td>
                            <td className="px-6 py-4 font-medium text-gray-900">{assign.faculty?.user?.full_name}</td>
                        </tr>
                    ))}
                    {assignments.length === 0 && (
                        <tr><td colSpan={2} className="p-4 text-center text-gray-500">No specific subject assignments yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
