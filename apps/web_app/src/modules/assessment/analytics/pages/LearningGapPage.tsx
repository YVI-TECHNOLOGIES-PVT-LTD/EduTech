import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export const LearningGapPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [recommends, setRecommends] = useState<any[]>([]);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleCreateRecommendation = async () => {
        const studentId = prompt("Enter Student UUID:");
        const subjectId = prompt("Enter Subject UUID:");
        const gap = prompt("Enter Learning Gap description (e.g. Needs focus on linear equations):");

        if (!studentId || !subjectId || !gap) return;

        setLoading(true);
        try {
            // Simulated call to check dropout predictor stubs risk scores
            const riskRes = await axios.post('http://localhost:3000/v1/assessment/analytics/prediction/risk', {
                student_id: studentId
            }, getHeaders());

            const newRec = {
                student_id: studentId,
                gap_description: gap,
                risk_level: riskRes.data.risk_level,
                remedial_class_recommended: true,
                status: 'ASSIGNED'
            };

            setRecommends(prev => [newRec, ...prev]);
            alert(`Learning Gap checked! Remedial status updated. Risk level: ${riskRes.data.risk_level}`);
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/assessment/analytics')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Learning Gaps & Remedials desk
                        </h1>
                        <p className="text-[10px] text-gray-400">
                            Identify student knowledge gap parameters and assign remedial practice guidelines automatically.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleCreateRecommendation}
                    className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold text-xs"
                >
                    Run Learning Gap Analysis
                </button>
            </div>

            {/* List recommendations */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Assigned Remedial Actions</h3>

                {recommends.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-bold flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        No learning gaps identified. All student performance maps within standard boundaries.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recommends.map((rec, i) => (
                            <div key={i} className="py-4 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Student ID: {rec.student_id.substring(0, 8)}</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                        rec.risk_level === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                                        rec.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        Risk: {rec.risk_level}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-400">Gap: {rec.gap_description}</div>
                                <div className="text-[10px] text-emerald-600 font-bold bg-emerald-500/5 p-2 rounded-lg">
                                    Remedial Recommended: Remedial class intervention requested.
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default LearningGapPage;
