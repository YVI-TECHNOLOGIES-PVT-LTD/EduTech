import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';

export const GradeCalculationPage: React.FC = () => {
    const navigate = useNavigate();
    
    // Grading normalizer parameters states
    const [gradingModel, setGradingModel] = useState<'ABSOLUTE' | 'RELATIVE'>('ABSOLUTE');
    const [graceThreshold, setGraceThreshold] = useState(2);
    const [passPercentage, setPassPercentage] = useState(40);
    const [submitting, setSubmitting] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleRunNormalizer = async () => {
        // Simulator of triggering normalizer for specific attempt
        const attemptId = prompt("Enter student attempt UUID to trigger grading normalizer:");
        if (!attemptId) return;

        setSubmitting(true);
        try {
            const res = await axios.post('http://localhost:3000/v1/assessment/evaluations/grades/calculate', {
                attempt_id: attemptId
            }, getHeaders());

            alert(`Normalizer complete! Final Marks: ${res.data.final_marks} | Grade: ${res.data.grade_label} (GPA: ${res.data.grade_point})`);
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/evaluation')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Grade Normalization & Curve Engine
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Set grace thresholds, configure relative grading scaling curves, and normalise GPAs.
                    </p>
                </div>
            </div>

            {/* Calculations parameters panel */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-6">
                <div className="space-y-4 text-xs">
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-gray-400">Normalizer grading Curve Model</label>
                        <div className="flex gap-2">
                            {(['ABSOLUTE', 'RELATIVE'] as const).map(model => (
                                <button
                                    key={model}
                                    type="button"
                                    onClick={() => setGradingModel(model)}
                                    className={`flex-1 py-2.5 rounded-xl font-bold border transition-all ${
                                        gradingModel === model 
                                            ? 'bg-primary/5 border-primary text-primary' 
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {model}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-400">Grace Marks Cap Limit (Points)</label>
                            <input 
                                type="number" 
                                value={graceThreshold}
                                onChange={(e) => setGraceThreshold(Number(e.target.value))}
                                className="p-2.5 border border-gray-200 rounded-xl"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-400">Baseline Passing Percentage (%)</label>
                            <input 
                                type="number" 
                                value={passPercentage}
                                onChange={(e) => setPassPercentage(Number(e.target.value))}
                                className="p-2.5 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                        onClick={handleRunNormalizer}
                        disabled={submitting}
                        className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                    >
                        <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                        {submitting ? 'Recalculating normalizer...' : 'Trigger Calculation Normalizer'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default GradeCalculationPage;
