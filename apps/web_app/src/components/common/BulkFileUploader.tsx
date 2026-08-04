import React, { useState, useRef } from 'react';
import { Upload, FileType, CheckCircle2, AlertCircle, Download, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface BulkFileUploaderProps {
    title: string;
    description: string;
    requiredColumns: string[];
    sampleData: any[];
    onUpload: (file: File) => Promise<any>;
    onSuccess?: (report: any) => void;
}

export const BulkFileUploader: React.FC<BulkFileUploaderProps> = ({
    title,
    description,
    requiredColumns,
    sampleData,
    onUpload,
    onSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [report, setReport] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setReport(null);
            parsePreview(selectedFile);
        }
    };

    const parsePreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (file.name.endsWith('.csv')) {
                const rows = text.split('\n').slice(0, 11).map(line => line.split(',').map(cell => cell.trim()));
                const headers = rows[0];
                const data = rows.slice(1).map(row => {
                    const obj: any = {};
                    headers.forEach((header, i) => obj[header] = row[i]);
                    return obj;
                }).filter(row => Object.values(row).some(v => v));
                setPreview(data);
            } else {
                // For XLSX, we'd need a library. For now, just show name.
                setPreview([]);
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const csvContent = [
            requiredColumns.join(','),
            ...sampleData.map(row => requiredColumns.map(col => row[col]).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const res = await onUpload(file);
            setReport(res);
            toast.success("Bulk operation triggered");
            if (onSuccess) onSuccess(res);
        } catch (err: any) {
            toast.error(err.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{title}</h3>
                        <p className="text-sm font-medium text-gray-500">{description}</p>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Template
                    </button>
                </div>

                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group border-2 border-dashed border-gray-100 rounded-[1.5rem] py-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                    >
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="mt-4 text-sm font-black text-gray-900">Click to upload CSV or Excel</p>
                        <p className="text-xs font-bold text-gray-400 mt-1">Requires columns: {requiredColumns.join(', ')}</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv,.xlsx"
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                    <FileType className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button onClick={() => { setFile(null); setPreview([]); }} className="p-2 hover:bg-white hover:text-red-500 rounded-lg transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {preview.length > 0 && (
                            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data Preview (First 10 Rows)</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-50">
                                                {requiredColumns.map(col => (
                                                    <th key={col} className="px-4 py-3 font-black text-gray-400 uppercase tracking-tighter">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {preview.map((row, i) => (
                                                <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                                    {requiredColumns.map(col => (
                                                        <td key={col} className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">{row[col] || '-'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!report ? (
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isUploading ? 'Processing...' : 'Run Bulk Process'}
                            </button>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-gray-900 tracking-tight">Process Report</h4>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Total</p>
                                            <p className="font-black text-gray-900">{report.total}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase">Success</p>
                                            <p className="font-black text-emerald-600">{report.success}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-rose-400 uppercase">Failure</p>
                                            <p className="font-black text-rose-600">{report.failure}</p>
                                        </div>
                                    </div>
                                </div>

                                {report.failure > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Error Details
                                        </p>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                            {report.details.filter((d: any) => d.status === 'FAILURE').map((err: any, idx: number) => (
                                                <div key={idx} className="flex items-start gap-2 bg-rose-50 p-2 rounded-lg text-[11px] font-bold text-rose-700">
                                                    <span className="shrink-0 text-rose-400">#{err.student_code}</span>
                                                    <span>{err.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
