import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Armchair, Printer, Users, CheckCircle, Calendar, Ban, Save, Lock, RotateCcw, Loader2, AlertTriangle, Building2, Building } from 'lucide-react';
import { ExamProgressGuide } from '../components/ExamProgressGuide';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const ExamSeating = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // --- State ---
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
    const [selectedExam, setSelectedExam] = useState<any>(null);

    // Data
    const [allocations, setAllocations] = useState<any[]>([]);
    const [halls, setHalls] = useState<any[]>([]);
    const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');

    // Async State
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showNoHalls, setShowNoHalls] = useState(false);

    // --- Init ---
    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            const res = await apiClient.get('/exams');
            setExams(res.data || []);
            if (selectedExamId) {
                const found = res.data.find((e: any) => e.id === selectedExamId);
                setSelectedExam(found);
            }
        } catch (e) {
            console.error("Failed to load exams", e);
        }
    };

    // --- Exam Picked -> Load Everything ---
    useEffect(() => {
        if (selectedExamId) {
            const found = exams.find(e => e.id === selectedExamId);
            setSelectedExam(found);
            loadClasses(selectedExamId); // Fetch classes for the exam
            loadSeatingData(selectedExamId, selectedClassId);
        } else {
            setAllocations([]);
            setEligibleStudents([]);
            setClasses([]);
            setSelectedClassId('');
            setSelectedExam(null);
        }
    }, [selectedExamId, exams]);

    const loadClasses = async (examId: string) => {
        try {
            const res = await apiClient.get(`/exams/${examId}/classes`);
            setClasses(res.data || []);
        } catch (e) {
            console.error("Failed to load classes for exam", e);
        }
    };

    const loadSeatingData = async (examId: string, classId?: string) => {
        setLoading(true);
        try {
            const params = { examId, classId };
            const [allocRes, hallsRes, eligRes] = await Promise.all([
                apiClient.get('/exams/seating', { params }),
                apiClient.get('/exams/v1/exam-halls'),
                apiClient.get('/exams/seating/eligible-students', { params })
            ]);
            setAllocations(allocRes.data || []);
            setHalls(hallsRes.data || []);
            setEligibleStudents(eligRes.data || []);
        } catch (e) {
            console.error("Failed to load seating data", e);
        } finally {
            setLoading(false);
        }
    };

    // Trigger reload on class change
    useEffect(() => {
        if (selectedExamId) {
            loadSeatingData(selectedExamId, selectedClassId);
        }
    }, [selectedClassId]);

    const handleGenerateClick = () => {
        if (selectedExam?.seating_status === 'PUBLISHED') return;
        setShowConfirm(true);
    };

    const confirmGenerate = async () => {
        setShowConfirm(false);
        setGenerating(true);
        try {
            await apiClient.post('/exams/seating/generate', { examId: selectedExamId });
            await loadSeatingData(selectedExamId);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "";
            if (errorMsg.includes("NO_HALLS_CONFIGURED")) {
                setShowNoHalls(true);
            } else {
                alert(errorMsg || "Generation Failed");
            }
        } finally {
            setGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm("Publishing will LOCK seating for this exam and enable hall tickets. Continue?")) return;
        setPublishing(true);
        try {
            await apiClient.post('/exams/seating/publish', { examId: selectedExamId });
            await loadExams(); // Refresh exam status
            alert("Seating Published Successfully!");
        } catch (err: any) {
            alert(err.response?.data?.error || "Publish failed");
        } finally {
            setPublishing(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("This will CLEAR all seating allocations. Continue?")) return;
        try {
            await apiClient.post('/exams/seating/reset', { examId: selectedExamId });
            loadSeatingData(selectedExamId);
        } catch (err: any) {
            alert(err.response?.data?.error || "Reset failed");
        }
    };

    // --- Memoized Sorting ---
    const seatingByHall = useMemo(() => {
        return halls.map(hall => ({
            ...hall,
            students: allocations.filter(a => a.hall?.id === hall.id || a.hall_id === hall.id)
        })).filter(h => h.students.length > 0);
    }, [halls, allocations]);

    const isPublished = selectedExam?.seating_status === 'PUBLISHED';
    const allEligibleSeated = eligibleStudents.length > 0 && allocations.length === eligibleStudents.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <ExamProgressGuide currentStep="seating" />

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Seating Allocation
                        {isPublished && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold border border-emerald-200 uppercase tracking-widest">
                                <Lock className="w-3 h-3" /> Published & Locked
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 font-medium">Map eligible students to examination halls.</p>
                </div>

                <div className="flex gap-3 print:hidden">
                    {selectedExamId && !isPublished && allocations.length > 0 && (
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-red-100"
                        >
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    )}
                    <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                        <Printer className="w-4 h-4" /> Print Chart
                    </button>
                </div>
            </div>

            {/* Phase-8: Immutable State Banner */}
            {isPublished && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-2 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-emerald-900 leading-none">Seating Published — Immutable State</h3>
                            <p className="text-sm font-bold text-emerald-600 mt-1">Allocation is finalized and locked. Hall Ticket generation is active.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Bar */}
            <div className={`bg-white p-6 rounded-2xl border ${isPublished ? 'border-emerald-100' : 'border-gray-100'} shadow-sm flex flex-wrap gap-6 items-end`}>
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2">Examination Window</label>
                    <select
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-black text-gray-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                        value={selectedExamId}
                        onChange={e => setSelectedExamId(e.target.value)}
                    >
                        <option value="">-- Choose Exam --</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
                    </select>
                </div>

                {selectedExamId && (
                    <div className="flex-1 min-w-[200px] animate-in slide-in-from-left duration-300">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2">Filter by Class</label>
                        <select
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-black text-gray-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                        >
                            <option value="">-- All Classes --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedExamId && (
                    <div className="flex gap-4 ml-auto">
                        {!isPublished ? (
                            <>
                                <button
                                    onClick={handleGenerateClick}
                                    disabled={generating || loading || eligibleStudents.length === 0}
                                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center gap-3"
                                >
                                    {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Armchair className="w-6 h-6" />}
                                    {allocations.length > 0 ? 'Regenerate Seating' : 'Auto-Allocate Seats'}
                                </button>

                                <button
                                    onClick={handlePublish}
                                    disabled={publishing || !allEligibleSeated}
                                    className={`px-8 py-3.5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 ${allEligibleSeated
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed grayscale'
                                        }`}
                                >
                                    {publishing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                    Publish Allocation
                                </button>
                            </>
                        ) : (
                            <div className="bg-emerald-50 text-emerald-700 px-8 py-3.5 rounded-2xl border border-emerald-200 flex items-center gap-3 font-black text-lg shadow-sm">
                                <CheckCircle className="w-6 h-6" />
                                Seating Locked
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status Info */}
            {selectedExamId && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Eligible Students</div>
                            <div className="text-2xl font-black text-gray-900">{eligibleStudents.length}</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${allEligibleSeated ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Students Seated</div>
                            <div className="text-2xl font-black text-gray-900">{allocations.length}</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Armchair className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Hall Capacity</div>
                            <div className="text-2xl font-black text-gray-900">{halls.reduce((sum, h) => sum + h.capacity, 0)}</div>
                        </div>
                    </div>

                    {!allEligibleSeated && allocations.length > 0 && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center gap-3 md:col-span-1">
                            <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
                            <div className="text-xs font-bold text-amber-800 leading-tight">
                                {eligibleStudents.length - allocations.length} students are missing seats. Re-allocate before publishing.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Visualizer */}
            {selectedExamId ? (
                loading ? (
                    <div className="p-32 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <span className="font-black text-lg">Fetching Seating Map...</span>
                    </div>
                ) : seatingByHall.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {seatingByHall.map(hall => (
                            <div key={hall.id} className={`bg-white p-8 rounded-[32px] border ${isPublished ? 'border-emerald-100 shadow-emerald-50' : 'border-gray-100 shadow-indigo-50'} shadow-xl transition-all relative overflow-hidden group hover:scale-[1.01]`}>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h3 className="font-black text-2xl text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{hall.hall_name}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            <Armchair className="w-4 h-4" /> Capacity: {hall.capacity}
                                        </div>
                                    </div>
                                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl font-black text-xl">
                                        {hall.students.length}
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-3 relative z-10">
                                    {hall.students.map((a: any) => (
                                        <div key={a.id} className="aspect-square bg-gray-50 border border-gray-100 rounded-xl flex flex-col items-center justify-center group/seat hover:bg-white hover:border-indigo-400 hover:shadow-lg transition-all cursor-help">
                                            <div className="text-[9px] font-mono text-gray-400 group-hover/seat:text-indigo-400">{a.seat_number}</div>
                                            <div className="text-sm font-black text-gray-900">{a.student?.full_name?.split(' ')[0][0]}{a.student?.full_name?.split(' ')[1]?.[0] || ''}</div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white rounded-2xl opacity-0 group-hover/seat:opacity-100 transition-all z-50 shadow-2xl pointer-events-none min-w-[150px]">
                                                <div className="text-[10px] font-black uppercase text-indigo-400 mb-1">Student Ticket</div>
                                                <div className="font-black text-sm">{a.student?.full_name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{a.student?.student_code}</div>
                                                <div className="w-3 h-3 bg-gray-900 absolute top-full left-1/2 -translate-x-1/2 rotate-45"></div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Empty Seats */}
                                    {Array.from({ length: Math.max(0, hall.capacity - hall.students.length) }).map((_, i) => (
                                        <div key={`e-${i}`} className="aspect-square border border-dashed border-gray-100 rounded-xl flex items-center justify-center opacity-40">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Background Decoration */}
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-24 rounded-[48px] border-4 border-dashed border-gray-100 text-center flex flex-col items-center max-w-4xl mx-auto">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-8">
                            <Armchair className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Generate Seating Plan</h2>
                        <p className="text-gray-500 font-semibold mb-10 max-w-md mx-auto leading-relaxed text-lg">
                            Distribute <strong>{eligibleStudents.length} eligible students</strong> across available exam halls with a single click.
                        </p>

                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-6 mb-10">
                            <div className="text-left">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Halls Configured</div>
                                <div className="text-xl font-black text-gray-900">{halls.length} Halls</div>
                            </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="text-left">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Capacity</div>
                                <div className="text-xl font-black text-gray-900">{halls.reduce((s, h) => s + h.capacity, 0)} Seats</div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateClick}
                            disabled={eligibleStudents.length === 0 || isPublished}
                            className="bg-indigo-600 text-white px-12 py-5 rounded-[24px] font-black text-xl hover:bg-black transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50"
                        >
                            {isPublished ? 'Seating Immutable' : 'Auto-Generate Layout'}
                        </button>

                        {eligibleStudents.length === 0 && (
                            <div className="mt-8 flex items-center gap-2 text-red-500 font-black uppercase text-xs tracking-widest bg-red-50 px-4 py-2 rounded-full border border-red-100">
                                <AlertTriangle className="w-4 h-4" /> No Eligible Students Found
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="bg-gray-50/50 rounded-[48px] border-4 border-dashed border-gray-200 p-24 flex flex-col items-center justify-center text-center opacity-70">
                    <Calendar className="w-16 h-16 text-gray-300 mb-6" />
                    <h3 className="text-2xl font-black text-gray-400">Select an examination window to continue</h3>
                    <p className="text-gray-400 font-medium">Map students to halls for the selected term.</p>
                </div>
            )}

            {/* Manual Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 rotate-12 group-hover:rotate-0 transition-transform">
                            <Users className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-center text-gray-900 mb-4 tracking-tight">Run Seating Orchestrator?</h3>
                        <p className="text-center text-gray-500 mb-10 font-semibold leading-relaxed">
                            This will algorithmically place {eligibleStudents.length} students into {halls.length} halls, ensuring unique seating and optimal distribution.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-4 font-black text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
                            >
                                Cancel Plan
                            </button>
                            <button
                                onClick={confirmGenerate}
                                className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-black shadow-2xl shadow-indigo-100 transition-all"
                            >
                                Generate Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* No Halls Configured Modal */}
            <AnimatePresence>
                {showNoHalls && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl border border-white/20 text-center"
                        >
                            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[30px] flex items-center justify-center mx-auto mb-8">
                                <Building2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Exam Halls Configured</h3>
                            <p className="text-gray-500 mb-10 font-semibold leading-relaxed">
                                Please configure at least one active exam hall before generating seating for students.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/app/exam-admin/halls')}
                                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-black shadow-2xl shadow-indigo-100 transition-all"
                                >
                                    Go to Hall Management
                                </button>
                                <button
                                    onClick={() => setShowNoHalls(false)}
                                    className="w-full py-4 font-black text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
