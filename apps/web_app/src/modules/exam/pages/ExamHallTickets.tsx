import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Search, Printer, CheckCircle, FileText, Loader2, AlertTriangle, Lock, ShieldCheck, Download } from 'lucide-react';
import { ExamProgressGuide } from '../components/ExamProgressGuide';
import { useSearchParams } from 'react-router-dom';

export const ExamHallTickets = () => {
    const [searchParams] = useSearchParams();

    // --- State ---
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
    const [selectedExam, setSelectedExam] = useState<any>(null);

    // Data
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        if (selectedExamId) {
            const found = exams.find(e => e.id === selectedExamId);
            setSelectedExam(found);
            loadTickets(selectedExamId);
        } else {
            setTickets([]);
            setSelectedExam(null);
        }
    }, [selectedExamId, exams]);

    const loadTickets = async (examId: string) => {
        setLoading(true);
        try {
            const res = await apiClient.get('/exams/hall-tickets', { params: { examId } });
            setTickets(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await apiClient.post('/exams/hall-tickets/generate', { examId: selectedExamId });
            await loadTickets(selectedExamId);
            alert("Hall Tickets Issued Successfully!");
        } catch (err: any) {
            alert(err.response?.data?.error || "Generation Failed");
        } finally {
            setGenerating(false);
        }
    };

    const isSeatingPublished = selectedExam?.seating_status === 'PUBLISHED';

    const handleDownload = async (studentId: string, studentCode: string) => {
        try {
            const res = await apiClient.get(`/exams/hall-ticket/${selectedExamId}/${studentId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `HallTicket_${studentCode}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download Hall Ticket");
        }
    };

    const handleDownloadAll = async () => {
        try {
            const res = await apiClient.post(`/exams/${selectedExamId}/hall-ticket/reissue`, {}, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `HallTickets_Bulk_${selectedExam?.name}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Bulk download failed", err);
            alert("Failed to download bulk tickets");
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.student?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.student?.student_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticket_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <ExamProgressGuide currentStep="hall-tickets" />

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Official Hall Tickets
                    </h1>
                    <p className="text-gray-500 font-medium">Generate and distribute exam credentials.</p>
                </div>

                {selectedExamId && (
                    <div className="flex gap-3 print:hidden">
                        {tickets.length > 0 && (
                            <button
                                onClick={handleDownloadAll}
                                className="px-6 py-3 rounded-2xl font-black flex items-center gap-3 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Download All (ZIP)
                            </button>
                        )}
                        <button
                            disabled={!isSeatingPublished || generating || loading}
                            onClick={handleGenerate}
                            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-3 transition-all ${!isSeatingPublished
                                ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                : 'bg-indigo-600 text-white hover:bg-black shadow-xl shadow-indigo-100'
                                }`}
                        >
                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            {tickets.length > 0 ? 'Re-Issue All Tickets' : 'Issue Hall Tickets'}
                        </button>
                    </div>
                )}
            </div>

            {/* Selection & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap gap-6 items-end">
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
                        <div className="flex flex-col gap-1 pr-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seating Status</span>
                            {isSeatingPublished ? (
                                <div className="flex items-center gap-2 text-emerald-600 font-black">
                                    <ShieldCheck className="w-5 h-5" /> PUBLISHED
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-500 font-black">
                                    <Lock className="w-5 h-5" /> DRAFT / PENDING
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100 flex flex-col justify-center">
                    <div className="text-[10px] font-black uppercase tracking-[2px] opacity-60 mb-1">Total Issued</div>
                    <div className="text-4xl font-black">{tickets.length}</div>
                    <div className="mt-2 text-[10px] font-bold opacity-80 italic">Verified and ready for download</div>
                </div>
            </div>

            {!isSeatingPublished && selectedExamId && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-8 rounded-[32px] text-center max-w-2xl mx-auto flex flex-col items-center gap-4">
                    <AlertTriangle className="w-12 h-12 text-amber-500" />
                    <h3 className="text-xl font-black text-amber-900">Seating Not Published</h3>
                    <p className="text-amber-700 font-semibold">
                        Hall tickets can only be generated after the seating allocation is published and locked.
                        Please visit the Seating page to finalize the arrangement.
                    </p>
                    <button
                        onClick={() => window.location.href = `/app/exam/seating?examId=${selectedExamId}`}
                        className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-all"
                    >
                        Go to Seating Allocation
                    </button>
                </div>
            )}

            {isSeatingPublished && (
                <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, code or ticket..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="p-6">Student & Code</th>
                                    <th className="p-6">Ticket Code</th>
                                    <th className="p-6">Issued Date</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="p-32 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-4" />
                                            <span className="font-black text-gray-400">Loading issued tickets...</span>
                                        </td>
                                    </tr>
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-32 text-center">
                                            <ShieldCheck className="w-16 h-16 mx-auto text-gray-100 mb-4" />
                                            <p className="font-black text-gray-300 text-xl tracking-tight">No tickets issued for this exam yet.</p>
                                        </td>
                                    </tr>
                                ) : filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{ticket.student?.full_name}</div>
                                            <div className="text-xs text-gray-400 font-black tracking-widest uppercase">{ticket.student?.student_code}</div>
                                        </td>
                                        <td className="p-6 font-mono font-black text-indigo-500 bg-indigo-50/20 rounded-xl m-4 inline-block">
                                            {ticket.ticket_code}
                                        </td>
                                        <td className="p-6 text-gray-500 font-bold">
                                            {new Date(ticket.generated_at).toLocaleDateString()}
                                            <div className="text-[10px] text-gray-400">{new Date(ticket.generated_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => handleDownload(ticket.student_id, ticket.student?.student_code)}
                                                className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-xl font-black text-xs hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2 ml-auto group-hover:border-transparent group-hover:shadow-lg">
                                                <Download className="w-4 h-4" /> <span>Download</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
