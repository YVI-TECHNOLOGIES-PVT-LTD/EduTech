import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { useCOAttainment } from '../hooks/useAnalytics';

export const COAttainmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { calculateCOAttainment } = useCOAttainment();
    const [submitting, setSubmitting] = useState(false);

    const handleCalculate = async () => {
        const subjectId = prompt("Enter Subject UUID:");
        const coCode = prompt("Enter CO Code (e.g. CO-1):");
        if (!subjectId || !coCode) return;

        setSubmitting(true);
        try {
            const res = await calculateCOAttainment(subjectId, coCode);
            alert(`CO Compliance computed successfully! Actual attainment rate: ${res.actual_attainment_pct.toFixed(2)}%. Target status: ${res.status}`);
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
                        Course Outcomes (CO) Attainment
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Map and evaluate student compliance score parameters matching target course outcomes indices.
                    </p>
                </div>
            </div>

            {/* Actions panel */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Process CO compliance checking</h3>
                <p className="text-xs text-gray-400">Calculate percentage targets mapping to curriculum goals.</p>

                <button
                    onClick={handleCalculate}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Calculating attainment...' : 'Run CO Attainment check'}
                </button>
            </div>
        </div>
    );
};
export default COAttainmentPage;
