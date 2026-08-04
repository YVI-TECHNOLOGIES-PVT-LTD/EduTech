import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';
import { usePromotion } from '../hooks/useResults';

export const PromotionPage: React.FC = () => {
    const navigate = useNavigate();
    const { processPromotion } = usePromotion();
    const [submitting, setSubmitting] = useState(false);

    const handleProcess = async () => {
        const studentId = prompt("Enter Student UUID:");
        const yearId = prompt("Enter Academic Year UUID:");
        const gpa = Number(prompt("Enter GPA Score:", "8.50"));
        const backlogs = Number(prompt("Enter backlogs count:", "0"));

        if (!studentId || !yearId) return;

        setSubmitting(true);
        try {
            const decision = await processPromotion(studentId, yearId, gpa, backlogs);
            alert(`Promotion decision complete! Status: ${decision.decision}. Remarks: ${decision.remarks}`);
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
                        Student Promotions Register
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Process promotion parameters checking based on CGPA indexes and backlog counts.
                    </p>
                </div>
            </div>

            {/* Actions panel */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Process Promotion Parameters Checks</h3>
                <p className="text-xs text-gray-400">Determine status mappings (PASS, COMPARTMENT, REPEAT) for specific student cohort records.</p>

                <button
                    onClick={handleProcess}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Processing promotions engine...' : 'Run Promotions Engine'}
                </button>
            </div>
        </div>
    );
};
export default PromotionPage;
