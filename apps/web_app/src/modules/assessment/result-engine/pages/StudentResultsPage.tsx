import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Award, CheckCircle } from 'lucide-react';
import { useStudentResults } from '../hooks/useResults';

export const StudentResultsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const { results, loading, fetchStudentResults } = useStudentResults(sessionId || undefined);

    useEffect(() => {
        if (sessionId) fetchStudentResults();
    }, [sessionId]);

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/results')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Student Scorecards Register
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Detailed student GPA calculation scores for evaluation run details.
                    </p>
                </div>
            </div>

            {/* scorecards lists */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold">
                        Loading student scorecards...
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-gray-300" />
                        No scorecards computed yet.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {results.map(res => (
                            <div key={res.id} className="py-4 flex justify-between items-center gap-4 text-xs">
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900">Student ID: {res.attempt_id.substring(0, 8)}</div>
                                    <div className="text-[10px] text-gray-400">
                                        Assigned Status: <span className="font-bold text-primary">{res.status}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-black text-gray-900">GPA Score: 8.50</div>
                                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PASS</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default StudentResultsPage;
