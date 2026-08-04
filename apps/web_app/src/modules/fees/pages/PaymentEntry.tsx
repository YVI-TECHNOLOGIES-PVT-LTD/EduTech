import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { 
    Coins, 
    Search, 
    CreditCard, 
    CheckCircle, 
    Printer, 
    ArrowLeft, 
    Clock, 
    User, 
    Filter,
    QrCode
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_BASE = "backdrop-blur-xl bg-white/70 dark:bg-black/50 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] rounded-3xl p-6 transition-all duration-300 hover:shadow-lg";

export const PaymentEntry = () => {
    const [demands, setDemands] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    // Collection Modal State
    const [activeDemand, setActiveDemand] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState<'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank_Transfer' | 'Online_Gateway'>('Cash');
    const [refNo, setRefNo] = useState('');
    const [bankName, setBankName] = useState('');
    const [processing, setProcessing] = useState(false);

    // Active Receipt state
    const [activeReceipt, setActiveReceipt] = useState<any>(null);

    useEffect(() => {
        fetchPendingDemands();
    }, []);

    const fetchPendingDemands = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/fees/demands');
            setDemands(data || []);
        } catch {
            toast.error("Failed to load demands queue");
        } finally {
            setLoading(false);
        }
    };

    const handleCollectPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                application_id: activeDemand.application_id || undefined,
                student_id: activeDemand.student_id || undefined,
                demand_id: activeDemand.id,
                amount: parseFloat(amount),
                payment_mode: mode,
                transaction_reference: refNo || undefined,
                bank_name: bankName || undefined
            };

            const { data } = await apiClient.post('/fees/payments', payload);
            toast.success("Payment recorded successfully!");
            setActiveReceipt(data.receipt);
            setActiveDemand(null);
            fetchPendingDemands();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Transaction recording failed");
        } finally {
            setProcessing(false);
        }
    };

    const filteredDemands = demands.filter(d => {
        const matchesSearch = 
            (d.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.student?.student_code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.application?.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.demand_no?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter ? d.status === statusFilter : d.status !== 'PAID';
        return matchesSearch && matchesStatus;
    });

    if (activeReceipt) {
        return (
            <div className="max-w-xl mx-auto p-8 space-y-6 animate-in fade-in duration-300">
                <div className={`${GLASS_BASE} text-center space-y-6 p-10 border border-emerald-500/20`}>
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase">Receipt Generated</h2>
                        <p className="text-xs text-slate-400 mt-1">RCPT Transaction ID: {activeReceipt.receipt_no}</p>
                    </div>

                    {/* Receipt Card */}
                    <div className="border border-slate-100 dark:border-white/10 p-6 rounded-2xl text-left text-xs space-y-3 bg-slate-50 dark:bg-white/5">
                        <div className="flex justify-between font-black uppercase tracking-wider border-b border-slate-200 dark:border-white/5 pb-2">
                            <span>Receipt Type</span>
                            <span className="text-indigo-600">{activeReceipt.receipt_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Issued At:</span>
                            <span>{new Date(activeReceipt.generated_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-white/5 pt-2 font-black text-sm">
                            <span>Status:</span>
                            <span className="text-emerald-600">{activeReceipt.status}</span>
                        </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="border border-slate-200 dark:border-white/10 p-4 rounded-3xl w-40 h-40 mx-auto flex items-center justify-center bg-white">
                        <QrCode className="w-32 h-32 text-slate-800" />
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => window.print()}
                            className="flex-1 py-3 bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Print Receipt
                        </button>
                        <button 
                            onClick={() => setActiveReceipt(null)}
                            className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Queue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tight">Pending Fee Queue</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Process counter payments and manage pending collections</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 pl-10 pr-4 py-3 rounded-2xl outline-none text-xs"
                        placeholder="Search student, demand no, or applicant..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-2xl text-xs outline-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Unpaid</option>
                        <option value="PENDING">Pending</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="OVERDUE">Overdue</option>
                    </select>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Queue List */}
                <div className={`${GLASS_BASE} lg:col-span-2 space-y-4`}>
                    <h3 className="text-lg font-bold uppercase tracking-tight">Dues Queue</h3>
                    <div className="space-y-4">
                        {filteredDemands.map((d) => (
                            <div key={d.id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs">{d.demand_no}</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            d.status === 'OVERDUE' 
                                                ? 'bg-rose-500/10 text-rose-600' 
                                                : d.status === 'PARTIAL' 
                                                ? 'bg-amber-500/10 text-amber-600' 
                                                : 'bg-indigo-500/10 text-indigo-600'
                                        }`}>
                                            {d.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {d.student?.full_name || d.application?.applicant_name || 'ERP Candidate'}
                                        </span>
                                        {d.student?.student_code && (
                                            <span className="text-slate-400">({d.student.student_code})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Due: {d.due_date}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-slate-200/50 pt-3 md:pt-0">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                                        <p className="text-lg font-black text-rose-600">₹{Number(d.balance_amount).toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setActiveDemand(d);
                                            setAmount(d.balance_amount);
                                        }}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <CreditCard className="w-4 h-4" /> Collect
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredDemands.length === 0 && !loading && (
                            <div className="text-center py-12 opacity-50">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-widest">All demands settled in this queue</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collection Panel Sidebar */}
                <div className={`${GLASS_BASE}`}>
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Payment Workspace</h3>
                    
                    {activeDemand ? (
                        <form onSubmit={handleCollectPayment} className="space-y-4 animate-in fade-in duration-300">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs">
                                <p className="font-bold text-indigo-700">Billing target: {activeDemand.demand_no}</p>
                                <p className="text-[10px] text-indigo-600 mt-1">
                                    Owner: {activeDemand.student?.full_name || activeDemand.application?.applicant_name}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Pay (₹)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    max={activeDemand.balance_amount}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                    value={mode}
                                    onChange={e => setMode(e.target.value as any)}
                                >
                                    {['Cash', 'UPI', 'Card', 'Cheque', 'Bank_Transfer'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {mode !== 'Cash' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference / Cheque No.</label>
                                        <input 
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                            placeholder="e.g. TXN987654"
                                            value={refNo}
                                            onChange={e => setRefNo(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</label>
                                        <input 
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                            placeholder="e.g. HDFC Bank"
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider"
                            >
                                {processing ? 'Recording Transaction...' : 'Record Payment'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-24 opacity-40">
                            <Coins className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest">Select an item from the queue to start billing collection</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
