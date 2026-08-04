import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { notify } from '../feedback/Notifications';

interface FileUploadProps {
    accept?: string[];
    maxSizeMB?: number;
    multiple?: boolean;
    onUploadComplete?: (urls: string[]) => void;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    error?: string;
    url?: string;
}

export const Uploader = ({
    accept = ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB = 10,
    multiple = false,
    onUploadComplete
}: FileUploadProps) => {
    const [files, setFiles] = useState<UploadingFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!accept.includes(file.type)) {
            return `Unsupported file format. Supported: ${accept.join(', ')}`;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File exceeds size limit of ${maxSizeMB}MB.`;
        }
        return null;
    };

    const processFiles = (fileList: FileList) => {
        const newFiles: UploadingFile[] = [];
        const limit = multiple ? fileList.length : 1;

        for (let i = 0; i < limit; i++) {
            const file = fileList[i];
            const error = validateFile(file);
            const id = crypto.randomUUID();

            const uploading: UploadingFile = {
                id,
                file,
                progress: 0,
                status: error ? 'failed' : 'uploading',
                error: error || undefined,
            };

            newFiles.push(uploading);

            if (!error) {
                simulateUpload(id);
            }
        }

        setFiles(prev => (multiple ? [...prev, ...newFiles] : newFiles));
    };

    const simulateUpload = (id: string) => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 20) + 10;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setFiles(prev =>
                    prev.map(f =>
                        f.id === id
                            ? {
                                  ...f,
                                  progress: 100,
                                  status: 'completed',
                                  url: `https://school-erp-storage.co/uploads/${f.file.name}`,
                              }
                            : f
                    )
                );
                notify.success('File upload finished!');
            } else {
                setFiles(prev =>
                    prev.map(f => (f.id === id ? { ...f, progress: currentProgress } : f))
                );
            }
        }, 300);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFiles(e.target.files);
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <div className="w-full space-y-4">
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                    dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={accept.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-primary">
                    <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-900">Drag & drop files here, or click to browse</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                        Max size: {maxSizeMB}MB. Supported formats: {accept.map(a => a.split('/')[1]).join(', ')}
                    </p>
                </div>
            </div>

            {/* Upload File Progress Listings */}
            {files.length > 0 && (
                <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-white">
                    {files.map(f => (
                        <div key={f.id} className="flex items-center justify-between gap-4 p-2 bg-gray-50/50 rounded-lg text-left">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <File className="w-5 h-5 text-gray-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{f.file.name}</p>
                                    <p className="text-[10px] text-gray-400">
                                        {(f.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    {f.status === 'uploading' && (
                                        <div className="w-full bg-gray-200 h-1 rounded-full mt-1.5 overflow-hidden">
                                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {f.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                {f.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default Uploader;
