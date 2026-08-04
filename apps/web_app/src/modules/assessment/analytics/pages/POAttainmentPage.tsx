import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Award } from 'lucide-react';
import { usePOAttainment } from '../hooks/useAnalytics';

export const POAttainmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { calculatePOAttainment } = usePOAttainment();
    const [submitting, setSubmitting] = useState(false);

    const handleCalculate = async () => {
        const poCode = prompt("Enter PO Code (e.g. PO-1):");
        if (!poCode) return;

        setSubmitting(true);
        try {
            const res = await calculatePOAttainment(poCode);
            alert(`PO compliance calculated! Attainment level: ${res.attainment_score.toFixed(2)} out of ${res.target_score.toFixed(2)}.`);
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
                        Program Outcomes (PO) Attainment
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Calculate compliance score summaries mapping curriculum goals to program outcome indexes.
                    </p>
                </div>
            </div>

            {/* Actions panel */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Process PO compliance checking</h3>
                <p className="text-xs text-gray-400">Tally achievement levels mapping across whole program courses.</p>

                <button
                    onClick={handleCalculate}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Calculating PO attainment...' : 'Run PO Attainment check'}
                </button>
            </div>
        </div>
    );
};
export default POAttainmentPage;
