import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import {
    GraduationCap,
    Calendar,
    ChevronDown,
    ChevronUp,
    FileText,
    CheckCircle2,
    AlertCircle,
    Clock,
    History,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const AcademicHistory = () => {
    const [searchParams] = useSearchParams();
    const studentIdParam = searchParams.get('studentId');

    const [children, setChildren] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedYear, setExpandedYear] = useState<string | null>(null);
    const [examHistory, setExamHistory] = useState<Record<string, any[]>>({});

    // 1. Fetch children/self link
    useEffect(() => {
        apiClient.get('/students/my/children').then(res => {
            setChildren(res.data);
            if (studentIdParam) {
                setSelectedStudentId(studentIdParam);
            } else if (res.data.length > 0) {
                setSelectedStudentId(res.data[0].id);
            }
        }).catch(err => console.error("Failed to fetch student links", err));
    }, [studentIdParam]);

    // 2. Fetch History when selection changes
    useEffect(() => {
        if (selectedStudentId) {
            setLoading(true);
            apiClient.get(`/students/academic-history?studentId=${selectedStudentId}`)
                .then(res => {
                    setHistory(res.data);
                    if (res.data.length > 0 && !expandedYear) {
                        setExpandedYear(res.data[0].academic_year_id);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [selectedStudentId]);

    // 3. Fetch Exams for expanded year
    useEffect(() => {
        if (expandedYear && selectedStudentId && !examHistory[expandedYear]) {
            apiClient.get(`/students/exam-history?academic_year_id=${expandedYear}&studentId=${selectedStudentId}`)
                .then(res => {
                    setExamHistory(prev => ({ ...prev, [expandedYear]: res.data }));
                });
        }
    }, [expandedYear, selectedStudentId]);

    if (loading && !selectedStudentId) return (
        <div className="flex items-center justify-center p-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const currentStudent = children.find(c => c.id === selectedStudentId);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm shadow-gray-100/50">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <GraduationCap className="w-10 h-10 text-indigo-600" />
                        Academic Timeline
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        {currentStudent ? `Journey of ${currentStudent.full_name}` : 'Your complete journey through the years.'}
                    </p>
                </div>

                {children.length > 1 && (
                    <div className="flex items-center gap-2 bg-gray-50 p-2 pr-4 border border-gray-100 rounded-2xl">
                        <span className="text-[10px] font-black text-gray-400 uppercase pl-3 tracking-widest">Viewing:</span>
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => {
                                setSelectedStudentId(e.target.value);
                                setExamHistory({});
                                setExpandedYear(null);
                            }}
                            className="bg-transparent font-black text-gray-900 border-none focus:ring-0 cursor-pointer text-sm"
                        >
                            {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                        </select>
                    </div>
                )}
            </header>

            {/* Timeline View */}
            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-8 bottom-8 w-1 bg-gray-100 rounded-full hidden md:block opacity-50"></div>

                {history.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No Records Found</h3>
                        <p className="font-medium text-gray-400 max-w-xs mx-auto">We couldn't find any academic enrollment history for this student.</p>
                    </div>
                ) : history.map((year, idx) => (
                    <div key={year.academic_year_id} className="relative md:pl-16 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                        {/* Timeline Dot */}
                        <div className={`absolute left-4 top-10 w-5 h-5 rounded-full border-4 border-white shadow-lg shadow-gray-200 z-10 hidden md:block ${year.year_status === 'ACTIVE' ? 'bg-indigo-600 animate-pulse' : 'bg-gray-300'
                            }`}></div>

                        <div className={`group bg-white border border-gray-100 rounded-[2rem] transition-all overflow-hidden ${expandedYear === year.academic_year_id
                                ? 'shadow-2xl shadow-gray-200 ring-1 ring-indigo-500/20'
                                : 'shadow-sm hover:shadow-xl hover:shadow-gray-200/50'
                            }`}>
                            <button
                                onClick={() => setExpandedYear(expandedYear === year.academic_year_id ? null : year.academic_year_id)}
                                className="w-full text-left p-6 md:p-8 flex items-center justify-between group"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{year.academic_year_label}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${year.year_status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                            }`}>
                                            {year.year_status === 'ACTIVE' ? (
                                                <span className="flex items-center gap-1">Active Session</span>
                                            ) : 'Archived'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 font-bold">
                                        <span className="text-gray-900">{year.class_name}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-300" />
                                        <span>Section {year.section_name}</span>
                                    </div>
                                </div>

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${expandedYear === year.academic_year_id ? 'bg-indigo-600 text-white rotate-180 shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                    }`}>
                                    <ChevronDown className="w-6 h-6" />
                                </div>
                            </button>

                            {expandedYear === year.academic_year_id && (
                                <div className="px-6 md:px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
                                    <div className="bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-100">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-100/30 flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <History className="w-4 h-4" />
                                                Session Report Cards
                                            </h4>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {!examHistory[year.academic_year_id] ? (
                                                <div className="p-10 text-center">
                                                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                                                    <p className="mt-4 text-xs font-bold text-gray-400">Fetching results...</p>
                                                </div>
                                            ) : examHistory[year.academic_year_id].length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                                    <p className="text-sm font-bold text-gray-400 italic">No examinations recorded for this session.</p>
                                                </div>
                                            ) : examHistory[year.academic_year_id].map(exam => (
                                                <div key={exam.exam_id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white transition-colors group/row">
                                                    <div className="space-y-1">
                                                        <h5 className="font-black text-gray-900 tracking-tight">{exam.exam_name}</h5>
                                                        <div className="flex items-center gap-3">
                                                            {exam.is_published ? (
                                                                <span className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${exam.result_status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                                    }`}>
                                                                    {exam.result_status === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                                    {exam.result_status}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                    <Clock className="w-3 h-3" />
                                                                    Awaiting Results
                                                                </span>
                                                            )}
                                                            {exam.published_at && (
                                                                <span className="text-[10px] text-gray-300 font-bold">Issued: {new Date(exam.published_at).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {exam.is_published ? (
                                                        <Link
                                                            to={`/app/student/exams/report-card?examId=${exam.exam_id}&studentId=${selectedStudentId}`}
                                                            className="flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            View Report Card
                                                        </Link>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 bg-gray-100 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-300 cursor-not-allowed border border-transparent">
                                                            <Clock className="w-4 h-4" />
                                                            Locked
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
