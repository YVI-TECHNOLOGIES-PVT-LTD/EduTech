import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, FileText, CheckCircle, XCircle } from 'lucide-react';

interface Document {
    id: string;
    document_type: string;
    file_url: string;
    status: 'pending' | 'verified' | 'rejected';
    remarks?: string;
}

interface StudentDocumentViewerProps {
    documents: Document[];
    onVerify?: (docId: string, status: 'verified' | 'rejected', remark: string) => void;
    onUpload?: (type: string, file: File) => void;
}

export const StudentDocumentViewer: React.FC<StudentDocumentViewerProps> = ({
    documents,
    onVerify,
    onUpload
}) => {
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [remark, setRemark] = useState('');

    const currentDoc = documents[selectedDocIndex];

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const handleAction = (status: 'verified' | 'rejected') => {
        if (currentDoc && onVerify) {
            onVerify(currentDoc.id, status, remark);
            setRemark('');
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* List side */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-gray-900">Document Submissions</h3>
                <div className="space-y-2">
                    {documents.map((doc, idx) => (
                        <button
                            key={doc.id}
                            onClick={() => { setSelectedDocIndex(idx); setZoom(1); setRotation(0); }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                                idx === selectedDocIndex
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-100 bg-gray-50 text-gray-600'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="text-xs font-bold truncate max-w-[150px]">{doc.document_type}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-black rounded-full uppercase ${
                                doc.status === 'verified' ? 'bg-green-100 text-green-600' :
                                doc.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                {doc.status}
                            </span>
                        </button>
                    ))}
                </div>

                {onUpload && (
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase">Upload New File</label>
                        <input
                            type="file"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) onUpload('Other Document', file);
                            }}
                            className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer"
                        />
                    </div>
                )}
            </div>

            {/* Viewer side */}
            <div className="lg:col-span-2 space-y-4">
                {currentDoc ? (
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        {/* Title Bar */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
                            <div>
                                <h3 className="text-xs font-black text-gray-900">{currentDoc.document_type}</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">Verification status: {currentDoc.status}</p>
                            </div>
                            {/* Controls */}
                            <div className="flex gap-1.5">
                                <Button size="sm" variant="ghost" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={handleRotate}><RotateCw className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        {/* Image/Frame Container */}
                        <div className="relative border border-gray-100 rounded-2xl bg-gray-900 min-h-[350px] overflow-hidden flex items-center justify-center">
                            {currentDoc.file_url.endsWith('.pdf') ? (
                                <iframe
                                    src={`${currentDoc.file_url}#toolbar=0`}
                                    title="PDF Document"
                                    className="w-full h-[400px] border-0 rounded-2xl bg-white"
                                />
                            ) : (
                                <img
                                    src={currentDoc.file_url}
                                    alt="Doc preview"
                                    style={{
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        transition: 'transform 0.2s ease-in-out'
                                    }}
                                    className="max-h-[350px] object-contain rounded-lg"
                                />
                            )}
                        </div>

                        {/* Action remark form */}
                        {onVerify && currentDoc.status === 'pending' && (
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase">Verification Comments</label>
                                <textarea
                                    value={remark}
                                    onChange={e => setRemark(e.target.value)}
                                    placeholder="State comments or rejection details..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary resize-none h-16"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAction('verified')}
                                        className="bg-green-600 text-white text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve Document
                                    </Button>
                                    <Button
                                        onClick={() => handleAction('rejected')}
                                        className="bg-red-600 text-white text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject Document
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 text-center">
                        <FileText className="w-10 h-10 text-gray-300 mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-gray-500">No documents selected for preview.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDocumentViewer;
