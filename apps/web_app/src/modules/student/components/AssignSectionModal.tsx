import { useState, useEffect } from 'react';
import { X, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

interface AssignSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onSuccess: () => void;
}

export const AssignSectionModal = ({ isOpen, onClose, student, onSuccess }: AssignSectionModalProps) => {
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingClasses, setFetchingClasses] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
            // If student already has a section, we can try to pre-select, but
            // the student record from directory usually has one for the active year.
            const currentSection = student.sections?.[0]?.section;
            if (currentSection) {
                setSelectedClassId(currentSection.class?.id || currentSection.class_id || '');
                setSelectedSectionId(currentSection.id || '');
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedClassId) {
            fetchSections(selectedClassId);
        } else {
            setSections([]);
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        setFetchingClasses(true);
        try {
            const res = await apiClient.get('/academic/classes');
            setClasses(res.data || []);
        } catch (err) {
            console.error("Failed to fetch classes", err);
        } finally {
            setFetchingClasses(false);
        }
    };

    const fetchSections = async (classId: string) => {
        try {
            const res = await apiClient.get('/academic/sections', { params: { classId } });
            setSections(res.data || []);
        } catch (err) {
            console.error("Failed to fetch sections", err);
        }
    };

    const handleSave = async () => {
        if (!selectedSectionId) return;

        // Confirmation if already assigned
        const currentSection = student.sections?.[0]?.section;
        if (currentSection && !window.confirm(`Student is currently assigned to ${currentSection.class?.name || 'Unknown'} - ${currentSection.name}. Overwrite with new assignment?`)) {
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/admin/student-section/assign', {
                student_id: student.id,
                section_id: selectedSectionId
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to assign section");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Assign Section</h3>
                            <p className="text-gray-500 text-sm font-medium">{student.full_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Class</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-bold"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            disabled={fetchingClasses || loading}
                        >
                            <option value="">Choose Class...</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Section</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-bold"
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            disabled={!selectedClassId || loading}
                        >
                            <option value="">{selectedClassId ? "Choose Section..." : "Select class first"}</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedSectionId && (
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <p className="text-sm font-bold text-green-700">Ready to assign to current active year.</p>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedSectionId || loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Saving..." : "Save Assignment"}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
