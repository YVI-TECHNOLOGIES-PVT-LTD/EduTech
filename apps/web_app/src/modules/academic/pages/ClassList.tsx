import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Link } from 'react-router-dom';
import { Plus, Calendar, BookOpen, AlertCircle, ChevronRight, X } from 'lucide-react';

export const ClassList = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [currentYear, setCurrentYear] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [showClassModal, setShowClassModal] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newYearLabel, setNewYearLabel] = useState('');

    useEffect(() => {
        fetchData();
        fetchYear();
    }, []);

    const fetchYear = () => {
        apiClient.get('/academic-years/current').then(res => setCurrentYear(res.data));
    };

    const fetchData = () => {
        apiClient.get('/academic/classes')
            .then(res => setClasses(res.data))
            .finally(() => setLoading(false));
    };

    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiClient.post('/academic-years', {
                year_label: newYearLabel,
                is_active: true
            });
            setCurrentYear(res.data);
            setShowYearModal(false);
            setNewYearLabel('');
        } catch (err) {
            alert("Failed to create academic year");
        }
    }

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentYear?.id) {
            setShowYearModal(true);
            return;
        }

        try {
            await apiClient.post('/academic/classes', {
                name: newName,
                academic_year_id: currentYear.id
            });
            setNewName('');
            setShowClassModal(false);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to create class");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Academic Classes</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Current Year: <span className="font-bold text-gray-800">{currentYear?.year_label || 'Not Setup'}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    {!currentYear && (
                        <button
                            onClick={() => setShowYearModal(true)}
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-100"
                        >
                            <Plus className="w-5 h-5" />
                            Setup Year
                        </button>
                    )}
                    <button
                        onClick={() => setShowClassModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                    >
                        <Plus className="w-5 h-5" />
                        Add Class
                    </button>
                </div>
            </header>

            {!currentYear && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-900 text-lg">Academic Year Required</h3>
                        <p className="text-amber-700 mt-1">
                            Before you can create classes, you must set up the current academic year (e.g., 2026-27).
                        </p>
                        <button
                            onClick={() => setShowYearModal(true)}
                            className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
                        >
                            Create Academic Year Now
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                    <div key={cls.id} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <BookOpen className="w-6 h-6 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cls.academic_year?.year_label}</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">{cls.name}</h3>

                        {/* Section List */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {cls.sections && cls.sections.length > 0 ? (
                                cls.sections
                                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                                    .map((sec: any) => (
                                        <span key={sec.id} className="px-2.5 py-1 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-100 hover:border-blue-100 rounded-lg text-xs font-bold transition-colors">
                                            {sec.name}
                                        </span>
                                    ))
                            ) : (
                                <span className="text-xs text-gray-400 italic font-medium px-2 py-1">No sections yet</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-50">
                            <span className="text-gray-500 font-medium">Total Sections: <span className="text-blue-600 font-bold">{cls.sections?.length || 0}</span></span>
                            <Link to={`/app/academic/classes/${cls.id}`} className="flex items-center gap-1 text-blue-600 font-bold hover:gap-2 transition-all">
                                Manage
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && (
                    <div className="col-span-full py-8 sm:py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Classes Yet</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-1">Start by adding your first academic class to organize sections and students.</p>
                    </div>
                )}
            </div>

            {/* Academic Year Modal */}
            {showYearModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">Setup Academic Year</h3>
                            <button onClick={() => setShowYearModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-gray-500 mb-6 text-sm">Define the active session for your school. This will be linked to all new classes and admissions.</p>
                        <form onSubmit={handleCreateYear} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Year Label</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-bold"
                                    placeholder="e.g. 2026-27"
                                    value={newYearLabel}
                                    onChange={e => setNewYearLabel(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all">
                                Initialize Academic Year
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Class Modal */}
            {showClassModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">Add New Class</h3>
                            <button onClick={() => setShowClassModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClass} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Class Name</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-bold"
                                    placeholder="e.g. Grade 5"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl">
                                <p className="text-xs text-blue-600 font-bold flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    ASSIGNING TO SESSION: {currentYear?.year_label}
                                </p>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all">
                                Create Class
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
