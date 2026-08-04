import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Calendar,
    ArrowRight,
    FileText,
    Award,
    Clock,
    Ticket,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export const MyExams = () => {
    const { user } = useAuth(); // To get studentId if needed, though mostly implicit in "my" views
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExams();
    }, []);

    // Eligibility State
    const [eligibilityMap, setEligibilityMap] = useState<Record<string, any>>({});
    const [checkingEligibility, setCheckingEligibility] = useState(false);

    useEffect(() => {
        const checkAllEligibility = async () => {
            const upcoming = exams.filter(e => ['SCHEDULED', 'ONGOING'].includes(e.status));
            if (upcoming.length === 0) return;

            setCheckingEligibility(true);
            const newMap: Record<string, any> = {};

            await Promise.all(upcoming.map(async (exam) => {
                try {
                    const res = await apiClient.get('/exams/exam-eligibility', {
                        params: { examId: exam.id, studentId: user?.id }
                    });
                    newMap[exam.id] = res.data;
                } catch (e) {
                    // If error, assume not eligible
                    newMap[exam.id] = { eligible: false, reasons: ['Status Check Failed'] };
                }
            }));

            setEligibilityMap(newMap);
            setCheckingEligibility(false);
        };

        if (exams.length > 0 && user?.id) {
            checkAllEligibility();
        }
    }, [exams, user?.id]);

    const loadExams = async () => {
        try {
            // Fetch all exams - Assuming backend filters for visibility or we filter here
            // Since backend is frozen and usually gives all exams, we might need to filter irrelevant ones
            // But typically /exams endpoint might return all. 
            // For students, we ideally want only their applicable exams.
            // If the current API returns ALL exams for everyone (admin view), we might be showing too much.
            // But in previous context, /exams seems to be the main list.
            // There is no /exams/my endpoint explicitly mentioned in previous phases except result/marks.
            // We will use /exams and hope it's reasonably scoped or just filter client side if needed.
            // Actually, for a student view, if the API returns all exams in the system, it's fine 
            // as long as we show relevant actions.

            const res = await apiClient.get('/exams');
            // Mock eligibility status if not provided by backend to handle UI state
            // In a real scenario without backend changes, we rely on trying to open the ticket.
            setExams(res.data || []);
        } catch (err) {
            console.error("Failed to load exams", err);
        } finally {
            setLoading(false);
        }
    };

    // Grouping
    const upcomingFn = (e: any) => ['SCHEDULED', 'ONGOING'].includes(e.status);
    const completedFn = (e: any) => ['COMPLETED', 'LOCKED', 'PUBLISHED'].includes(e.status);

    const upcomingExams = exams.filter(upcomingFn);
    const completedExams = exams.filter(completedFn);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-8 space-y-6">
                <div className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="h-64 bg-gray-50 rounded-2xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Award className="w-8 h-8 text-indigo-600" />
                    My Examinations
                </h1>
                <p className="text-gray-500 font-medium mt-2 text-lg">
                    Access your hall tickets, schedules, and report cards in one place.
                </p>
            </div>

            {/* Upcoming Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">Upcoming & Ongoing</h2>
                </div>

                {upcomingExams.length > 0 ? (
                    <div className="grid gap-6">
                        {upcomingExams.map(exam => (
                            <div key={exam.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${exam.status === 'ONGOING' ? 'bg-indigo-500 text-white animate-pulse' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {exam.status}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                {new Date(exam.start_date).getFullYear()}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {exam.name}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {checkingEligibility ? (
                                    <div className="h-12 w-full bg-gray-100 rounded-2xl animate-pulse"></div>
                                ) : eligibilityMap[exam.id]?.eligible ? (
                                    <Link
                                        to={`/app/student/exams/hall-ticket?examId=${exam.id}&studentId=${user?.id}`}
                                        className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                                    >
                                        <Ticket className="w-5 h-5" />
                                        View Hall Ticket
                                    </Link>
                                ) : (
                                    <div className="px-6 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl border border-gray-200 flex items-center gap-3 w-full md:w-auto justify-center cursor-not-allowed">
                                        <AlertCircle className="w-5 h-5" />
                                        {eligibilityMap[exam.id] ? 'Not Eligible / Not Seated' : 'Checking...'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 opacity-60">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900">No scheduled exams</h3>
                        <p className="text-sm text-gray-500">Prepare well for the next one!</p>
                    </div>
                )}
            </section>

            {/* History Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">Completed & Results</h2>
                </div>

                {completedExams.length > 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {completedExams.map(exam => {
                                const isPublished = exam.status === 'PUBLISHED';
                                return (
                                    <div key={exam.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${isPublished ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {isPublished ? 'A+' : '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{exam.name}</h4>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    Ended on {new Date(exam.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {isPublished ? (
                                            <Link
                                                to={`/app/student/exams/report-card?examId=${exam.id}&studentId=${user?.id}`}
                                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" /> View Report Card
                                            </Link>
                                        ) : (
                                            <div className="px-5 py-2.5 bg-gray-50 text-gray-400 font-bold rounded-xl flex items-center gap-2 cursor-wait">
                                                <Clock className="w-4 h-4" /> Results Awaited
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400 font-medium text-center py-12">
                        No history available yet.
                    </div>
                )}
            </section>
        </div>
    );
};
