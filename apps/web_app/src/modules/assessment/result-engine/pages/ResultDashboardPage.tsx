import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Sparkles, ClipboardList, ShieldAlert, Award, FileText, CheckCircle, 
    ArrowUpRight, Clock, Users, Activity, BarChart2, ShieldCheck, RefreshCw
} from 'lucide-react';
import { useResults } from '../hooks/useResults';

export const ResultDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, loading, createSession, calculateResults, transitionWorkflow, publishResults } = useResults();

    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const handleCreateSession = async () => {
        const yearId = prompt("Enter Academic Year UUID:");
        const termId = prompt("Enter Term UUID:");
        if (!yearId || !termId) return;

        try {
            await createSession(yearId, termId);
            alert("Result session successfully created!");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCalculate = async (sessionId: string) => {
        try {
            await calculateResults(sessionId);
            alert("GPA and credit calculations successfully processed!");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleWorkflowTransition = async (sessionId: string, status: string) => {
        try {
            await transitionWorkflow(sessionId, status, 'Standard progress checklist checks');
            alert(`Result status successfully updated to: ${status}`);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handlePublish = async (sessionId: string) => {
        try {
            await publishResults(sessionId, 'STUDENT_PORTAL');
            alert("Results published and locked officially!");
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        Phase 12 Result Engine
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Results Processing & Publication
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Process GPAs, calculate student promotion checklists, and publish official academic snapshots.
                    </p>
                </div>

                <button 
                    onClick={handleCreateSession}
                    className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]"
                >
                    Create Result Session
                </button>
            </div>

            {/* Main contents splits grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Result calculation sessions logs list */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Active Result Processing Runs
                        </h3>

                        {loading ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                Loading calculation runs...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                No active result sessions created.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {sessions.map(s => (
                                    <div key={s.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">Session ID: {s.id.substring(0, 8)}</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                    s.status === 'LOCKED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                Created: {new Date(s.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {s.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleCalculate(s.id)}
                                                    className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl"
                                                >
                                                    Run CGPA Calculations
                                                </button>
                                            )}

                                            {s.status === 'CALCULATED' && (
                                                <button
                                                    onClick={() => handleWorkflowTransition(s.id, 'UNDER_VERIFICATION')}
                                                    className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-xl"
                                                >
                                                    Send for Verification
                                                </button>
                                            )}

                                            {s.status === 'UNDER_VERIFICATION' && (
                                                <button
                                                    onClick={() => handleWorkflowTransition(s.id, 'APPROVED')}
                                                    className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-xl"
                                                >
                                                    Approve & Sign marks
                                                </button>
                                            )}

                                            {s.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => handlePublish(s.id)}
                                                    className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-xl"
                                                >
                                                    Publish & Freeze Official Snapshots
                                                </button>
                                            )}

                                            <Link 
                                                to={`/app/assessment/results/student-results?sessionId=${s.id}`}
                                                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl"
                                                title="View Student Results"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* operations toolbox */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Auxiliary Engines
                        </h3>
                        <div className="space-y-3 text-xs">
                            <Link to="/app/assessment/results/rankings" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Cohort Merit Rankings Board
                            </Link>
                            <Link to="/app/assessment/results/promotions" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Student Promotions Register
                            </Link>
                            <Link to="/app/assessment/results/grade-cards" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Official Grade Cards Printing
                            </Link>
                            <Link to="/app/assessment/results/transcripts" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Transcripts & Alumni Records
                            </Link>
                            <Link to="/app/assessment/results/analytics" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Institutional Pass/Fail analytics
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ResultDashboardPage;
