import React, { useState } from 'react';
import { X, ArrowRight, Check, AlertTriangle, Loader2, DownloadCloud, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from './FileUploader';
import { ValidationSummaryView } from './ValidationSummary';
import { PreviewTable } from './PreviewTable';
import { importApi, ValidationSummary, ExecutionSummary } from '../../api/import.api';
import { useAuth } from '../../context/AuthContext';

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: 'STUDENT' | 'VEHICLE' | 'DRIVER' | 'FACULTY' | 'DRIVER_VEHICLE_MAP' | 'FACULTY_PROFILE' | 'STAFF_PROFILE' | 'SUBJECT';
    title: string;
    initialFile?: File;
    warningMessage?: string;
    onImportSuccess?: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose, entityType, title, initialFile, warningMessage, onImportSuccess }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecutionSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processedInitial, setProcessedInitial] = useState(false);
    const [autoCreateUser, setAutoCreateUser] = useState(false);

    // Rows that can be potentially saved by AUTO_CREATE
    const autoCreatableRows = React.useMemo(() => {
        if (!validationResult || !autoCreateUser) return [];
        return validationResult.failedRows
            .filter(row => {
                const errors = row.errors.map((e: any) => e.message);
                const hasUserError = errors.some((m: string) => m.includes('Enable AUTO_CREATE') || m.includes('User not found'));
                const hasBlocker = errors.some((m: string) =>
                    !m.includes('Enable AUTO_CREATE') &&
                    !m.includes('User not found')
                );
                return hasUserError && !hasBlocker;
            })
            .map(row => row.data);
    }, [validationResult, autoCreateUser]);

    // Check permissions (Admin only)
    const canAutoCreate = (user?.roles?.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r))) &&
        (entityType === 'FACULTY_PROFILE' || entityType === 'STAFF_PROFILE');

    // Auto-process initial file
    React.useEffect(() => {
        if (isOpen && initialFile && !processedInitial && !file) {
            handleFileUpload(initialFile);
            setProcessedInitial(true);
        }
    }, [isOpen, initialFile]);

    // Reset when closed
    React.useEffect(() => {
        if (!isOpen) {
            setProcessedInitial(false);
            setStep(1);
            setFile(null);
            setValidationResult(null);
            setValidationResult(null);
            setExecutionResult(null);
            setError(null);
            setAutoCreateUser(false);
        }
    }, [isOpen]);

    const handleFileUpload = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsLoading(true);
        setError(null);
        try {
            // Using a fallback schoolId if user context is partial, though normally user.school_id exists
            const schoolId = user?.school_id || '';
            const result = await importApi.uploadImportFile(selectedFile, entityType, schoolId, {
                userMode: autoCreateUser ? 'AUTO_CREATE' : undefined
            });
            setValidationResult(result);
            setStep(2);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Upload failed");
            setFile(null); // Reset
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!validationResult || (validationResult.validRows.length === 0 && autoCreatableRows.length === 0)) return;

        setIsLoading(true);
        setError(null);
        try {
            const schoolId = user?.school_id || '';

            // If we have rows that need auto-creation but haven't been processed yet,
            // we do one final validation to ensure users exist and we have their IDs.
            let finalValidRows = validationResult.validRows;

            if (autoCreatableRows.length > 0) {
                const refreshedResult = await importApi.uploadImportFile(file!, entityType, schoolId, {
                    userMode: 'AUTO_CREATE'
                });
                setValidationResult(refreshedResult);
                finalValidRows = refreshedResult.validRows;
            }

            if (finalValidRows.length === 0) {
                throw new Error("No rows were valid after processing.");
            }

            const { summary } = await importApi.executeImport(finalValidRows, entityType, schoolId, {
                userMode: autoCreateUser ? 'AUTO_CREATE' : undefined
            });
            setExecutionResult(summary);
            setStep(3);

            // Trigger refresh immediately if successful
            if (summary.successCount > 0 && onImportSuccess) {
                onImportSuccess();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Execution failed");
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setFile(null);
        setValidationResult(null);
        setExecutionResult(null);
        setError(null);
        setAutoCreateUser(false); // Reset on Close
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <DownloadCloud className="w-6 h-6 text-blue-600" />
                            Import {title}
                        </h2>
                        <p className="text-sm text-gray-400 font-medium">Batch process data via CSV, Excel, or PDF</p>
                    </div>
                    <button onClick={reset} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {warningMessage && (
                        <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                            <AlertTriangle className="text-amber-500 w-5 h-5" />
                            <p className="text-amber-800 text-sm font-bold">{warningMessage}</p>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                            <AlertTriangle className="text-red-500 w-5 h-5" />
                            <p className="text-red-700 text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center mb-8 gap-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-gray-300'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                    ${step === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                                        step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {step > s ? <Check className="w-5 h-5" /> : s}
                                </div>
                                <span className="font-bold text-xs uppercase tracking-wide">
                                    {s === 1 ? 'Upload' : s === 2 ? 'Validate' : 'Result'}
                                </span>
                                {s < 3 && <div className="w-12 h-1 bg-gray-100 ml-2 rounded-full" />}
                            </div>
                        ))}
                    </div>

                    {/* Pre-Validation Master Data Warning */}
                    {step === 2 && validationResult?.failedRows.some(r => r.errors.some((e: any) => e.message.includes('Settings') || e.message.includes('Academic Setup'))) && (
                        <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-orange-900 font-bold text-lg mb-1">Missing Master Data Detected</h4>
                                <p className="text-orange-800 text-sm mb-3">
                                    Some rows failed because required master data (Departments, Classes) does not exist.
                                    <br />Imports will succeed automatically once you create these records.
                                </p>
                                <div className="flex gap-3">
                                    {validationResult.failedRows.some(r => r.errors.some((e: any) => e.message.includes('Settings'))) && (
                                        <button
                                            onClick={() => { onClose(); navigate('/app/academic/departments'); }}
                                            className="text-xs font-bold bg-white text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
                                        >
                                            Go to Departments
                                        </button>
                                    )}
                                    {validationResult.failedRows.some(r => r.errors.some((e: any) => e.message.includes('Academic Setup'))) && (
                                        <button
                                            onClick={() => { onClose(); navigate('/app/academic/classes'); }}
                                            className="text-xs font-bold bg-white text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
                                        >
                                            Go to Classes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Steps */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <FileUploader onFileSelect={handleFileUpload} />

                            {entityType === 'SUBJECT' && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3 text-gray-600 text-sm">
                                    <AlertTriangle className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <strong>Important:</strong> Subjects require existing Classes.
                                        <p className="text-xs mt-1">Class names in the file must exactly match your Academic Setup.</p>
                                    </div>
                                </div>
                            )}

                            {isLoading && (
                                <div className="text-center py-8 text-blue-600 flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-sm font-bold">Analyzing file structure... (CSV/Excel/PDF)</span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && validationResult && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <ValidationSummaryView summary={validationResult} />

                            {/* AUTO_CREATE Toggle for Step 2 */}
                            {canAutoCreate && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center pt-0.5">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-100 transition-colors"
                                                checked={autoCreateUser}
                                                onChange={(e) => setAutoCreateUser(e.target.checked)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                                                Enable Auto-Creation for {validationResult.failedRows.length} rows?
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Checking this will attempt to create missing accounts for users with "User not found" errors.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {(validationResult.validRows.length > 0 || autoCreatableRows.length > 0) && (
                                <PreviewTable rows={[...validationResult.validRows, ...autoCreatableRows]} />
                            )}

                            {validationResult.validRows.length === 0 && autoCreatableRows.length === 0 && (
                                <div className="text-center py-4 text-red-500 font-bold bg-red-50 rounded-xl">
                                    No valid rows found to import. Please check errors and try again.
                                </div>
                            )}

                            {validationResult.validRows.length === 0 && autoCreatableRows.length > 0 && (
                                <div className="text-center py-4 text-blue-600 font-bold bg-blue-50 rounded-xl border border-blue-100 italic">
                                    {autoCreatableRows.length} rows will be automatically created using AUTO_CREATE mode.
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && executionResult && (
                        <div className="text-center py-8 space-y-6 animate-in zoom-in duration-300">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-xl
                                ${executionResult.successCount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {executionResult.successCount > 0 ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Import Completed</h3>
                                <p className="text-gray-500">
                                    Processed {executionResult.totalRows} rows.
                                    <span className="text-green-600 font-bold ml-1">{executionResult.successCount} Successful</span>,
                                    <span className="text-red-500 font-bold ml-1">{executionResult.failedCount} Failed</span>.
                                </p>
                                {executionResult.successCount > 0 && (
                                    <p className="text-sm font-bold text-blue-600 mt-2 bg-blue-50 px-4 py-2 rounded-lg inline-block">
                                        Refresh the page to see newly added records.
                                    </p>
                                )}
                            </div>

                            {/* Reuse ValidationSummaryView Logic roughly for Exec Result or simple list */}
                            {executionResult.failedRows.length > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-left max-w-2xl mx-auto">
                                    <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Execution Errors
                                    </h4>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar text-xs">
                                        {executionResult.failedRows.map((f, i) => (
                                            <div key={i} className="text-red-700">
                                                <span className="font-bold">Row {f.row || '?'}:</span> {f.errors?.[0]?.message || 'Unknown Error'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={reset}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                        disabled={isLoading}
                    >
                        {step === 3 ? 'Close' : 'Cancel'}
                    </button>

                    {step === 2 && (
                        <button
                            onClick={handleExecute}
                            disabled={!validationResult || (validationResult.validRows.length === 0 && autoCreatableRows.length === 0) || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center gap-2 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Execute Import
                        </button>
                    )}

                    {step === 3 && (
                        <>
                            {executionResult && executionResult.successCount > 0 && (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-2.5 rounded-xl font-bold border border-blue-200 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh Page
                                </button>
                            )}
                            <button
                                onClick={reset} // Or redirect to history
                                className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 transition-all"
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
