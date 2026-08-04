import { useEffect, useState } from 'react';
import { importHistoryApi, ImportJob } from '../../../api/importHistory.api';
import { useAuth } from '../../../context/AuthContext';
import {
    Clock,
    CheckCircle2,
    XCircle,
    DownloadCloud,
    AlertTriangle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { ImportWizard } from '../../../components/import/ImportWizard';

export const ImportHistoryPage = () => {
    const { user, hasPermission } = useAuth();
    const [jobs, setJobs] = useState<ImportJob[]>([]);
    const [loading, setLoading] = useState(true);

    // Re-Import State
    const [reImportOpen, setReImportOpen] = useState(false);
    const [reImportFile, setReImportFile] = useState<File | undefined>(undefined);
    const [reImportEntity, setReImportEntity] = useState<any>('STUDENT');

    // Basic RP Access Control Check
    const canAccess = hasPermission('admin.dashboard.view') ||
                      hasPermission('TRANSPORT_SETUP') ||
                      hasPermission('FACULTY_PROFILE_MANAGE') ||
                      hasPermission('STUDENT_CREATE');

    useEffect(() => {
        if (canAccess) {
            fetchHistory();
        }
    }, [canAccess]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await importHistoryApi.getImportHistory();
            setJobs(data || []);
        } catch (err) {
            console.error("Failed to fetch import history", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReImport = async (job: ImportJob) => {
        // Prevent accidental clicks
        if (!confirm("Start re-import for failed rows?")) return;

        setLoading(true);
        try {
            // Fetch failed rows as a File object
            const file = await importHistoryApi.getFailedRowsFile(job.id);
            setReImportFile(file);
            setReImportEntity(job.entity_type);
            setReImportOpen(true);
        } catch (e) {
            console.error("Re-import setup failed", e);
            alert("Failed to download failed rows file.");
        } finally {
            setLoading(false);
        }
    };

    if (!canAccess) {
        return <Navigate to="/app/dashboard" />;
    }

    if (loading && !reImportOpen) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">

            {/* Re-Import Wizard */}
            <ImportWizard
                isOpen={reImportOpen}
                onClose={() => {
                    setReImportOpen(false);
                    setReImportFile(undefined);
                    fetchHistory(); // Refresh list on close
                }}
                entityType={reImportEntity}
                title={`Failed Rows (${reImportEntity})`}
                initialFile={reImportFile}
                warningMessage="These rows failed previously. Please correct the data in the preview before executing."
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <Clock className="w-8 h-8 text-blue-600" />
                        Import History
                    </h1>
                    <p className="text-gray-500 font-medium">Audit log of all bulk data operations.</p>
                </div>
                <button onClick={fetchHistory} className="text-sm font-bold text-blue-600 hover:underline">
                    Refresh Logs
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date & Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Entity Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Total Rows</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jobs.map(job => (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-700">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(job.created_at).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide">
                                        {job.entity_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-medium text-gray-600">
                                    {job.total_rows}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> {job.success_count}
                                            </span>
                                            <span className="text-gray-300">|</span>
                                            <span className={`${job.failed_count > 0 ? 'text-red-500' : 'text-gray-400'} flex items-center gap-1`}>
                                                <XCircle className="w-3 h-3" /> {job.failed_count}
                                            </span>
                                        </div>
                                        {job.status === 'PROCESSING' && (
                                            <span className="text-[10px] font-bold text-blue-500 animate-pulse">Running...</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {job.failed_count > 0 && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => importHistoryApi.downloadFailedRows(job.id)}
                                                className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                                                title="Download Failed Rows CSV"
                                            >
                                                <DownloadCloud className="w-4 h-4" />
                                                CSV
                                            </button>
                                            <button
                                                onClick={() => handleReImport(job)}
                                                className="inline-flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors border border-red-100"
                                                title="Fix and Re-Import Failed Rows"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Re-Import
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {jobs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-400">
                                    No import history found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
