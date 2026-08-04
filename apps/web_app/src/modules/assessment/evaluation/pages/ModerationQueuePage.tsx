import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { useModeration } from '../hooks/useEvaluation';

export const ModerationQueuePage: React.FC = () => {
    const navigate = useNavigate();
    const { queue, loading, fetchQueue, resolveModeration } = useModeration();
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleResolve = async (queueId: string, firstMarks: number, secondMarks: number) => {
        // Simple mock resolution setting: choose average score or custom moderation
        const midScore = (Number(firstMarks) + Number(secondMarks)) / 2;
        try {
            await resolveModeration(queueId, midScore, 'RESOLVED', remarks);
            alert('Moderation resolved successfully. Marks normalized.');
            setRemarks('');
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/evaluation')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Blind Moderation Queue
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Compare evaluators grading metrics discrepancies and resolve variances above thresholds limits.
                    </p>
                </div>
            </div>

            {/* List queue */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Discrepancy Script Alerts
                </h3>

                {loading ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold">
                        Loading discrepancy log...
                    </div>
                ) : queue.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        No high variance discrepancies to moderate. All examiner scoring is within bounds.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {queue.map(item => (
                            <div key={item.id} className="py-4 space-y-3 text-xs">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="font-bold text-gray-900">Session ID: {item.session_id.substring(0, 8)}</div>
                                        <div className="text-[10px] text-gray-400">Variance percentage: <span className="font-black text-rose-500">{item.variance_pct}%</span></div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                        item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div>
                                        <span className="text-[10px] text-gray-400">First Evaluator:</span>
                                        <div className="font-black text-gray-800">{item.first_evaluator_marks} Points</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400">Second Evaluator:</span>
                                        <div className="font-black text-gray-800">{item.second_evaluator_marks} Points</div>
                                    </div>
                                </div>

                                {item.status === 'PENDING' && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Head examiner resolution comments..." 
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-xl"
                                        />
                                        <button 
                                            onClick={() => handleResolve(item.id, item.first_evaluator_marks, item.second_evaluator_marks)}
                                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl whitespace-nowrap"
                                        >
                                            Resolve Discrepancy (Average out)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default ModerationQueuePage;
