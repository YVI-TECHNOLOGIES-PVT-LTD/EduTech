import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    BookOpen,
    Plus,
    Calendar,
    FileText,
    ChevronRight,
    Clock,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    ArrowLeft,
    Trash2,
    LayoutGrid,
    Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const AssignmentManagement = () => {
    const [mySections, setMySections] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [academicYearId, setAcademicYearId] = useState('');

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxMarks, setMaxMarks] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const [secRes, yearRes] = await Promise.all([
                    apiClient.get('/academic/sections/my'),
                    apiClient.get('/academic-years/current')
                ]);
                setMySections(secRes.data);
                setAcademicYearId(yearRes.data?.id);
                if (secRes.data.length > 0) {
                    handleSelectSection(secRes.data[0].section);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSelectSection = async (section: any) => {
        setSelectedSection(section);
        setAssignments([]);
        try {
            const [subRes, assignRes] = await Promise.all([
                apiClient.get(`/exams/subjects?classId=${section.class.id}`),
                apiClient.get(`/academic/assignments/section/${section.id}`)
            ]);
            setSubjects(subRes.data);
            setAssignments(assignRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient.post('/academic/assignments', {
                academic_year_id: academicYearId,
                section_id: selectedSection.id,
                subject_id: subjectId,
                title,
                description,
                due_date: dueDate,
                max_marks: parseFloat(maxMarks) || 0
            });
            setShowForm(false);
            setTitle('');
            setDescription('');
            setSubjectId('');
            setDueDate('');
            setMaxMarks('');
            // Refresh
            const res = await apiClient.get(`/academic/assignments/section/${selectedSection.id}`);
            setAssignments(res.data);
        } catch (err) {
            alert("Failed to create assignment");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this class work?")) return;
        try {
            await apiClient.delete(`/academic/assignments/${id}`);
            setAssignments(assignments.filter(a => a.id !== id));
        } catch (err) {
            alert("Delete failed");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <Link to="/app/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <BookOpen className="w-10 h-10 text-indigo-600" />
                        Class Work Manager
                    </h1>
                    <p className="text-gray-500 font-medium">Design and assign academic tasks to your students.</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedSection && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg ${showForm
                                ? 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                }`}
                        >
                            {showForm ? <ArrowLeft className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {showForm ? 'Cancel Creation' : 'Create New Work'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: My Sections */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Assigned Divisions</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {mySections.map((item) => (
                            <button
                                key={item.section.id}
                                onClick={() => {
                                    handleSelectSection(item.section);
                                    setShowForm(false);
                                }}
                                className={`group flex items-center justify-between p-4 rounded-2xl transition-all text-left ${selectedSection?.id === item.section.id
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 hover:border-indigo-100'
                                    }`}
                            >
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-wider ${selectedSection?.id === item.section.id ? 'text-indigo-100' : 'text-gray-400'
                                        }`}>
                                        {item.section.class.name}
                                    </div>
                                    <div className="font-black text-lg">Section {item.section.name}</div>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform ${selectedSection?.id === item.section.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`} />
                            </button>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 mt-6 overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-1">Teacher Pro Tip</h4>
                            <p className="text-sm text-indigo-100 font-medium">Clear instructions lead to 40% higher submission rates. Add details below!</p>
                        </div>
                        <LayoutGrid className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-6">
                    <AnimatePresence mode="wait">
                        {showForm ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <Type className="w-8 h-8 text-indigo-600" />
                                    Draft New Assignment
                                </h2>

                                <form onSubmit={handleCreate} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Title of Work</label>
                                            <input
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                                placeholder="e.g. Weekly Maths Quiz #4"
                                                value={title} onChange={e => setTitle(e.target.value)} required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-gray-900 text-sm"
                                                value={subjectId} onChange={e => setSubjectId(e.target.value)} required
                                            >
                                                <option value="">Choose Module</option>
                                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> Due Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-gray-900 text-sm"
                                                value={dueDate} onChange={e => setDueDate(e.target.value)} required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Maximum Points</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                                placeholder="e.g. 100"
                                                value={maxMarks} onChange={e => setMaxMarks(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Instructions</label>
                                        <textarea
                                            className="w-full bg-gray-50 border border-gray-100 p-6 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-medium text-gray-700 h-48 resize-none shadow-inner"
                                            placeholder="Clearly describe what students need to do, any specific resources to use, and how to submit..."
                                            value={description} onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-end items-center gap-6 pt-6 ">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-6 py-3 font-black text-gray-400 hover:text-gray-900 transition-colors uppercase text-xs tracking-widest"
                                        >
                                            Discard Draft
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
                                        >
                                            {saving ? 'Publishing...' : 'Broadcast to Class'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Active Assignments ({assignments.length})</h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Search className="w-5 h-5" /></button>
                                        <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Filter className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {assignments.length === 0 ? (
                                    <div className="bg-white p-8 sm:p-24 rounded-[3rem] border border-dashed border-gray-200 text-center shadow-sm">
                                        <div className="inline-flex p-8 bg-indigo-50 rounded-[2rem] mb-8 text-indigo-400 animate-pulse">
                                            <FileText className="w-16 h-16" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-2">Workspace is Empty</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Start by selecting a section or create a new assignment to engage your students.</p>
                                        {selectedSection && (
                                            <button
                                                onClick={() => setShowForm(true)}
                                                className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-50 hover:bg-indigo-700 transition-all"
                                            >
                                                Create First Work
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {assignments.map(app => (
                                            <motion.div
                                                layout
                                                key={app.id}
                                                className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                                                {app.subject?.name}
                                                            </span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                {new Date(app.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{app.title}</h3>
                                                        <p className="text-gray-500 font-medium line-clamp-2 text-sm leading-relaxed">{app.description}</p>
                                                    </div>

                                                    <div className="text-right space-y-2 min-w-[140px]">
                                                        <div className="flex items-center justify-end gap-2 text-rose-600 font-black text-xs uppercase tracking-wider bg-rose-50 px-3 py-1.5 rounded-xl">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(app.due_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            Points: <span className="text-gray-900">{app.max_marks}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-2 text-xs font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            0 SUBMISSIONS
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                            <FileText className="w-4 h-4" />
                                                            Resources: 0
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                                        <button
                                                            onClick={() => handleDelete(app.id)}
                                                            className="p-3 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
                                                            Review Work <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Decorative background element */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100"></div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
