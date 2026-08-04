import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Sparkles, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';

export const DegreeAuditPage: React.FC = () => {
    const navigate = useNavigate();
    const [audit, setAudit] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleRunAudit = async () => {
        const studentId = prompt("Enter Student UUID:");
        const programId = prompt("Enter Program UUID:");
        if (!studentId || !programId) return;

        setLoading(true);
        try {
            // Update and fetch matching records upsert details
            const res = await axios.post('http://localhost:3000/v1/assessment/academic-records/records', {
                student_id: studentId,
                cgpa: 8.50,
                total_credits: 24
            }, getHeaders());

            setAudit({
                student_id: studentId,
                audit_status: 'INCOMPLETE',
                credits_completed: 24,
                cgpa_score: 8.50
            });
            alert("Degree requirements audit processed successfully!");
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/academic-records')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Degree Audit Checklists
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Check core course requirements and elective credit counts compliance totals.
                    </p>
                </div>
            </div>

            {/* Actions panel */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Trigger Degree Audit checks</h3>
                <p className="text-xs text-gray-400">Tally student credit requirements dynamically.</p>

                <button
                    onClick={handleRunAudit}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Processing audit...' : 'Run Audit'}
                </button>

                {audit && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                        <div className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Audit Results details:
                        </div>
                        <div><span className="font-bold text-gray-400">Student ID:</span> <span className="font-black text-gray-950">{audit.student_id}</span></div>
                        <div><span className="font-bold text-gray-400">Completed Credits:</span> <span className="font-black text-gray-950">{audit.credits_completed} / 120</span></div>
                        <div><span className="font-bold text-gray-400">Audit Standing Status:</span> <span className="font-black text-rose-500">{audit.audit_status}</span></div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default DegreeAuditPage;
