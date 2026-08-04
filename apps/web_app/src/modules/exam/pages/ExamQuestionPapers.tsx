import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { FileText, Upload, Lock, Download, AlertTriangle, ShieldCheck, History, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ExamProgressGuide } from '../components/ExamProgressGuide';

export const ExamQuestionPapers = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [papers, setPapers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [targetSubject, setTargetSubject] = useState('');

    // Lock Modal State
    const [lockModal, setLockModal] = useState<{ open: boolean; paperId: string | null }>({ open: false, paperId: null });
    const [lockConfirmed, setLockConfirmed] = useState(false);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (selectedExamId) {
            loadPapers(selectedExamId);
            apiClient.get('/exams/exam-schedules', { params: { examId: selectedExamId } })
                .then(res => setSubjects(res.data.map((s: any) => s.subject)));
        } else {
            setPapers([]);
            setSubjects([]);
        }
    }, [selectedExamId]);

    const loadExams = async () => {
        const res = await apiClient.get('/exams');
        setExams(res.data || []);
    };

    const loadPapers = async (examId: string) => {
        const res = await apiClient.get('/exams/question-papers', { params: { examId } });
        setPapers(res.data || []);
    };

    const handleUpload = async () => {
        if (!file || !targetSubject || !selectedExamId) return;

        setUploading(true);
        try {
            const filePath = `qpapers/${selectedExamId}/${targetSubject}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('exam-protected')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            await apiClient.post('/exams/question-papers', {
                exam_id: selectedExamId,
                subject_id: targetSubject,
                file_url: filePath,
                version: 1
            });

            setFile(null);
            setTargetSubject('');
            loadPapers(selectedExamId);

        } catch (err: any) {
            console.error(err);
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const confirmLock = async () => {
        if (!lockModal.paperId) return;

        try {
            await apiClient.post('/exams/question-papers/lock', { paper_id: lockModal.paperId });
            loadPapers(selectedExamId);
            setLockModal({ open: false, paperId: null });
            setLockConfirmed(false);
        } catch (err: any) {
            alert("Lock Failed");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <ExamProgressGuide currentStep="dashboard" /> {/* Keeping universal guide or specific? Let's generic for now or skip prop */}

            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    Question Papers
                </h1>
                <p className="text-gray-500 font-medium">Securely upload, version, and finalize exam papers.</p>
            </div>

            {/* Exam Selector */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 shadow-sm">
                <select
                    className="p-3 border rounded-lg min-w-[300px] bg-gray-50 font-medium text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedExamId}
                    onChange={e => setSelectedExamId(e.target.value)}
                >
                    <option value="">Select Exam to Manage Papers...</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            {selectedExamId ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Upload Area */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 -translate-y-16" />

                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                    <Upload className="w-5 h-5" />
                                </div>
                                Upload New Paper
                            </h3>

                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Subject</label>
                                    <select
                                        className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-white transition-colors"
                                        value={targetSubject}
                                        onChange={e => setTargetSubject(e.target.value)}
                                    >
                                        <option value="">Select Subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                    </select>
                                </div>

                                <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-8 text-center hover:bg-indigo-50 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-indigo-600 group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">
                                        {file ? file.name : "Click to browse PDF"}
                                    </p>
                                    <p className="text-xs text-indigo-400 mt-1">{file ? "Ready to upload" : "Max size 10MB"}</p>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !file || !targetSubject}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Encrypting & Uploading...
                                        </>
                                    ) : 'Secure Upload'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-sm text-amber-900 flex gap-3 shadow-sm">
                            <ShieldCheck className="w-6 h-6 shrink-0 text-amber-600" />
                            <div>
                                <p className="font-bold mb-1">Security Protocol</p>
                                <p className="opacity-90 text-xs leading-relaxed">Papers are uploaded to an encrypted bucket. Once a version is <span className="font-bold">LOCKED</span>, it cannot be deleted or modified. Only locked papers are sent for printing.</p>
                            </div>
                        </div>
                    </div>

                    {/* Paper List */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-400" /> Registered Versions
                                </h3>
                                <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">{papers.length} Files</span>
                            </div>

                            {papers.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {papers.map(paper => {
                                        const isLocked = paper.status === 'LOCKED';
                                        return (
                                            <div key={paper.id} className={`p-5 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group ${isLocked ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${isLocked ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-100'}`}>
                                                        {isLocked ? <Lock className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg">{paper.subject?.name}</h4>
                                                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mt-1">
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">v{paper.version}</span>
                                                            <span>•</span>
                                                            <span>{new Date(paper.created_at).toLocaleDateString()} at {new Date(paper.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {isLocked ? (
                                                        <div className="px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2 border border-emerald-200">
                                                            <Check className="w-3 h-3" /> FINALIZED
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setLockModal({ open: true, paperId: paper.id });
                                                                setLockConfirmed(false);
                                                            }}
                                                            className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 shadow-sm"
                                                        >
                                                            <Lock className="w-3 h-3" /> Finalize
                                                        </button>
                                                    )}

                                                    {!isLocked && (
                                                        <button
                                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                                                            title="Download Preview"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-400 mt-12">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <FileText className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-gray-900 font-bold text-lg">No Papers Yet</h3>
                                    <p className="max-w-xs mx-auto text-sm mt-2 opacity-80">
                                        Select a subject on the left to upload the first version of the question paper.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-20 flex flex-col items-center justify-center text-center opacity-70">
                    <History className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500 text-lg">Select an exam above to manage papers</p>
                </div>
            )}

            {/* Lock Confirmation Modal */}
            {lockModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-center text-gray-900 mb-2">Finalize Question Paper?</h3>
                        <p className="text-center text-gray-500 mb-6 text-sm">
                            You are about to lock this version as <strong>FINAL</strong>. This action is irreversible. Once locked, this file will be queued for printing.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6 flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="confirmLock"
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={lockConfirmed}
                                onChange={e => setLockConfirmed(e.target.checked)}
                            />
                            <label htmlFor="confirmLock" className="text-xs text-gray-700 font-medium cursor-pointer select-none">
                                I confirm that I have verified the file content and understand that no further changes can be made.
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setLockModal({ open: false, paperId: null })}
                                className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLock}
                                disabled={!lockConfirmed}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-all"
                            >
                                Confirm Lock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
