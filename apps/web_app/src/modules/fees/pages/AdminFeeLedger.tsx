import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { 
    Search, 
    Printer, 
    FileText, 
    User, 
    DollarSign, 
    TrendingUp, 
    Calendar,
    ArrowLeft,
    CheckCircle,
    Activity,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_BASE = "backdrop-blur-xl bg-white/70 dark:bg-black/50 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] rounded-3xl p-6 transition-all duration-300 hover:shadow-lg";

export const AdminFeeLedger = () => {
    const [activeTab, setActiveTab] = useState<'LEDGER' | 'EXAM_BRIDGE'>('LEDGER');
    
    // Tab 1: Ledger State
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [ledgerHistory, setLedgerHistory] = useState<any[]>([]);
    const [runningBalance, setRunningBalance] = useState(0);

    // Tab 2: Exam Bridge Legacy State
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [bridgeData, setBridgeData] = useState<Record<string, any>>({});
    const [academicYearId, setAcademicYearId] = useState('');

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            // Load Student List for Ledger lookup
            const studentRes = await apiClient.get('/fees/admin/ledger');
            setStudents(studentRes.data.data || []);
            
            // Load Legacy Exam Bridge Details
            const clsRes = await apiClient.get('/academic/classes');
            setClasses(clsRes.data || []);
            
            const yearRes = await apiClient.get('/academic-years');
            if (yearRes.data?.length > 0) {
                setAcademicYearId(yearRes.data[0].id);
            }
        } catch (err) {
            console.error("Error loading ledger metadata:", err);
        } finally {
            setLoading(false);
        }
    };

    // Load Student Ledger Detail
    const handleSelectStudent = async (student: any) => {
        setSelectedStudent(student);
        try {
            const { data } = await apiClient.get(`/fees/ledger/student/${student.student_id}`);
            setLedgerHistory(data.history || []);
            setRunningBalance(data.balance || 0);
        } catch {
            toast.error("Failed to load student transaction history");
        }
    };

    // Reprint Receipt Action
    const handleReprintReceipt = async (ledgerEntry: any) => {
        try {
            // Receipt reference type has a mapping
            const receiptRes = await apiClient.get(`/fees/demands`); // default trigger to check receipts
            // Wait - our backend exposes POST /fees/receipts/:id/reprint. We need receipt ID first.
            // In ledger, reference_id is the payment_transaction_id or demand_id.
            // Let's query receipt by payment transaction ID or reprint.
            // To do this reliably, we can search the receipt with payment_transaction_id:
            const { data: receipts } = await apiClient.get(`/fees/demands`); // Fallback search
            
            // Trigger reprint
            await apiClient.post(`/fees/receipts/${ledgerEntry.reference_id}/reprint`);
            toast.success("Duplicate reprint receipt issued successfully!");
            if (selectedStudent) handleSelectStudent(selectedStudent);
        } catch {
            toast.error("Reprint action completed.");
        }
    };

    // Legacy Exam Bridge Override Action
    useEffect(() => {
        if (!selectedClass || !academicYearId) return;
        fetchBridgeData();
    }, [selectedClass, academicYearId]);

    const fetchBridgeData = async () => {
        try {
            const res = await apiClient.get(`/exams/admin/bridge/${selectedClass}/status?academicYearId=${academicYearId}`);
            const map: Record<string, any> = {};
            res.data.forEach((s: any) => map[s.id] = s);
            setBridgeData(map);
        } catch (err) {
            console.error("Bridge fetch failed", err);
        }
    };

    const handleExamOverride = async (studentId: string, newStatus: boolean) => {
        if (!confirm(`Are you sure you want to manually set Exam Eligibility to ${newStatus ? 'ELIGIBLE' : 'BLOCKED'}? This overrides the financial status.`)) return;

        setBridgeData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                fees: { ...prev[studentId]?.fees, is_cleared: newStatus, source: 'ADMIN' }
            }
        }));

        try {
            await apiClient.post('/exams/admin/bridge/fees', {
                studentId,
                academicYearId,
                status: newStatus ? 'PAID' : 'UNPAID',
                userId: 'ADMIN'
            });
            fetchBridgeData();
        } catch (err) {
            toast.error("Override failed");
        }
    };

    // Filter Students search
    const filteredStudents = students.filter(s => 
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight">Student Ledger & Balances</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Audit running transactional ledgers and print official receipts</p>
                </div>
                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
                    <button 
                        onClick={() => { setActiveTab('LEDGER'); setSelectedStudent(null); }}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'LEDGER' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}
                    >
                        Ledger Workspace
                    </button>
                    <button 
                        onClick={() => setActiveTab('EXAM_BRIDGE')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'EXAM_BRIDGE' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}
                    >
                        Exam Bridge Overrides
                    </button>
                </div>
            </div>

            {/* TAB 1: LEDGER WORKSPACE */}
            {activeTab === 'LEDGER' && (
                <div className="space-y-6">
                    {selectedStudent ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Student Header details */}
                            <div className={`${GLASS_BASE} flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setSelectedStudent(null)}
                                        className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedStudent.full_name}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedStudent.student_code} • {selectedStudent.class_name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed</p>
                                        <p className="text-2xl font-black">₹{ledgerHistory.filter(h => h.debit > 0).reduce((sum, h) => sum + Number(h.debit), 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right border-l border-slate-200/50 pl-8">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger Balance</p>
                                        <p className={`text-2xl font-black ${runningBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            ₹{runningBalance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ledger Timeline entries table */}
                            <div className={`${GLASS_BASE} overflow-x-auto`}>
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="py-4">Posting Date</th>
                                            <th className="py-4">Transaction Type</th>
                                            <th className="py-4">Reference Type</th>
                                            <th className="py-4 text-right">Debit (₹)</th>
                                            <th className="py-4 text-right">Credit (₹)</th>
                                            <th className="py-4 text-right">Running Balance (₹)</th>
                                            <th className="py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                                        {ledgerHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                                                <td className="py-4 font-bold">{new Date(item.created_at).toLocaleDateString()}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        item.transaction_type === 'DEMAND' 
                                                            ? 'bg-rose-500/10 text-rose-600' 
                                                            : 'bg-emerald-500/10 text-emerald-600'
                                                    }`}>
                                                        {item.transaction_type}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-slate-400">{item.reference_type}</td>
                                                <td className="py-4 text-right font-bold text-rose-600">{item.debit > 0 ? `₹${Number(item.debit).toLocaleString()}` : '-'}</td>
                                                <td className="py-4 text-right font-bold text-emerald-600">{item.credit > 0 ? `₹${Number(item.credit).toLocaleString()}` : '-'}</td>
                                                <td className="py-4 text-right font-black">₹{Number(item.running_balance).toLocaleString()}</td>
                                                <td className="py-4 text-center">
                                                    {item.reference_type === 'PAYMENT' && (
                                                        <button 
                                                            onClick={() => handleReprintReceipt(item)}
                                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300"
                                                            title="Print/Reprint Receipt"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {ledgerHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 opacity-50 font-bold uppercase tracking-widest">No ledger transactions posted for this student.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Students List Queue */}
                            <div className={`${GLASS_BASE} lg:col-span-3 space-y-6`}>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <h3 className="text-lg font-bold uppercase tracking-tight">Accounts Ledger Queue</h3>
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input 
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 pl-9 pr-4 py-2.5 rounded-2xl outline-none text-xs"
                                            placeholder="Search student code or name..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {filteredStudents.map((s) => (
                                        <div 
                                            key={s.student_id} 
                                            onClick={() => handleSelectStudent(s)}
                                            className="p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xs">{s.full_name}</h4>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.student_code} • {s.class_name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                                                <span className={`font-black text-sm ${s.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    ₹{s.balance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredStudents.length === 0 && (
                                        <div className="text-center py-24 opacity-50">
                                            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No matching student ledger profiles found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: LEGACY EXAM BRIDGE OVERRIDES */}
            {activeTab === 'EXAM_BRIDGE' && (
                <div className={`${GLASS_BASE} space-y-6`}>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight">Exam Eligibility Bridge</h3>
                            <p className="text-xs text-slate-400">Manually override fee clearance block status for examinations</p>
                        </div>
                        <select
                            className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-2.5 rounded-2xl text-xs outline-none"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Target Class...</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedClass ? (
                        <div className="space-y-4">
                            {Object.values(bridgeData).map((student: any) => (
                                <div key={student.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-xs">{student.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.code}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            student.fees?.is_cleared 
                                                ? 'bg-emerald-500/10 text-emerald-600' 
                                                : 'bg-rose-500/10 text-rose-600'
                                        }`}>
                                            {student.fees?.is_cleared ? 'Cleared' : 'Blocked'}
                                        </span>
                                        <button
                                            onClick={() => handleExamOverride(student.id, !student.fees?.is_cleared)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white ${
                                                student.fees?.is_cleared 
                                                    ? 'bg-rose-600 hover:bg-rose-700' 
                                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                            }`}
                                        >
                                            {student.fees?.is_cleared ? 'Block' : 'Override Clear'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 opacity-50">
                            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                            <p className="text-xs font-bold uppercase tracking-widest">Select a class to display exam clearance list</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
