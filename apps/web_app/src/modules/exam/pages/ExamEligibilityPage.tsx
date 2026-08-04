import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Download,
    Info,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Student {
    id: string;
    student_code: string;
    full_name: string;
    section_name?: string;
    section_info?: {
        section?: {
            name: string;
        }
    }[];
}

interface EligibilityResult {
    eligible: boolean;
    attendance_percentage: number;
    fees_status: 'CLEARED' | 'PENDING';
    reasons: string[];
}

export const ExamEligibilityPage = () => {
    // --- State ---
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [examClasses, setExamClasses] = useState<any[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [eligibilityFrozen, setEligibilityFrozen] = useState(false);

    const [students, setStudents] = useState<Student[]>([]);
    const [eligibilityMap, setEligibilityMap] = useState<Record<string, EligibilityResult>>({});

    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedTab, setSelectedTab] = useState<'ELIGIBLE' | 'INELIGIBLE'>('ELIGIBLE');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [eligibleCount, setEligibleCount] = useState(0); // For visibility rule

    const navigate = useNavigate();

    // --- Init ---
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [exRes] = await Promise.all([
                    apiClient.get('/exams')
                ]);
                setExams(exRes.data);
            } catch (err) {
                console.error("Failed to load metadata", err);
            }
        };
        loadMetadata();
    }, []);

    // --- Load Methods ---
    const loadExamClasses = async (examId: string) => {
        setLoadingClasses(true);
        try {
            const res = await apiClient.get(`/exams/${examId}/classes`);
            setExamClasses(res.data);
            // If currently selected class is not in the new list, clear it
            if (selectedClassId && !res.data.find((c: any) => c.id === selectedClassId)) {
                setSelectedClassId('');
            }
        } catch (err) {
            console.error("Failed to load exam classes", err);
            setExamClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    };

    // Effect to trigger fetch when tab/page/size changes
    useEffect(() => {
        if (selectedExamId && selectedClassId) {
            handleFetchData();
        }
    }, [selectedTab, page, pageSize]);

    // Handle Exam Change
    useEffect(() => {
        if (selectedExamId) {
            loadExamClasses(selectedExamId);
        } else {
            setExamClasses([]);
            setSelectedClassId('');
        }
        setEligibleCount(0);
    }, [selectedExamId]);

    // --- Fetch Data ---
    const handleFetchData = async (resetPage = false) => {
        if (!selectedExamId || !selectedClassId) return;

        if (resetPage) setPage(1);

        setLoading(true);
        setStudents([]);
        setEligibilityMap({});
        setLoadingStage('Fetching data...');

        try {
            const res = await apiClient.get(`/exams/class-eligibility/exam/${selectedExamId}/class/${selectedClassId}`, {
                params: {
                    status: selectedTab,
                    page: resetPage ? 1 : page,
                    pageSize: pageSize
                }
            });

            const { data, meta } = res.data;

            // Phase-2: Fetch exam to get frozen status (though usually returned in meta or context)
            const examRes = await apiClient.get('/exams');
            const currentExam = examRes.data.find((e: any) => e.id === selectedExamId);
            setEligibilityFrozen(currentExam?.eligibility_frozen || false);

            if (!data || data.length === 0) {
                setStudents([]);
                setTotal(0);
                if (selectedTab === 'ELIGIBLE') setEligibleCount(0);
                return;
            }

            const fetchedStudents = data.map((item: any) => ({
                id: item.id,
                full_name: item.full_name,
                student_code: item.student_code,
                section_name: item.section_name
            }));

            const newEligibilityMap: Record<string, EligibilityResult> = {};
            data.forEach((item: any) => {
                newEligibilityMap[item.id] = item.eligibility;
            });

            setStudents(fetchedStudents);
            setEligibilityMap(newEligibilityMap);
            setTotal(meta.total);
            setEligibleCount(meta.eligibleCount);

        } catch (err) {
            console.error("Failed to fetch eligibility", err);
            alert("Failed to fetch data. Please try again.");
        } finally {
            setLoading(false);
            setLoadingStage('');
        }
    };

    const handleSearch = () => {
        handleFetchData(true);
    };

    const handleTabChange = (tab: 'ELIGIBLE' | 'INELIGIBLE') => {
        setPage(1);
        setSelectedTab(tab);
    };

    // --- Render Helpers ---
    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Phase-2: Frozen Header Banner */}
            {eligibilityFrozen && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-xl">
                            <Lock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-amber-900 leading-none">Security Lock Active</h3>
                            <p className="text-sm font-bold text-amber-600 mt-1">Eligibility is frozen. Students have been promoted to Seating Allocation.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/app/exam/seating?examId=${selectedExamId}`)}
                        className="px-6 py-2 bg-amber-600 text-white font-black rounded-xl hover:bg-amber-700 transition-all text-sm shadow-lg shadow-amber-200/50"
                    >
                        Go to Seating Chart
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Eligibility & Attendance</h1>
                    <p className="text-gray-500 font-medium mt-1">Verify exam eligibility based on attendance rules and fee status.</p>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl border border-blue-100">
                    <Info className="w-5 h-5 shrink-0" />
                    <div className="text-xs font-bold leading-relaxed">
                        <p>✔ Min Attendance: 75% | ✔ Fee Status: CLEARED</p>
                    </div>
                </div>
            </div>

            {/* Class/Exam Filters */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Exam</label>
                        <select
                            className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedExamId}
                            onChange={e => {
                                setSelectedExamId(e.target.value);
                                setEligibleCount(0); // Reset count on change
                            }}
                        >
                            <option value="">-- Choose Exam --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Class</label>
                        <select
                            className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                            value={selectedClassId}
                            disabled={!selectedExamId || loadingClasses || eligibilityFrozen}
                            onChange={e => {
                                setSelectedClassId(e.target.value);
                                setEligibleCount(0); // Reset count on change
                            }}
                        >
                            <option value="">{loadingClasses ? "Loading Classes..." : "-- Choose Class --"}</option>
                            {examClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {selectedExamId && !loadingClasses && examClasses.length === 0 && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 italic">No classes mapped to this exam</p>
                        )}
                        {eligibilityFrozen && (
                            <p className="text-[10px] text-amber-500 font-bold mt-1 italic flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Eligibility is frozen for this exam
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => handleFetchData(true)}
                        disabled={!selectedExamId || !selectedClassId || loading}
                        className="p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Filter className="w-5 h-5" />}
                        {loading ? loadingStage : 'View Eligibility'}
                    </button>
                </div>
            </div>

            {/* Segmented Toggle & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-24 z-10">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => handleTabChange('ELIGIBLE')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${selectedTab === 'ELIGIBLE'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Eligible
                    </button>
                    <button
                        onClick={() => handleTabChange('INELIGIBLE')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${selectedTab === 'INELIGIBLE'
                            ? 'bg-white text-red-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Not Eligible
                    </button>
                </div>

                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter by name..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Table */}
            {students.length > 0 || loading ? (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                                <tr>
                                    <th className="p-4 pl-6">Student Info</th>
                                    <th className="p-4 text-center">Attendance %</th>
                                    <th className="p-4 text-center">Fee Status</th>
                                    <th className="p-4 text-center">Eligibility</th>
                                    <th className="p-4">Remarks / Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                                            <p className="text-sm font-bold text-gray-400">Loading Student Records...</p>
                                        </td>
                                    </tr>
                                ) : filteredStudents.map(student => {
                                    const data = eligibilityMap[student.id];
                                    if (!data) return null;

                                    const isAttShortage = data.attendance_percentage < 75;
                                    const isFeePending = data.fees_status !== 'CLEARED';

                                    let remark = "All criteria met";
                                    const isPromoted = (data as any).promoted_to_seating;

                                    if (isPromoted) {
                                        remark = "PROMOTED TO SEATING";
                                    } else if (!data.eligible) {
                                        if (isAttShortage && isFeePending) {
                                            remark = "Attendance shortage & Fees pending";
                                        } else if (isAttShortage) {
                                            remark = `Attendance shortage (${data.attendance_percentage}%)`;
                                        } else if (isFeePending) {
                                            remark = "Fees not cleared";
                                        }
                                    }

                                    return (
                                        <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-gray-900">{student.full_name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">
                                                    {student.student_code} • {student.section_name || 'N/A'}
                                                </div>
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-lg font-black ${isAttShortage ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {data.attendance_percentage}%
                                                    </span>
                                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${isAttShortage ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {isAttShortage ? 'Shortage' : 'Satisfactory'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${!isFeePending
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {isFeePending ? 'NOT CLEARED' : 'CLEARED'}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border-2 ${data.eligible
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                    : 'bg-red-50 border-red-100 text-red-700'
                                                    }`}>
                                                    {data.eligible ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    {data.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className={`text-xs font-bold ${data.eligible ? 'text-gray-400 italic' : 'text-red-500'}`}>
                                                    {remark}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} of {total} Students
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                className="bg-white border text-xs font-bold rounded-lg p-1 outline-none"
                                value={pageSize}
                                onChange={e => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                            </select>

                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2 border bg-white rounded-lg disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={page * pageSize >= total}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2 border bg-white rounded-lg disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 mb-6">
                        <Filter className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">No Students Found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto font-medium">Please select an Exam and Class to retrieve data, or try another filter.</p>
                </div>
            )}

            {/* Final CTA */}
            {eligibleCount > 0 && (
                <div className="flex justify-end pt-4">
                    <button
                        onClick={async () => {
                            if (eligibilityFrozen) {
                                navigate(`/app/exam/seating?examId=${selectedExamId}`);
                                return;
                            }
                            try {
                                setLoading(true);
                                setLoadingStage('Promoting students...');

                                // 1. Trigger Freeze (locks status for seating)
                                // The backend handles the 'already frozen' case or we catch the error
                                await apiClient.post('/exams/eligibility/freeze', { examId: selectedExamId });

                                // 2. Navigate
                                navigate(`/app/exam/seating?examId=${selectedExamId}`);
                            } catch (err: any) {
                                console.error("Promotion failed", err);
                                // If already frozen, we can still navigate
                                if (err.response?.data?.error?.includes('ALREADY_FROZEN')) {
                                    navigate(`/app/exam/seating?examId=${selectedExamId}`);
                                } else {
                                    alert(err.response?.data?.error || "Failed to promote students. Please try again.");
                                }
                            } finally {
                                setLoading(false);
                                setLoadingStage('');
                            }
                        }}
                        disabled={loading}
                        className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl disabled:opacity-50 ${eligibilityFrozen
                            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                    >
                        {loading && loadingStage === 'Promoting students...' ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span>{eligibilityFrozen ? 'View Seating Allocation' : 'Promote to Seating Allocation'}</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}

                        {!eligibilityFrozen && (
                            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full shadow-md">
                                {eligibleCount} Students
                            </div>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
