import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { ImportWizard } from '../../../components/import/ImportWizard';
import { DownloadCloud } from 'lucide-react';

// Simple Subject Management Component
export const SubjectManagement = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    useEffect(() => {
        // Fetch classes
        apiClient.get('/academic/classes').then(res => setClasses(res.data));
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchSubjects();
        }
    }, [selectedClassId]);

    const fetchSubjects = () => {
        apiClient.get(`/exams/subjects?classId=${selectedClassId}`).then(res => setSubjects(res.data));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/exams/subjects', {
                class_id: selectedClassId,
                name,
                code
            });
            setName('');
            setCode('');
            fetchSubjects();
        } catch (err) {
            alert("Failed to create subject");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Subject Management</h2>
                <button
                    onClick={() => setIsImportOpen(true)}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition flex items-center gap-2"
                >
                    <DownloadCloud className="w-4 h-4" /> Import Subjects
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Select Class</label>
                <select
                    className="w-full border p-2 rounded"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {selectedClassId && (
                <>
                    <div className="bg-gray-50 p-4 rounded mb-6 border">
                        <h3 className="font-bold mb-4">Add New Subject</h3>
                        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
                            <input
                                className="flex-1 border p-2 rounded"
                                placeholder="Subject Name (e.g. Maths)"
                                value={name} onChange={e => setName(e.target.value)} required
                            />
                            <input
                                className="w-full sm:w-32 border p-2 rounded"
                                placeholder="Code (e.g. MAT)"
                                value={code} onChange={e => setCode(e.target.value)} required
                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors">Add</button>
                        </form>
                    </div>

                    <div className="bg-white shadow rounded overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Code</th>
                                        <th className="px-6 py-3 text-left">Subject Name</th>
                                        <th className="px-6 py-3 text-left">Class</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map(sub => (
                                        <tr key={sub.id} className="border-t">
                                            <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">{sub.code}</td>
                                            <td className="px-6 py-4 font-bold whitespace-nowrap">{sub.name}</td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{sub.class?.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            <ImportWizard
                isOpen={isImportOpen}
                onClose={() => {
                    setIsImportOpen(false);
                    fetchSubjects(); // Refresh
                }}
                entityType="SUBJECT"
                title="Subjects"
            />
        </div>
    );
};
