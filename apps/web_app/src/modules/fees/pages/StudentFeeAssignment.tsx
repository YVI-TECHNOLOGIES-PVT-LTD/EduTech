import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Wallet,
    Search,
    User,
    ReceiptText,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    DollarSign
} from 'lucide-react';

export const StudentFeeAssignment = () => {
    const [structures, setStructures] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [studentId, setStudentId] = useState('');
    const [selectedStructureIds, setSelectedStructureIds] = useState<string[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        apiClient.get('/fees/structures').then(res => setStructures(res.data));
        apiClient.get('/students').then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setStudents(Array.isArray(list) ? list : []);
        }).catch(() => setStudents([]));
    }, []);

    const selectedStudent = Array.isArray(students) ? students.find(s => s.id === studentId) : undefined;

    const handleStructureToggle = (id: string, amount: number) => {
        setSelectedStructureIds(prev => {
            const isSelected = prev.includes(id);
            if (isSelected) {
                return prev.filter(sid => sid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Calculate total whenever selection changes
    useEffect(() => {
        const total = structures
            .filter(s => selectedStructureIds.includes(s.id))
            .reduce((sum, s) => sum + Number(s.amount), 0);
        setTotalAmount(total);
    }, [selectedStructureIds, structures]);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || selectedStructureIds.length === 0) return;

        setLoading(true);
        try {
            // Assign each selected structure
            for (const structId of selectedStructureIds) {
                const struct = structures.find(s => s.id === structId);
                await apiClient.post(`/fees/assign/${studentId}`, {
                    fee_structure_id: structId,
                    assigned_amount: struct?.amount // Defaulting to full amount for now
                });
            }

            alert("Fees Assigned Successfully");
            setStudentId('');
            setSelectedStructureIds([]);
            setTotalAmount(0);
            setSearchTerm('');
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to link fee structures");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = (Array.isArray(students) ? students : []).filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <Wallet className="w-10 h-10 text-emerald-600" />
                        Fee Assignment
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium font-display uppercase tracking-widest text-[10px]">Financial Operations & Revenue Management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
                        {/* Step 1: Select Student */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-500" />
                                1. IDENTIFY STUDENT
                            </label>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or student ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-600 outline-none transition-all font-bold text-gray-900 shadow-inner"
                                />

                                {searchTerm && !studentId && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 overflow-hidden divide-y divide-gray-50 animate-in slide-in-from-top-2 duration-200">
                                        {filteredStudents.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => { setStudentId(s.id); setSearchTerm(s.full_name); }}
                                                className="w-full text-left p-4 hover:bg-emerald-50 flex items-center justify-between transition-colors group"
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-900">{s.full_name}</div>
                                                    <div className="text-xs text-gray-400 font-bold">{s.student_code}</div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedStudent && (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in zoom-in-95">
                                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">
                                        {selectedStudent.full_name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-emerald-900">{selectedStudent.full_name}</div>
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{selectedStudent.student_code}</div>
                                    </div>
                                    <button onClick={() => { setStudentId(''); setSearchTerm(''); }} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                                        <AlertCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Select Fee Type */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ReceiptText className="w-4 h-4 text-emerald-500" />
                                2. SELECT FEE STRATEGIES (MULTIPLE)
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {structures.map(s => {
                                    const isSelected = selectedStructureIds.includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => handleStructureToggle(s.id, s.amount)}
                                            className={`p-5 rounded-2xl border text-left transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100 text-white' : 'bg-gray-50 border-transparent hover:border-emerald-200 text-gray-900 hover:shadow-md'}`}
                                        >
                                            <div className={`flex justify-between items-start mb-1`}>
                                                <div className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-emerald-200' : 'text-gray-400'}`}>Fee Type</div>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                            <div className="font-black text-lg truncate">{s.name}</div>
                                            <div className={`mt-2 font-bold ${isSelected ? 'text-white' : 'text-emerald-600'}`}>Rs. {Number(s.amount).toLocaleString()}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 3: Confirm & Amount Override */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                <label className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    3. ADJUST & CONFIRM
                                </label>
                                <span>TOTAL ASSIGNED</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 group">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={totalAmount}
                                        onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-12 pr-4 py-6 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-600 outline-none transition-all font-black text-3xl text-gray-900 shadow-inner tracking-tighter"
                                        readOnly // Making it read-only for now when multiple selected to avoid confusion, or can be left editable
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                {selectedStructureIds.length > 1 ? 'Bulk assignment total calculated automatically.' : 'Override standard amount if scholarship or adjustment applies.'}
                            </p>
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={loading || !studentId || selectedStructureIds.length === 0}
                            className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 tracking-tight"
                        >
                            {loading ? 'PROCESSING...' : (
                                <>
                                    FINALIZE ASSIGNMENT ({selectedStructureIds.length})
                                    <CheckCircle2 className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Audit / Summary Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl sticky top-8 space-y-8">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                            <ReceiptText className="w-6 h-6 text-emerald-400" />
                            Assignment Summary
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Scholar</div>
                                <div className="text-lg font-bold">{selectedStudent?.full_name || 'No Student Selected'}</div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Plans Selected</div>
                                <div className="text-lg font-bold">
                                    {selectedStructureIds.length > 0 ? (
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {structures.filter(s => selectedStructureIds.includes(s.id)).map(s => (
                                                <li key={s.id}>{s.name}</li>
                                            ))}
                                        </ul>
                                    ) : 'No Structure Selected'}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Final Ledger Amount</div>
                                    <div className="text-4xl font-black text-emerald-400 tracking-tighter italic">
                                        Rs. {totalAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Finalizing this assignment will update the student's financial ledger by adding {selectedStructureIds.length} new fee entries.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
