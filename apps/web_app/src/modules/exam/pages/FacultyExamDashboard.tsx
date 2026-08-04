import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { FacultyApi } from '../../../api/facultyStaff.api';
import { useAuth } from '../../../context/AuthContext';
import {
    Calendar,
    BookOpen,
    PenTool,
    AlertCircle,
    FileText,
    Eye,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyExamDashboard = () => {
    const { user } = useAuth();
    const [mySubjects, setMySubjects] = useState<any[]>([]);
    const [assignedExams, setAssignedExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            // 1. Get My Subjects
            const subjectsRes = await FacultyApi.getMySubjects();
            const subjects = subjectsRes || [];
            setMySubjects(subjects);

            if (subjects.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Get Active Exams
            const examsRes = await apiClient.get('/exams');
            const allExams = examsRes.data || [];
            const activeExams = allExams.filter((e: any) => e.status !== 'COMPLETED');

            // 3. Find Schedules for my subjects in active exams
            const relevantExams: any[] = [];

            // Note: This is a N+1 generic fetch approach because we don't have a dedicated endpoint
            // We optimize by only checking active exams (usually 1 or 2)
            await Promise.all(activeExams.map(async (exam: any) => {
                try {
                    const schRes = await apiClient.get('/exams/exam-schedules', { params: { examId: exam.id } });
                    const schedules = schRes.data || [];

                    // Filter schedules that match my subjects
                    const mySchedules = schedules.filter((sch: any) =>
                        subjects.some((sub: any) => sub.subject?.id === sch.subject_id)
                    );

                    if (mySchedules.length > 0) {
                        relevantExams.push({
                            ...exam,
                            mySchedules
                        });
                    }
                } catch (e) {
                    console.error("Failed to load schedules for exam", exam.id);
                }
            }));

            setAssignedExams(relevantExams);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-4 max-w-5xl mx-auto">
                <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-48 bg-gray-50 rounded-2xl animate-pulse"></div>
                    <div className="h-48 bg-gray-50 rounded-2xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 py-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-indigo-600" />
                        Exam Duties
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Manage marks and question papers for your assigned subjects.
                    </p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Faculty Portal
                </div>
            </div>

            {/* Notices / Global Status */}
            {assignedExams.some(e => e.status === 'PUBLISHED') && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                        <p className="font-bold text-emerald-900 text-sm">Results Published</p>
                        <p className="text-xs text-emerald-700 mt-0.5">Some exams have published results. Marks entry is now disabled for those exams.</p>
                    </div>
                </div>
            )}

            {/* Exam Cards */}
            <div className="grid grid-cols-1 gap-8">
                {assignedExams.length > 0 ? (
                    assignedExams.map((exam) => (
                        <div key={exam.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                            {/* Card Header */}
                            <div className="bg-gray-50/50 p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-black text-gray-900">{exam.name}</h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                                                exam.status === 'LOCKED' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-50 text-blue-700'
                                            }`}>
                                            {exam.status}
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        to="/app/faculty/exams/invigilation"
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <Eye className="w-3 h-3" /> View Seating
                                    </Link>
                                </div>
                            </div>

                            {/* Subjects List */}
                            <div className="p-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Your Subject Schedules</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exam.mySchedules.map((sch: any) => {
                                        const isLocked = exam.status === 'LOCKED' || exam.status === 'PUBLISHED';
                                        return (
                                            <div key={sch.id} className="border border-gray-100 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-md transition-all bg-white relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="font-bold text-gray-900">{sch.subject?.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{sch.subject?.code}</div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <BookOpen className="w-4 h-4" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                        <Clock className="w-3 h-3 text-gray-300" />
                                                        {new Date(sch.exam_date).toLocaleDateString()} • {sch.start_time.slice(0, 5)}
                                                    </div>

                                                    <div className="h-px bg-gray-50 my-2" />

                                                    <div className="flex gap-2">
                                                        {/* Marks Entry Action */}
                                                        <Link
                                                            to={`/app/faculty/exams/marks?examId=${exam.id}&subjectId=${sch.subject_id}`}
                                                            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-colors ${isLocked
                                                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100'
                                                                }`}
                                                        >
                                                            {isLocked ? 'Marks Locked' : 'Enter Marks'}
                                                        </Link>

                                                        {/* QP Action */}
                                                        <Link
                                                            to={`/app/faculty/exams/question-papers?examId=${exam.id}&scheduleId=${sch.id}`}
                                                            className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                                                            title="Upload Question Paper"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <BookOpen className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Exams Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            You don't have any exam duties assigned for your subjects at the moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
