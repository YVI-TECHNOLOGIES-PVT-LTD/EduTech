import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    acceptedFileTypes?: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, acceptedFileTypes = ['.csv', '.xlsx', '.pdf'] }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    };

    return (
        <div
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                {!selectedFile ? (
                    <>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-400">CSV, Excel, or PDF (Tabular)</p>
                        </div>
                        <input id="file-upload" type="file" className="hidden" accept={acceptedFileTypes.join(',')} onChange={handleChange} />
                    </>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in duration-300">
                        <FileType className="w-12 h-12 text-blue-600 mb-2" />
                        <p className="font-bold text-gray-700">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        <button
                            className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 z-10"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(null);
                            }}
                        >
                            Remove File
                        </button>
                    </div>
                )}
            </label>
        </div>
    );
};
