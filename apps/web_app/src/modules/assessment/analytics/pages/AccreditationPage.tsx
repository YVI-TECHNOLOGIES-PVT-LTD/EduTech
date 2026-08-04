import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RefreshCw, BarChart2, ShieldCheck, Printer } from 'lucide-react';

export const AccreditationPage: React.FC = () => {
    const navigate = useNavigate();
    const [reportType, setReportType] = useState<'NBA' | 'NAAC' | 'ABET' | 'AACSB' | 'NIRF'>('NBA');
    const [metrics, setMetrics] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleCompileReport = async () => {
        setSubmitting(true);
        try {
            const res = await axios.post('http://localhost:3000/v1/assessment/analytics/accreditation/compile', {
                report_type: reportType
            }, getHeaders());
            setMetrics(res.data);
            alert("Accreditation metrics compiled successfully!");
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setSubmitting(false);
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
                            Accreditation & Audits Reports
                        </h1>
                        <p className="text-[10px] text-gray-400">
                            Compile official report matrices matching NBA, NAAC, or ABET standards templates.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold border border-gray-200 text-xs"
                    >
                        <Printer className="w-4 h-4" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* Config details */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
                    <div className="flex flex-col gap-1 flex-1 w-full">
                        <label className="font-bold text-gray-400">Report Template Standard</label>
                        <select 
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as any)}
                            className="p-2.5 border border-gray-200 rounded-xl"
                        >
                            <option value="NBA">National Board of Accreditation (NBA)</option>
                            <option value="NAAC">NAAC Quality Assessment Report</option>
                            <option value="ABET">ABET Engineering Criteria</option>
                            <option value="AACSB">AACSB Business Accreditation</option>
                            <option value="NIRF">NIRF India Rankings</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCompileReport}
                        disabled={submitting}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-premium-sm self-end w-full sm:w-auto"
                    >
                        {submitting ? 'Compiling statistics...' : 'Compile Compliance Report'}
                    </button>
                </div>

                {/* Audit preview details sheet */}
                {metrics && (
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 text-xs">
                        <div className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                            Compiled compliance indices:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-center">
                                <div className="text-[9px] text-slate-400">NBA Criteria compliance</div>
                                <span className="font-black text-primary">{metrics.attainment_metrics_json?.criteria_1_compliance_pct}%</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-center">
                                <div className="text-[9px] text-slate-400">NAAC score index</div>
                                <span className="font-black text-primary">{metrics.attainment_metrics_json?.accreditation_attainment_index} / 4.00</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-center">
                                <div className="text-[9px] text-slate-400">Status</div>
                                <span className="font-black text-emerald-500">COMPLIANT</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default AccreditationPage;
