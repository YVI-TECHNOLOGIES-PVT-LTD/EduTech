import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Plus, Sparkles, AlertCircle, FileText, CheckCircle, Trash2, 
    ArrowUpRight, Download, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import { usePaperGenerator } from '../hooks/usePaperGenerator';

export const PaperDashboardPage: React.FC = () => {
    const { papers, jobs, loading, deletePaper, transitionStatus, triggerExport } = usePaperGenerator();
    const [selectedPaperForExport, setSelectedPaperForExport] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<'PDF' | 'DOCX' | 'HTML' | 'ZIP'>('PDF');
    const [exportType, setExportType] = useState<'candidate' | 'moderator' | 'answer_key'>('candidate');
    const [exportLoading, setExportLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleExport = async (paperId: string) => {
        setExportLoading(true);
        try {
            const res = await triggerExport(paperId, exportFormat, exportType);
            setSuccessMessage(`Export successful! Package stored at: ${res.file_path}`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setExportLoading(false);
            setSelectedPaperForExport(null);
        }
    };

    const handleTransition = async (paperId: string, currentStatus: string) => {
        let nextStatus = '';
        if (currentStatus === 'DRAFT') nextStatus = 'GENERATED';
        else if (currentStatus === 'GENERATED') nextStatus = 'VALIDATED';
        else if (currentStatus === 'VALIDATED') nextStatus = 'APPROVED';
        else if (currentStatus === 'APPROVED') nextStatus = 'PUBLISHED';
        else return;

        try {
            await transitionStatus(paperId, nextStatus, 'Standard dashboard state progression check');
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        Phase 9 Paper Generator
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Examination Papers Dashboard
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure layout templates, balance questions difficulty pools, and publish immutable exams.
                    </p>
                </div>
                <Link to="/app/assessment/papers/wizard" className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]">
                    <Plus className="w-4 h-4" />
                    New Generated Paper
                </Link>
            </div>

            {successMessage && (
                <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {successMessage}
                </div>
            )}

            {/* Content main lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Papers list */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Generated Examination Papers
                        </h3>

                        {papers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
                                <div className="text-xs font-bold text-gray-400">No generated papers found.</div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {papers.map(paper => (
                                    <div key={paper.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-gray-900 dark:text-white">{paper.name}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                                    paper.status === 'PUBLISHED' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                    {paper.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-3">
                                                <span>Marks: {paper.total_marks}</span>
                                                <span>Version: {paper.version}</span>
                                                <span>Date: {new Date(paper.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link 
                                                to={`/app/assessment/papers/${paper.id}`}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-xl"
                                                title="Preview Copy"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Link>

                                            {paper.status !== 'PUBLISHED' && (
                                                <button
                                                    onClick={() => handleTransition(paper.id, paper.status)}
                                                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-xl border border-gray-200"
                                                >
                                                    Progress Status
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setSelectedPaperForExport(paper.id)}
                                                className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl"
                                                title="Export File"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    if (confirm('Delete this generated paper?')) {
                                                        await deletePaper(paper.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Queue log column */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                            Active Generation Queue
                        </h3>

                        {jobs.length === 0 ? (
                            <div className="text-center py-6 text-xs text-gray-400 font-bold">
                                No active generation jobs.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.slice(0, 5).map(job => (
                                    <div key={job.id} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400 font-bold">Job ID: {job.id.substring(0, 8)}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                                                job.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500' :
                                                'bg-amber-500/10 text-amber-500 animate-pulse'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        {job.error_message && (
                                            <div className="text-[9px] text-rose-500 font-bold bg-rose-500/5 p-2 rounded-lg flex items-center gap-1.5">
                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                {job.error_message}
                                            </div>
                                        )}
                                        <div className="text-[8px] font-mono text-gray-400 max-h-24 overflow-y-auto bg-gray-900/5 p-2 rounded-lg">
                                            {job.logs?.map((log, i) => (
                                                <div key={i}>{log}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Export dialog portal */}
            {selectedPaperForExport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 max-w-sm w-full space-y-4 shadow-premium-xl">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Configure Export Package
                        </h4>

                        <div className="space-y-3 text-xs">
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Target Format</label>
                                <select 
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value as any)}
                                    className="p-2 border border-gray-200 rounded-xl"
                                >
                                    <option value="PDF">PDF (Default Document)</option>
                                    <option value="DOCX">Microsoft Word (DOCX)</option>
                                    <option value="HTML">HTML Bundle</option>
                                    <option value="ZIP">ZIP Encrypted Archive</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Target Type</label>
                                <select 
                                    value={exportType}
                                    onChange={(e) => setExportType(e.target.value as any)}
                                    className="p-2 border border-gray-200 rounded-xl"
                                >
                                    <option value="candidate">Candidate Copy</option>
                                    <option value="moderator">Moderator Copy</option>
                                    <option value="answer_key">Answer Key Sheet</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 text-xs">
                            <button 
                                onClick={() => setSelectedPaperForExport(null)}
                                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleExport(selectedPaperForExport)}
                                disabled={exportLoading}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold"
                            >
                                {exportLoading ? 'Exporting...' : 'Export'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PaperDashboardPage;
