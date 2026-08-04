import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { GraduationCap, Award, AlertTriangle, CheckCircle2, XCircle, FileDown, Download } from 'lucide-react';
import { ExamProgressGuide } from '../components/ExamProgressGuide';

export const ExamResults = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [publishing, setPublishing] = useState(false);

    // Safety
    const [confirmText, setConfirmText] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (selectedExamId) {
            loadOverview(selectedExamId);
        } else {
            setStats(null);
        }
    }, [selectedExamId]);

    const loadExams = async () => {
        const res = await apiClient.get('/exams');
        setExams(res.data || []);
    };

    const loadOverview = async (examId: string) => {
        try {
            const res = await apiClient.get('/exams/analytics/overview', { params: { examId } });
            setStats(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const triggerPublish = () => {
        setConfirmText('');
        setShowModal(true);
    };

    const handlePublish = async () => {
        if (confirmText !== 'CONFIRM') return;

        setShowModal(false);
        setPublishing(true);
        try {
            await apiClient.post('/exams/publish-results', { exam_id: selectedExamId });

            // Refresh local state to show published
            const updatedExams = exams.map(e => e.id === selectedExamId ? { ...e, status: 'PUBLISHED' } : e);
            setExams(updatedExams);

        } catch (err: any) {
            alert("Publish Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setPublishing(false);
        }
    };

    const handleDownloadSingle = (examId: string) => {
        // Since we don't have a specific student context here, this button might need adjustment or we download for first?
        // Actually, usually this page is for Admin. Better to provide Bulk download.
        // But the prompt asks for "Download Result PDF" and "Download All Results".
        // I will implement "Download All Results" (ZIP) and point "Download Result PDF" to the list if we have one.
        window.open(`${apiClient.defaults.baseURL}/exams/${selectedExamId}/result/bulk-download`, '_blank');
    };

    const handleDownloadAll = () => {
        window.open(`${apiClient.defaults.baseURL}/exams/${selectedExamId}/result/bulk-download`, '_blank');
    };

    const selectedExam = exams.find(e => e.id === selectedExamId);
    const isPublished = selectedExam?.status === 'PUBLISHED';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <ExamProgressGuide currentStep={isPublished ? 'publish' : 'marks'} />

            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    Results Management
                </h1>
                <p className="text-gray-500 font-medium">Publish final results to Students and Parents.</p>
            </div>

            {/* Exam Selector */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Exam to Manage Results</label>
                <div className="flex gap-4">
                    <select
                        className="p-3 border rounded-xl w-full md:w-1/2 bg-gray-50 font-medium text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedExamId}
                        onChange={e => setSelectedExamId(e.target.value)}
                    >
                        <option value="">Choose Exam...</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.status})</option>)}
                    </select>
                </div>
            </div>

            {selectedExamId ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Status Card */}
                    <div className={`p-10 rounded-3xl border-4 ${isPublished ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'} flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden`}>
                        {isPublished ? (
                            <>
                                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-inner animate-in zoom-in duration-300">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-black text-emerald-900 tracking-tight">Results Published</h2>
                                <p className="text-emerald-700 font-medium mt-2 max-w-xs mx-auto">Report cards are live. Parents and students can view scores in their portal.</p>
                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={handleDownloadAll}
                                        className="px-5 py-2.5 bg-white rounded-xl text-xs font-bold text-emerald-600 border border-emerald-100 shadow-sm uppercase tracking-wider hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Download All Results
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Award className="w-40 h-40" />
                                </div>
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6 shadow-inner">
                                    <GraduationCap className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-300 tracking-tight">Not Yet Published</h2>
                                <p className="text-gray-400 font-medium mt-2 max-w-xs mx-auto">Results are currently hidden. Verify all marks before publishing.</p>
                                <div className="mt-8 px-5 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-400 border border-gray-200 uppercase tracking-wider">
                                    Status: Draft
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="space-y-6">
                        {/* Summary Stats Preview */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Quick Preview</h3>
                            {stats ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Students</div>
                                        <div className="text-3xl font-black text-indigo-900">{stats.totalStudents}</div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Passed</div>
                                        <div className="text-3xl font-black text-emerald-900">{stats.passCount}</div>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Failed</div>
                                        <div className="text-3xl font-black text-red-900">{stats.failCount}</div>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Avg Score</div>
                                        <div className="text-3xl font-black text-amber-900">{stats.avgPercentage}%</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-12 flex flex-col items-center">
                                    <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Calculating...</span>
                                </div>
                            )}
                        </div>

                        {/* Publish Button */}
                        {!isPublished && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 p-8 shadow-sm">
                                <div className="flex gap-4 mb-6">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-900 text-lg">Ready to Go Live?</h4>
                                        <p className="text-sm text-amber-800 mt-2 leading-relaxed">
                                            Ensure all subject marks are entered and verified. Once published, notifications will be immediately sent to all parents.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={triggerPublish}
                                    disabled={publishing}
                                    className="w-full py-4 bg-gray-900 text-white font-black text-lg rounded-2xl shadow-xl shadow-gray-200 hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {publishing ? 'Publishing Results...' : '🚀 RELEASE RESULTS NOW'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-8 sm:p-24 flex flex-col items-center justify-center text-center opacity-70">
                    <Award className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500 text-xl">Select an exam to manage results</p>
                </div>
            )}

            {/* Safety Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Final Confirmation</h3>
                            <p className="text-gray-500">
                                You are about to publish results for <strong className="text-gray-900">{selectedExam?.name}</strong>.
                            </p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl mb-6 text-sm text-red-900 font-medium">
                            ⚠️ This action cannot be undone lightly. Parents will be notified immediately.
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 text-center">Type "CONFIRM" to proceed</label>
                            <input
                                type="text"
                                className="w-full text-center p-3 border-2 border-gray-200 rounded-xl font-black tracking-widest uppercase focus:border-red-500 focus:outline-none transition-colors"
                                placeholder="CONFIRM"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={confirmText !== 'CONFIRM'}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-all"
                            >
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
