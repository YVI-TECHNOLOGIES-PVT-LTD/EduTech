import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { useRevaluation } from '../hooks/useEvaluation';

export const RevaluationPage: React.FC = () => {
    const navigate = useNavigate();
    const { requests, loading, fetchRequests, approveRevaluation } = useRevaluation();
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (requestId: string) => {
        try {
            await approveRevaluation(requestId, remarks || 'Approved for re-evaluation workflow review.');
            alert('Revaluation request approved!');
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
                        Re-evaluation Desk Requests
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Process revaluation queries filed by students, verify review fees and assign to re-evaluators.
                    </p>
                </div>
            </div>

            {/* List requests */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Assigned Revaluation Petitions
                </h3>

                {loading ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold">
                        Loading requests workload...
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        No re-evaluation desk tickets found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map(item => (
                            <div key={item.id} className="py-4 space-y-3 text-xs">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="font-bold text-gray-900">Attempt ID: {item.attempt_id.substring(0, 8)}</div>
                                        <div className="text-[10px] text-gray-400">Reason: {item.reason}</div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                        item.status === 'REQUESTED' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>

                                {item.status === 'REQUESTED' && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Approval remarks feedback..." 
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-xl"
                                        />
                                        <button 
                                            onClick={() => handleApprove(item.id)}
                                            className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl whitespace-nowrap"
                                        >
                                            Approve Revaluation
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
export default RevaluationPage;
