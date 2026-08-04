import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    GraduationCap,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    Users,
    Filter,
    ArrowUpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentPromotion = () => {
    const [years, setYears] = useState<any[]>([]);
    const [fromYearId, setFromYearId] = useState('');
    const [toYearId, setToYearId] = useState('');

    const [sourceClasses, setSourceClasses] = useState<any[]>([]);
    const [sourceClassId, setSourceClassId] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    const [targetClasses, setTargetClasses] = useState<any[]>([]);
    const [targetClassId, setTargetClassId] = useState('');
    const [targetSections, setTargetSections] = useState<any[]>([]);
    const [targetSectionId, setTargetSectionId] = useState('');

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        apiClient.get('/academic-years').then(res => setYears(res.data));
    }, []);

    useEffect(() => {
        if (fromYearId) {
            apiClient.get('/academic/classes').then(res => {
                const filtered = res.data.filter((c: any) => c.academic_year_id === fromYearId);
                setSourceClasses(filtered);
            });
        }
    }, [fromYearId]);

    useEffect(() => {
        if (toYearId) {
            apiClient.get('/academic/classes').then(res => {
                const filtered = res.data.filter((c: any) => c.academic_year_id === toYearId);
                setTargetClasses(filtered);
            });
        }
    }, [toYearId]);

    useEffect(() => {
        if (sourceClassId) {
            apiClient.get('/students', { params: { limit: 1000 } }).then(res => {
                const classStudents = res.data.data.filter((s: any) =>
                    s.sections?.some((sec: any) => sec.section?.class_id === sourceClassId && sec.academic_year_id === fromYearId)
                );
                setStudents(classStudents);
                setSelectedStudentIds(classStudents.map((s: any) => s.id));
            });
        }
    }, [sourceClassId, fromYearId]);

    useEffect(() => {
        if (targetClassId) {
            apiClient.get('/academic/sections', { params: { classId: targetClassId } }).then(res => {
                setTargetSections(res.data);
            });
        }
    }, [targetClassId]);

    const handlePromote = async (isDryRun: boolean = false) => {
        if (!selectedStudentIds.length || !targetSectionId) return;

        setLoading(true);
        try {
            const res = await apiClient.post('/admin/students/promote', {
                from_academic_year_id: fromYearId,
                to_academic_year_id: toYearId,
                student_ids: selectedStudentIds,
                target_section_id: targetSectionId,
                is_dry_run: isDryRun
            });

            if (isDryRun) {
                alert("Dry run successful! Count: " + res.data.results.total);
            } else {
                setResults(res.data.results);
                setStep(3);
            }
        } catch (err: any) {
            alert(err.response?.data?.error || "Promotion failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <ArrowUpCircle className="w-10 h-10 text-blue-600" />
                        Academic Promotion
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Bulk move students to the next academic session.</p>
                </div>
                <Link to="/app/students" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold transition-all">
                    <ChevronLeft className="w-5 h-5" />
                    Back to Directory
                </Link>
            </header>

            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {[
                    { n: 1, text: "Selection" },
                    { n: 2, text: "Mapping" },
                    { n: 3, text: "Done" }
                ].map((s) => (
                    <div key={s.n} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${step === s.n ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'
                        }`}>
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold leading-none">
                            {s.n}
                        </span>
                        <span className="font-bold text-sm">{s.text}</span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            Source Session
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">From Academic Year</label>
                                <select
                                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                    value={fromYearId}
                                    onChange={e => setFromYearId(e.target.value)}
                                >
                                    <option value="">Select Year...</option>
                                    {years.map(y => (
                                        <option key={y.id} value={y.id}>{y.year_label} {y.is_active ? '(Active)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">From Class</label>
                                <select
                                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                    value={sourceClassId}
                                    onChange={e => setSourceClassId(e.target.value)}
                                    disabled={!fromYearId}
                                >
                                    <option value="">Select source class...</option>
                                    {sourceClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {students.length > 0 && (
                            <div className="pt-4 border-t border-gray-50">
                                <p className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {students.length} Students found in this class
                                </p>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {students.map(s => (
                                        <label key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(s.id)}
                                                onChange={() => {
                                                    setSelectedStudentIds(prev =>
                                                        prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                    )
                                                }}
                                                className="w-4 h-4 rounded text-blue-600"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">{s.full_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            Target Session
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">To Academic Year</label>
                                <select
                                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                    value={toYearId}
                                    onChange={e => setToYearId(e.target.value)}
                                >
                                    <option value="">Select Target Year...</option>
                                    {years.map(y => (
                                        <option key={y.id} value={y.id} disabled={y.id === fromYearId}>{y.year_label}</option>
                                    ))}
                                </select>
                            </div>

                            {toYearId && (
                                <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                    <p className="text-sm text-blue-700 font-medium">Selected year data will be isolated from current sessions.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Class</label>
                                <select
                                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                    value={targetClassId}
                                    onChange={e => setTargetClassId(e.target.value)}
                                    disabled={!toYearId}
                                >
                                    <option value="">Select target class...</option>
                                    {targetClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Section</label>
                                <select
                                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                    value={targetSectionId}
                                    onChange={e => setTargetSectionId(e.target.value)}
                                    disabled={!targetClassId}
                                >
                                    <option value="">Select target section...</option>
                                    {targetSections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedStudentIds.length || !targetSectionId}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                                Continue to Mapping
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm space-y-8 animate-in zoom-in duration-500 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-amber-600" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">Ready to Promote?</h2>
                        <div className="text-left bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-gray-400 uppercase">Transition</span>
                                <span className="text-blue-600">
                                    {years.find(y => y.id === fromYearId)?.year_label} → {years.find(y => y.id === toYearId)?.year_label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-gray-400 uppercase">Student Count</span>
                                <span className="text-gray-900">{selectedStudentIds.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-gray-400 uppercase">Move To</span>
                                <span className="text-green-600">
                                    {targetClasses.find(c => c.id === targetClassId)?.name} - {targetSections.find(s => s.id === targetSectionId)?.name}
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100 text-left">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                            <p className="text-sm text-amber-700 font-medium">
                                This action will create new records for the next academic session. Existing records for the current year will remain untouched.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all border border-gray-100"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => handlePromote(false)}
                                disabled={loading}
                                className="flex-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all"
                            >
                                {loading ? "Processing..." : "Promote Students Now"}
                            </button>
                        </div>
                        <button
                            onClick={() => handlePromote(true)}
                            className="text-sm text-blue-600 font-bold hover:underline"
                        >
                            Run Dry Preview
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && results && (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm space-y-8 animate-in zoom-in duration-500 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">Promotion Successful!</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <p className="text-2xl font-black text-blue-600">{results.promoted}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Promoted</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <p className="text-2xl font-black text-amber-600">{results.skipped}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Skipped</p>
                            </div>
                        </div>

                        {results.errors?.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-left">
                                <p className="text-xs font-bold text-red-600 uppercase mb-2">Errors Occurred:</p>
                                <ul className="text-xs text-red-700 list-disc pl-4 space-y-1">
                                    {results.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setStep(1);
                                setResults(null);
                                setSourceClassId('');
                                setTargetSectionId('');
                            }}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all"
                        >
                            Promote More Students
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
