import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart2, CheckCircle, HelpCircle } from 'lucide-react';
import { useQuestionAnalytics } from '../hooks/useAnalytics';

export const QuestionAnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const { calculateQuestionStats } = useQuestionAnalytics();
    const [submitting, setSubmitting] = useState(false);

    const handleCalculate = async () => {
        const questionId = prompt("Enter Question Snapshot UUID to analyze:");
        if (!questionId) return;

        setSubmitting(true);
        try {
            const res = await calculateQuestionStats(questionId);
            alert(`Analysis complete! Facility Value: ${res.facility_value.toFixed(2)}. Discrimination Index: ${res.discrimination_index.toFixed(2)}.`);
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
                <button onClick={() => navigate('/app/assessment/analytics')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Question statistics & Quality Indices
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Calculate question item discrimination indices, facility metrics and standard deviation profiles.
                    </p>
                </div>
            </div>

            {/* Actions card */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Trigger Item statistics Calculations</h3>
                <p className="text-xs text-gray-400">Compute statistics values based on student response scripts marks distribution.</p>

                <button
                    onClick={handleCalculate}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Calculating statistics...' : 'Run Item analysis'}
                </button>
            </div>
        </div>
    );
};
export default QuestionAnalyticsPage;
