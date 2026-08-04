import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';
import { useRankings } from '../hooks/useResults';

export const RankingPage: React.FC = () => {
    const navigate = useNavigate();
    const { calculateRankings, loading } = useRankings();
    const [submitting, setSubmitting] = useState(false);

    const handleCalculate = async () => {
        const sessionId = prompt("Enter Result Session UUID to run cohort rankings ranking logic:");
        if (!sessionId) return;

        setSubmitting(true);
        try {
            await calculateRankings(sessionId);
            alert("Cohort rankings successfully calculated!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/results')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Cohort Merit Rankings Board
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Compute cohort merit order positions dynamically based on CGPA indexes.
                    </p>
                </div>
            </div>

            {/* Form actions */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Trigger Rankings Engine</h3>
                <p className="text-xs text-gray-400">Calculate merit positions across the current student body batch.</p>

                <button
                    onClick={handleCalculate}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Processing Cohort rankings...' : 'Calculate Merit rankings'}
                </button>
            </div>
        </div>
    );
};
export default RankingPage;
