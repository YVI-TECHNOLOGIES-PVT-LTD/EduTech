import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Coins, Trash2, Calendar, FileText, ArrowRight, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const GLASS_BASE = "backdrop-blur-xl bg-white/70 dark:bg-black/50 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] rounded-3xl p-6 transition-all duration-300 hover:shadow-lg";

export const FeeStructureManagement = () => {
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [classesList, setClassesList] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [publishedStructures, setPublishedStructures] = useState<any[]>([]);

    // Builder Wizard state
    const [name, setName] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [components, setComponents] = useState<any[]>([
        { name: 'Tuition Fee', category: 'Tuition', amount: 15000, display_order: 1, is_mandatory: true }
    ]);
    const [installments, setInstallments] = useState<any[]>([]);

    // Component helper states
    const [newComp, setNewComp] = useState({ name: '', category: 'Tuition', amount: '', is_mandatory: true });
    const [newInst, setNewInst] = useState({ term: '', due_date: '', percentage: '', fixed_amount: '' });

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        if (academicYearId && academicYears.length > 0) {
            const year = academicYears.find(y => y.id === academicYearId);
            if (year) {
                if (year.start_date) {
                    setEffectiveFrom(year.start_date);
                }
                if (year.end_date) {
                    setEffectiveTo(year.end_date);
                }
            }
        }
    }, [academicYearId, academicYears]);

    const fetchMetadata = async () => {
        try {
            const classesRes = await apiClient.get('/academic/classes');
            setClassesList(classesRes.data || []);
        } catch {
            // Fallback class lookup
            try {
                const altClasses = await apiClient.get('/classes');
                setClassesList(altClasses.data || []);
            } catch {}
        }

        try {
            const yearsRes = await apiClient.get('/academic-years');
            setAcademicYears(yearsRes.data || []);
            if (yearsRes.data?.length > 0) {
                setAcademicYearId(yearsRes.data[0].id);
            }
        } catch {}

        fetchPublishedStructures();
    };

    const fetchPublishedStructures = async () => {
        try {
            const { data } = await apiClient.get('/fees/structures');
            setPublishedStructures(data || []);
        } catch {
            toast.error("Failed to load fee structures templates");
        }
    };

    const addComponent = () => {
        if (!newComp.name || !newComp.amount) return;
        setComponents([...components, {
            ...newComp,
            amount: parseFloat(newComp.amount),
            display_order: components.length + 1
        }]);
        setNewComp({ name: '', category: 'Tuition', amount: '', is_mandatory: true });
    };

    const removeComponent = (index: number) => {
        setComponents(components.filter((_, idx) => idx !== index));
    };

    const addInstallment = () => {
        if (!newInst.term || !newInst.due_date) return;
        setInstallments([...installments, {
            term: newInst.term,
            due_date: newInst.due_date,
            percentage: newInst.percentage ? parseFloat(newInst.percentage) : undefined,
            fixed_amount: newInst.fixed_amount ? parseFloat(newInst.fixed_amount) : undefined
        }]);
        setNewInst({ term: '', due_date: '', percentage: '', fixed_amount: '' });
    };

    const removeInstallment = (index: number) => {
        setInstallments(installments.filter((_, idx) => idx !== index));
    };

    const toggleClass = (classId: string) => {
        setSelectedClasses(prev =>
            prev.includes(classId) ? prev.filter(c => c !== classId) : [...prev, classId]
        );
    };

    const totalAmount = components.reduce((sum, c) => sum + Number(c.amount), 0);

    const handlePublish = async () => {
        if (!name || selectedClasses.length === 0 || components.length === 0) {
            toast.error("Please complete all builder fields before publishing.");
            return;
        }

        try {
            await apiClient.post('/fees/structures', {
                name,
                academic_year_id: academicYearId,
                effective_from: effectiveFrom || new Date().toISOString().split('T')[0],
                effective_to: effectiveTo || new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
                classes: selectedClasses,
                components,
                installments
            });

            toast.success("Fee Structure successfully versioned & published!");
            // Reset builder
            setName('');
            setSelectedClasses([]);
            setComponents([{ name: 'Tuition Fee', category: 'Tuition', amount: 15000, display_order: 1, is_mandatory: true }]);
            setInstallments([]);
            setStep(1);
            fetchPublishedStructures();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Publish failed");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tight">Fee Structure Builder</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Design, version-control, and target institutional fee templates</p>
            </div>

            {/* Builder Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wizard Panel */}
                <div className={`${GLASS_BASE} lg:col-span-2 space-y-6 relative overflow-hidden`}>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            Step {step} of 5: {step === 1 ? 'Details' : step === 2 ? 'Components' : step === 3 ? 'Installments' : step === 4 ? 'Target Classes' : 'Preview'}
                        </h2>
                        <span className="text-xs font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full">
                            Builder Mode
                        </span>
                    </div>

                    {/* Step 1: Base Details */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure Title</label>
                                <input 
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                    placeholder="e.g. Core Tuition Fee Structure"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                        value={academicYearId}
                                        onChange={e => setAcademicYearId(e.target.value)}
                                    >
                                        {academicYears.map(y => (
                                            <option key={y.id} value={y.id}>{y.year_label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective From</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                        value={effectiveFrom}
                                        onChange={e => setEffectiveFrom(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective To</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-2xl outline-none"
                                    value={effectiveTo}
                                    onChange={e => setEffectiveTo(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Components */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl space-y-4">
                                <p className="text-xs font-black uppercase text-slate-400">Add Component</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        placeholder="Component Name (e.g. Lab Fee)"
                                        value={newComp.name}
                                        onChange={e => setNewComp({ ...newComp, name: e.target.value })}
                                    />
                                    <select
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        value={newComp.category}
                                        onChange={e => setNewComp({ ...newComp, category: e.target.value as any })}
                                    >
                                        {['Admission', 'Tuition', 'Registration', 'Exam', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Annual', 'Miscellaneous'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <input 
                                        type="number"
                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        placeholder="Amount (₹)"
                                        value={newComp.amount}
                                        onChange={e => setNewComp({ ...newComp, amount: e.target.value })}
                                    />
                                    <label className="flex items-center gap-2 text-xs font-bold">
                                        <input 
                                            type="checkbox"
                                            checked={newComp.is_mandatory}
                                            onChange={e => setNewComp({ ...newComp, is_mandatory: e.target.checked })}
                                        />
                                        Mandatory Component
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={addComponent}
                                        className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                                    >
                                        Add Component
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase text-slate-400">Component List</p>
                                {components.map((c, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-xs">
                                        <div>
                                            <p className="font-bold">{c.name}</p>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{c.category} • {c.is_mandatory ? 'Mandatory' : 'Optional'}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black">₹{c.amount.toLocaleString()}</span>
                                            <button onClick={() => removeComponent(idx)} className="text-rose-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Installments */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl space-y-4">
                                <p className="text-xs font-black uppercase text-slate-400">Configure Installment</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        placeholder="Term Name (e.g. Quarter 1)"
                                        value={newInst.term}
                                        onChange={e => setNewInst({ ...newInst, term: e.target.value })}
                                    />
                                    <input 
                                        type="date"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        value={newInst.due_date}
                                        onChange={e => setNewInst({ ...newInst, due_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 items-center">
                                    <input 
                                        type="number"
                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        placeholder="Percentage (%)"
                                        value={newInst.percentage}
                                        onChange={e => setNewInst({ ...newInst, percentage: e.target.value, fixed_amount: '' })}
                                    />
                                    <span className="text-xs font-bold text-slate-400">or</span>
                                    <input 
                                        type="number"
                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs outline-none"
                                        placeholder="Fixed Amount (₹)"
                                        value={newInst.fixed_amount}
                                        onChange={e => setNewInst({ ...newInst, fixed_amount: e.target.value, percentage: '' })}
                                    />
                                    <button 
                                        type="button"
                                        onClick={addInstallment}
                                        className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                                    >
                                        Add Term
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase text-slate-400">Installments Queue</p>
                                {installments.map((inst, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-xs">
                                        <div>
                                            <p className="font-bold">{inst.term}</p>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3.5 h-3.5" /> Due: {inst.due_date}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-indigo-600">
                                                {inst.percentage ? `${inst.percentage}%` : `₹${inst.fixed_amount}`}
                                            </span>
                                            <button onClick={() => removeInstallment(idx)} className="text-rose-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Class Mappings */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <p className="text-xs font-black uppercase text-slate-400">Select Target Class Groups</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {classesList.map(c => (
                                    <label 
                                        key={c.id} 
                                        className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer text-xs font-bold transition-all ${
                                            selectedClasses.includes(c.id) 
                                                ? 'bg-indigo-600 text-white border-indigo-700' 
                                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border-slate-100 dark:border-white/10'
                                        }`}
                                    >
                                        <input 
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedClasses.includes(c.id)}
                                            onChange={() => toggleClass(c.id)}
                                        />
                                        {c.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Final Preview */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-600" />
                                <p className="text-xs font-bold uppercase text-indigo-700 tracking-wider">Please review structure configurations before publishing.</p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-black">{name || 'Unnamed Fee Structure'}</h3>
                                <p className="text-xs font-bold text-slate-400">Target Classes: {selectedClasses.length} selected</p>
                            </div>

                            <div className="border-t border-b border-slate-100 dark:border-white/10 py-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Summary Details</p>
                                <div className="flex justify-between text-xs font-bold">
                                    <span>Total Value:</span>
                                    <span className="text-indigo-600">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span>Installments:</span>
                                    <span>{installments.length > 0 ? `${installments.length} terms` : 'One-time full payment'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-white/10">
                        {step > 1 && (
                            <button 
                                onClick={() => setStep((step - 1) as any)}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-wider"
                            >
                                Back
                            </button>
                        )}
                        {step < 5 ? (
                            <button 
                                onClick={() => setStep((step + 1) as any)}
                                className="ml-auto px-6 py-3 bg-slate-800 text-white dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={handlePublish}
                                className="ml-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider"
                            >
                                Publish Structure
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Panel: Published Structure Versions */}
                <div className={`${GLASS_BASE} space-y-6`}>
                    <div>
                        <h3 className="text-xl font-bold uppercase tracking-tight">Version Registry</h3>
                        <p className="text-xs text-slate-400">Active template configurations</p>
                    </div>

                    <div className="space-y-4">
                        {publishedStructures.map((struct) => (
                            <div key={struct.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-3 border border-slate-100 dark:border-white/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-xs">{struct.name}</h4>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Version {struct.version} • {struct.academic_year?.year_label}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-bold rounded-lg text-[9px] uppercase tracking-widest">Active</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-slate-100 dark:border-white/5 pt-2">
                                    <span className="text-slate-400">Components:</span>
                                    <span className="font-bold">{struct.components?.length || 0} items</span>
                                </div>
                            </div>
                        ))}
                        {publishedStructures.length === 0 && (
                            <div className="text-center py-12 opacity-50">
                                <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-widest">No structures published yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
