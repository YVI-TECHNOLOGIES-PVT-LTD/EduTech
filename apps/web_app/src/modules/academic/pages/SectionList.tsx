import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useParams, Link } from 'react-router-dom';
import {
    Layers,
    ArrowLeft,
    Plus,
    Users,
    UserPlus,
    ChevronRight,
    X,
    Search,
    CheckCircle2,
    Calendar,
    BookOpen,
    ShieldCheck
} from 'lucide-react';

export const SectionList = () => {
    const { classId } = useParams();
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [facultyMembers, setFacultyMembers] = useState<any[]>([]);
    const [sectionFaculties, setSectionFaculties] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    // Modals
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showFacultyModal, setShowFacultyModal] = useState(false);

    // Form States
    const [newName, setNewName] = useState('');
    const [activeSection, setActiveSection] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [facultySearch, setFacultySearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'class_teacher' | 'subject_teacher'>('subject_teacher');

    useEffect(() => {
        if (classId) {
            fetchData();
            fetchFaculty();
            fetchStudents(); // Initial fetch
        }
    }, [classId]);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchData = () => {
        setLoading(true);
        apiClient.get(`/academic/sections?classId=${classId}`)
            .then(async (res) => {
                const fetchedSections = res.data;
                setSections(fetchedSections);

                // Fetch assignments for each section
                const facultyMap: Record<string, any[]> = {};
                await Promise.all(fetchedSections.map(async (sec: any) => {
                    const fRes = await apiClient.get(`/academic/sections/${sec.id}/assignments`);
                    facultyMap[sec.id] = fRes.data;
                }));
                setSectionFaculties(facultyMap);
            })
            .finally(() => setLoading(false));
    };

    const fetchStudents = (searchQuery: string = '') => {
        // Fetch up to 50 students if searching, otherwise 20.
        // For production, use server-side pagination properly.
        const params: any = { limit: searchQuery ? 50 : 20 };
        if (searchQuery) params.search = searchQuery;

        apiClient.get('/students', { params }).then(res => {
            console.log('Students response:', res.data); // Debug logging
            const studentList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setStudents(Array.isArray(studentList) ? studentList : []);
        }).catch(err => {
            console.error('Failed to fetch students:', err);
            setStudents([]);
        });
    };

    const fetchFaculty = () => {
        apiClient.get('/academic/faculty').then(res => setFacultyMembers(res.data));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/academic/sections', {
                class_id: classId,
                name: newName
            });
            setNewName('');
            setShowSectionModal(false);
            fetchData();
        } catch (err) {
            alert("Failed to build section");
        }
    };

    const handleAssignStudent = async (studentId: string) => {
        if (!activeSection) return;
        setSubmitting(true);
        try {
            await apiClient.post(`/academic/sections/${activeSection.id}/assign-student`, { student_id: studentId });
            setShowAssignModal(false);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || "Assignment failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignFaculty = async (facultyId: string) => {
        if (!activeSection) return;
        setSubmitting(true);
        try {
            await apiClient.post(`/academic/sections/${activeSection.id}/assign-faculty`, {
                faculty_user_id: facultyId,
                role: selectedRole
            });
            setShowFacultyModal(false);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || "Faculty assignment failed");
        } finally {
            setSubmitting(false);
        }
    };



    const filteredFaculty = facultyMembers.filter(f =>
        f.full_name?.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.email?.toLowerCase().includes(facultySearch.toLowerCase())
    ).slice(0, 5);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-700">
            {/* Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <Link to="/app/academic/classes" className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        Return to Class Matrix
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <Layers className="w-10 h-10 text-indigo-600" />
                        Division Management
                    </h1>
                </div>
                <button
                    onClick={() => setShowSectionModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-5 h-5" />
                    Expand Divisions
                </button>
            </div>

            {/* Content Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map(sec => (
                    <div key={sec.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 p-8 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {sec.name.charAt(0)}
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Enrolled</div>
                                <div className="text-2xl font-black text-gray-900">{sec._count_students?.[0]?.count || 0}</div>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Section {sec.name}</h3>

                        {/* Assigned Faculty Tags */}
                        <div className="mb-6 flex flex-wrap gap-2 min-h-[40px]">
                            {sectionFaculties[sec.id]?.length > 0 ? (
                                sectionFaculties[sec.id].map((af, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase">
                                        <ShieldCheck className="w-3 h-3" />
                                        {af.faculty.full_name}
                                        <span className="opacity-50">• {af.role === 'class_teacher' ? 'Class' : 'Subject'}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] font-bold text-gray-300 italic">No faculty assigned yet</p>
                            )}
                        </div>

                        <div className="space-y-3 mt-auto">
                            <button
                                onClick={() => { setActiveSection(sec); setShowAssignModal(true); }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl text-sm font-bold text-gray-600 hover:text-indigo-600 transition-all group/btn"
                            >
                                <span className="flex items-center gap-3">
                                    <UserPlus className="w-4 h-4" />
                                    Assign Student
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                            </button>
                            <button
                                onClick={() => { setActiveSection(sec); setShowFacultyModal(true); }}
                                className="w-full flex items-center justify-between p-4 bg-indigo-50/50 hover:bg-indigo-100 rounded-2xl text-sm font-bold text-indigo-600 transition-all group/btn"
                            >
                                <span className="flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4" />
                                    Allocate Faculty
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                            </button>
                            <button className="w-full flex items-center gap-3 p-4 bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl text-sm font-bold text-gray-400 hover:text-indigo-600 transition-all">
                                <Users className="w-4 h-4" />
                                View Student Roster
                            </button>
                        </div>
                    </div>
                ))}

                {sections.length === 0 && (
                    <div className="col-span-full py-8 sm:py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Plus className="w-10 h-10 text-gray-200" />
                        </div>
                        <div className="max-w-xs">
                            <h3 className="text-xl font-black text-gray-900">No Divisions Found</h3>
                            <p className="text-gray-500 font-medium text-sm mt-1">Start by adding sub-sections (like A, B, or C) to this academic class.</p>
                        </div>
                        <button onClick={() => setShowSectionModal(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 mt-4 transition-all hover:scale-105">
                            Create First Section
                        </button>
                    </div>
                )}
            </div>

            {/* Modal: Create Section */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">Add Division</h3>
                            <button onClick={() => setShowSectionModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Section Nomenclature</label>
                                <input
                                    className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-center text-indigo-600 transition-all placeholder:text-gray-200"
                                    placeholder="e.g. A"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest">
                                Build Section
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Assign Student */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Enroll in Section {activeSection?.name}</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Select from global student directory</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {students.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleAssignStudent(s.id)}
                                        disabled={submitting}
                                        className="w-full group flex items-center justify-between p-4 bg-gray-50/50 hover:bg-indigo-600 rounded-2xl border border-gray-50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white group-hover:bg-indigo-500 rounded-xl flex items-center justify-center font-black text-indigo-600 group-hover:text-white transition-colors">
                                                {s.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-white transition-colors">{s.full_name}</div>
                                                <div className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-200 uppercase tracking-widest">{s.student_code}</div>
                                            </div>
                                        </div>
                                        <div className="bg-indigo-100 group-hover:bg-indigo-300 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                                        </div>
                                    </button>
                                ))}

                                {students.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl">
                                        Keep typing to find students...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Ready for allocation
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 font-bold hover:text-gray-900 transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Allocate Faculty */}
            {showFacultyModal && (
                <div className="fixed inset-0 bg-blue-900/20 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Allocate Faculty - Sec {activeSection?.name}</h3>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setSelectedRole('subject_teacher')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${selectedRole === 'subject_teacher' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                    >Subject Teacher</button>
                                    <button
                                        onClick={() => setSelectedRole('class_teacher')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${selectedRole === 'class_teacher' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                    >Class Teacher</button>
                                </div>
                            </div>
                            <button onClick={() => setShowFacultyModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search faculty by name or email..."
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredFaculty.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => handleAssignFaculty(f.id)}
                                        disabled={submitting}
                                        className="w-full group flex items-center justify-between p-4 bg-gray-50/50 hover:bg-emerald-600 rounded-2xl border border-gray-50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white group-hover:bg-emerald-500 rounded-xl flex items-center justify-center font-black text-emerald-600 group-hover:text-white transition-colors">
                                                {f.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-white transition-colors">{f.full_name}</div>
                                                <div className="text-[10px] font-bold text-gray-400 group-hover:text-emerald-100 uppercase tracking-widest">{f.email}</div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-100 group-hover:bg-emerald-300 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                                        </div>
                                    </button>
                                ))}

                                {filteredFaculty.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl">
                                        No faculty members found...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    Active Sync Enabled
                                </div>
                                <div className="text-[9px] font-bold text-indigo-400 uppercase mt-1">
                                    * {activeSection?._count_students?.[0]?.count || 0} students will be auto-mapped
                                </div>
                            </div>
                            <button onClick={() => setShowFacultyModal(false)} className="text-gray-400 font-bold hover:text-gray-900 transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
)
