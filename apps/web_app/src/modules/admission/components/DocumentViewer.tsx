import { useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Download, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface DocumentViewerProps {
    fileUrl: string;
    fileName: string;
    onVerify?: (status: 'approved' | 'rejected', remark: string) => void;
    showControls?: boolean;
}

export function DocumentViewer({ fileUrl, fileName, onVerify, showControls = true }: DocumentViewerProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [remark, setRemark] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const isPdf = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('pdf');

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2.5));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
    const handleRotate = () => setRotation(r => (r + 90) % 360);

    const handleVerifyAction = (status: 'approved' | 'rejected') => {
        if (onVerify) {
            onVerify(status, remark);
            setIsVerifying(false);
            setRemark('');
        }
    };

    return (
        <div className="bg-gray-900 text-white rounded-2xl overflow-hidden shadow-xl border border-gray-800 flex flex-col h-[600px]">
            {/* Toolbar */}
            <div className="bg-gray-950 p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-xs font-bold truncate max-w-xs">{fileName}</span>
                </div>

                {showControls && !isPdf && (
                    <div className="flex items-center gap-1 bg-gray-900 rounded-xl p-1">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold px-2 text-gray-400">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <div className="w-[1px] h-5 bg-gray-800 mx-1" />
                        <button
                            onClick={handleRotate}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Rotate"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <a
                        href={fileUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </a>
                </div>
            </div>

            {/* Viewer Pane */}
            <div className="flex-1 bg-gray-950/30 overflow-auto flex items-center justify-center p-6 relative">
                {isPdf ? (
                    <iframe
                        src={`${fileUrl}#toolbar=0`}
                        title="PDF Viewer"
                        className="w-full h-full border-none rounded-lg"
                    />
                ) : (
                    <div
                        className="transition-all duration-300 ease-out"
                        style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                    >
                        <img
                            src={fileUrl}
                            alt="Verification Document"
                            className="max-h-[480px] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                )}
            </div>

            {/* Verification Inputs Footer */}
            {onVerify && (
                <div className="bg-gray-950 p-4 border-t border-gray-800">
                    {isVerifying ? (
                        <div className="space-y-3">
                            <textarea
                                value={remark}
                                onChange={e => setRemark(e.target.value)}
                                placeholder="Verification remarks or rejection details..."
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsVerifying(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleVerifyAction('rejected')}
                                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => handleVerifyAction('approved')}
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Approve
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500">Document Verification Decision</span>
                            <Button
                                onClick={() => setIsVerifying(true)}
                                className="bg-primary text-white"
                            >
                                Decider Decision
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default DocumentViewer;
