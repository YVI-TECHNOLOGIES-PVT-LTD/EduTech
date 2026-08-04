import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { LayoutDashboard, Calendar, FileText, CheckCircle2, AlertCircle, Clock, ChevronRight, PenTool, Armchair, Ticket, Search, Loader2, RefreshCw, Lock, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ExamDashboard = () => {
    // Core Data
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Lifecycle Context
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [lifecycle, setLifecycle] = useState<{
        scheduling: 'PENDING' | 'DONE' | 'READY';
        eligibility: 'PENDING' | 'READY' | 'DONE' | 'BLOCKED';
        seating: 'BLOCKED' | 'READY' | 'DONE';
        hallTickets: 'BLOCKED' | 'READY' | 'DONE';
        marksEntry: 'BLOCKED' | 'READY' | 'DONE';
        publishMarks: 'BLOCKED' | 'READY' | 'DONE';
    }>({
        scheduling: 'PENDING',
        eligibility: 'PENDING',
        seating: 'BLOCKED',
        hallTickets: 'BLOCKED',
        marksEntry: 'BLOCKED',
        publishMarks: 'BLOCKED'
    });
    const [lifecycleLoading, setLifecycleLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({ upcoming: 0, completed: 0, published: 0 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchInitData();
    }, []);

    useEffect(() => {
        if (selectedExamId) {
            fetchLifecycleStatus(selectedExamId);
        }
    }, [selectedExamId]);

    const fetchInitData = async () => {
        try {
            const res = await apiClient.get('/exams');
            const data = res.data || [];
            setExams(data);

            // Calculate KPI
            const upcoming = data.filter((e: any) => ['SCHEDULED', 'DRAFT'].includes(e.status)).length;
            const completed = data.filter((e: any) => e.status === 'COMPLETED').length;
            const published = data.filter((e: any) => e.status === 'PUBLISHED').length;
            setStats({ upcoming, completed, published });

            // Auto-select most recent upcoming exam
            const recent = data.find((e: any) => e.status === 'SCHEDULED' || e.status === 'DRAFT');
            if (recent) setSelectedExamId(recent.id);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLifecycleStatus = async (examId: string) => {
        setLifecycleLoading(true);
        try {
            // Get Status from loaded exams
            const currentExam = exams.find(e => e.id === examId);
            const isPublished = currentExam?.status === 'PUBLISHED';

            // 1. Check Scheduling
            const schRes = await apiClient.get('/exams/exam-schedules', { params: { examId } });
            const schedules = schRes.data || [];
            const isScheduled = schedules.length > 0;

            // 2. Check Eligibility
            const isEligibleDone = !!currentExam?.eligibility_frozen;

            // 3. Check Seating
            let isSeated = false;
            if (isScheduled) {
                try {
                    const seatRes = await apiClient.get('/exams/seating', { params: { examId } });
                    if (seatRes.data && seatRes.data.length > 0) isSeated = true;
                } catch (e) { }
            }

            // 4. Hall Tickets Check
            const isHTGenerated = currentExam?.hall_ticket_status === 'GENERATED' || currentExam?.hall_ticket_status === 'PUBLISHED';
            const isHTPublished = currentExam?.hall_ticket_status === 'PUBLISHED';

            // 5. Marks Entry Check
            // If exam is LOCKED or PUBLISHED, marks entry is considered "DONE" (finalized)
            const isMarksDone = currentExam?.status === 'LOCKED' || currentExam?.status === 'PUBLISHED';

            // 6. Publication Check
            const isFinalPublished = currentExam?.status === 'PUBLISHED';

            setLifecycle({
                scheduling: isScheduled ? 'DONE' : 'READY',
                eligibility: isEligibleDone ? 'DONE' : (isScheduled ? 'READY' : 'BLOCKED'),
                seating: isSeated ? 'DONE' : (isEligibleDone ? 'READY' : 'BLOCKED'),
                hallTickets: isHTPublished ? 'DONE' : (isSeated ? 'READY' : 'BLOCKED'),
                marksEntry: isMarksDone ? 'DONE' : (isHTPublished ? 'READY' : 'BLOCKED'),
                publishMarks: isFinalPublished ? 'DONE' : (isMarksDone ? 'READY' : 'BLOCKED')
            });

        } catch (e) {
            console.error("Lifecycle check failed", e);
        } finally {
            setLifecycleLoading(false);
        }
    };

    const selectedExam = exams.find(e => e.id === selectedExamId);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                    Examination Orchestrator
                </h1>
                <p className="text-gray-500 font-medium mt-1">Manage the complete lifecycle of your examinations from a single command center.</p>
            </div>

            {/* KPI Cards (Compact) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><Calendar className="w-6 h-6" /></div>
                    <div>
                        <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Upcoming</div>
                        <div className="text-2xl font-black text-gray-900">{stats.upcoming}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                        <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Completed</div>
                        <div className="text-2xl font-black text-gray-900">{stats.completed}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><FileText className="w-6 h-6" /></div>
                    <div>
                        <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Published</div>
                        <div className="text-2xl font-black text-gray-900">{stats.published}</div>
                    </div>
                </div>
            </div>

            {/* MAIN ORCHESTRATOR */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                {/* 1. Exam Selector Toolbar */}
                <div className="bg-gray-900 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <PenTool className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">Exam Lifecycle</h2>
                            <p className="text-xs text-gray-400">Select an exam to manage its workflow</p>
                        </div>
                    </div>

                    <div className="w-full md:w-[400px]">
                        <select
                            className="w-full p-3 pl-4 pr-10 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-gray-750 transition-colors"
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                        >
                            <option value="" disabled>-- Select Exam --</option>
                            {exams.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.status})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Context Info */}
                {selectedExam && (
                    <div className="bg-gray-50 border-b border-gray-200 px-8 py-4 flex gap-8 whitespace-nowrap overflow-x-auto">
                        <div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Exam Name</span>
                            <span className="text-sm font-bold text-gray-900">{selectedExam.name}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Type</span>
                            <span className="text-sm font-bold text-gray-900 capitalize">{(selectedExam.type || 'GENERAL').toLowerCase()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Start Date</span>
                            <span className="text-sm font-bold text-gray-900">{new Date(selectedExam.start_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Scope</span>
                            <span className="text-sm font-bold text-gray-900">{selectedExam.applicable_classes?.length || 0} Classes</span>
                        </div>
                    </div>
                )}

                {/* 3. Lifecycle Cards */}
                <div className="p-8">
                    {!selectedExamId ? (
                        <div className="text-center py-20 opacity-50">
                            <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-bold text-gray-400">No Exam Selected</h3>
                            <p className="text-gray-400">Please select an exam from the toolbar above to view its lifecycle.</p>
                        </div>
                    ) : lifecycleLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-6 relative">
                            {/* Connecting Lines (Desktop) */}
                            <div className="hidden md:block absolute top-[12%] left-0 w-full h-1 bg-gray-100 z-0"></div>
                            <div className="hidden md:block absolute top-[62%] left-0 w-full h-1 bg-gray-100 z-0"></div>

                            {/* CARD 1: SCHEDULING */}
                            <LifecycleCard
                                title="1. Scheduling"
                                description="Define subjects, dates, and times."
                                status={lifecycle.scheduling}
                                icon={Calendar}
                                cta="Manage Timetable"
                                link="/app/exam-admin/timetable"
                                isFirst
                            />

                            {/* CARD 2: ELIGIBILITY */}
                            <LifecycleCard
                                title="2. Eligibility"
                                description="Check attendance and fee rules."
                                status={lifecycle.eligibility}
                                icon={CheckCircle2}
                                cta="Check Eligibility"
                                link="/app/exam-admin/eligibility"
                            />

                            {/* CARD 3: SEATING */}
                            <LifecycleCard
                                title="3. Seating"
                                description="Allocate students to halls."
                                status={lifecycle.seating}
                                icon={Armchair}
                                cta="Manage Seating"
                                link="/app/exam-admin/seating"
                            />

                            {/* CARD 4: HALL TICKETS */}
                            <LifecycleCard
                                title="4. Hall Tickets"
                                description="Finalize and issue tickets."
                                status={lifecycle.hallTickets}
                                icon={Ticket}
                                cta="Verify Readiness"
                                link="/app/exam-admin/hall-tickets"
                            />

                            {/* CARD 5: MARKS ENTRY */}
                            <LifecycleCard
                                title="5. Marks Entry"
                                description="Enter scores and lock subjects."
                                status={lifecycle.marksEntry}
                                icon={PenTool}
                                cta="Go to Marks Entry"
                                link="/app/exam-admin/manage"
                            />

                            {/* CARD 6: PUBLISH MARKS */}
                            <LifecycleCard
                                title="6. Publish Marks"
                                description="Release results to portals."
                                status={lifecycle.publishMarks}
                                icon={GraduationCap}
                                cta="Publish Results"
                                link="/app/exam-admin/results"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links Section (optional, non-intrusive) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                <Link to="/app/exam-admin/manage" className="group p-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-indigo-200 transition-colors">
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Create New Exam</h3>
                        <p className="text-xs text-gray-500">Initialize a new exam window.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500" />
                </Link>
                <Link to="/app/exam-admin/results" className="group p-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition-colors">
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Results & Marks</h3>
                        <p className="text-xs text-gray-500">Post-exam processing.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500" />
                </Link>
            </div>
        </div>
    );
};

// --- Subcomponent: Lifecycle Card ---
interface LifecycleCardProps {
    title: string;
    description: string;
    status: 'PENDING' | 'DONE' | 'READY' | 'BLOCKED';
    icon: any;
    cta: string;
    link: string;
    isFirst?: boolean;
}

const LifecycleCard = ({ title, description, status, icon: Icon, cta, link, isFirst }: LifecycleCardProps) => {
    // Styles mapping
    const styles = {
        DONE: { border: 'border-emerald-500', bg: 'bg-white', iconBg: 'bg-emerald-500 text-white', text: 'text-gray-900', badge: 'bg-emerald-100 text-emerald-700' },
        READY: { border: 'border-indigo-500', bg: 'bg-white', iconBg: 'bg-indigo-600 text-white', text: 'text-gray-900', badge: 'bg-indigo-100 text-indigo-700' },
        PENDING: { border: 'border-gray-200', bg: 'bg-gray-50', iconBg: 'bg-gray-200 text-gray-400', text: 'text-gray-400', badge: 'bg-gray-100 text-gray-500' },
        BLOCKED: { border: 'border-red-200', bg: 'bg-red-50', iconBg: 'bg-red-100 text-red-400', text: 'text-gray-400', badge: 'bg-red-100 text-red-600' },
    };

    const style = styles[status];
    const isInteractive = status === 'READY' || status === 'DONE';

    // Override for pending which might be clickable if it's the first step (Scheduling)
    // Actually Scheduling can be 'PENDING' but user needs to click it to start.
    // So 'PENDING' for Scheduling should be interactive.
    // Let's rely on logic: If First Step, always interactive.
    const canClick = isInteractive || isFirst;

    return (
        <div className={`relative z-10 rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col h-full ${style.border} ${style.bg} ${canClick ? 'hover:-translate-y-1 hover:shadow-xl' : 'opacity-80'}`}>

            {/* Status Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${style.iconBg}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
                    {status}
                </span>
            </div>

            <div className="mb-6 flex-1">
                <h3 className={`font-black text-lg mb-1 ${style.text}`}>{title}</h3>
                <p className="text-xs font-bold text-gray-400 leading-relaxed">{description}</p>
            </div>

            <div>
                {canClick ? (
                    <Link to={link} className={`block w-full py-3 rounded-xl text-center text-sm font-bold transition-colors ${status === 'DONE' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-black shadow-lg'}`}>
                        {cta}
                    </Link>
                ) : (
                    <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-transparent border border-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed">
                        {status === 'BLOCKED' ? <Lock className="w-3 h-3" /> : (status === 'PENDING' ? <Clock className="w-3 h-3" /> : null)}
                        {status === 'BLOCKED' ? 'Locked' : 'Pending Previous'}
                    </div>
                )}
            </div>

            {/* Helper Text for Blocked */}
            {status === 'BLOCKED' && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-[10px] font-bold text-red-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Must complete previous step
                </div>
            )}
        </div>
    );
};
