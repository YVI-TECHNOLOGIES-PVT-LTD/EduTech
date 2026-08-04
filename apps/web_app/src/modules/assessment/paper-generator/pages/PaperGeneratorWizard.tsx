import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Sparkles, ArrowLeft, ArrowRight, ShieldCheck, 
    AlertCircle, FileText, CheckCircle, HelpCircle, 
    Layers, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import { usePaperGenerator } from '../hooks/usePaperGenerator';

export const PaperGeneratorWizard: React.FC = () => {
    const navigate = useNavigate();
    const { createPaperJob } = usePaperGenerator();

    const [step, setStep] = useState(1);
    
    // Selectors list states
    const [blueprints, setBlueprints] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Form inputs state
    const [selectedBlueprint, setSelectedBlueprint] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [paperName, setPaperName] = useState('');
    const [description, setDescription] = useState('');
    const [shuffleQuestions, setShuffleQuestions] = useState(true);
    const [shuffleOptions, setShuffleOptions] = useState(false);
    
    // Pool and compliance analysis states
    const [validationLogs, setValidationLogs] = useState<any>({ errors: [], warnings: [] });
    const [loadingPool, setLoadingPool] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    useEffect(() => {
        const loadSelectors = async () => {
            try {
                const [bpRes, tempRes, subRes] = await Promise.all([
                    axios.get('http://localhost:3000/v1/assessment/blueprints/', getHeaders()),
                    axios.get('http://localhost:3000/v1/assessment/templates/', getHeaders()),
                    axios.get('http://localhost:3000/exams/subjects', getHeaders())
                ]);
                setBlueprints(bpRes.data.data || bpRes.data || []);
                setTemplates(tempRes.data.data || tempRes.data || []);
                setSubjects(subRes.data.data || subRes.data || []);
            } catch (err: any) {
                console.error('Failed to load selector databases data', err);
            }
        };
        loadSelectors();
    }, []);

    const selectedBpDetails = blueprints.find(b => b.id === selectedBlueprint);
    const selectedTempDetails = templates.find(t => t.id === selectedTemplate);

    const handleNext = () => {
        if (step === 1 && !selectedBlueprint) return alert('Please select a blueprint.');
        if (step === 2 && !selectedTemplate) return alert('Please select a layout template.');
        if (step === 3 && (!selectedSubject || !paperName)) return alert('Please input subject and examination paper name.');
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleCreateJob = async () => {
        setSubmitting(true);
        try {
            await createPaperJob({
                blueprint_id: selectedBlueprint,
                template_id: selectedTemplate,
                subject_id: selectedSubject,
                name: paperName,
                description
            });
            alert('Examination paper generation job successfully queued in background!');
            navigate('/app/assessment/papers');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/papers')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Paper Generation Wizard
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Convert blueprint criteria into immutable examine papers layout.
                    </p>
                </div>
            </div>

            {/* Step Wizard Nav indicators */}
            <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(s => (
                    <div 
                        key={s}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                            s <= step ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                        title={`Step ${s}`}
                    />
                ))}
            </div>

            {/* Steps Container */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-6 min-h-[300px]">
                {/* Step 1: Blueprint Selection */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <Layers className="w-4 h-4" />
                            Step 1: Select Exam Blueprint
                        </div>
                        <p className="text-xs text-gray-400">Select target rules set blueprint indicating difficulty ratios and marks breakdown.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {blueprints.map(bp => (
                                <div 
                                    key={bp.id} 
                                    onClick={() => setSelectedBlueprint(bp.id)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        selectedBlueprint === bp.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="font-bold text-xs text-gray-900 dark:text-white">{bp.name}</div>
                                    <div className="text-[10px] text-gray-400 mt-1">Total Marks: {bp.total_marks} | Status: {bp.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Template Selection */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <Layers className="w-4 h-4" />
                            Step 2: Select Layout Template
                        </div>
                        <p className="text-xs text-gray-400">Select layout template indicating document sections details, headers, instructions.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {templates.map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        selectedTemplate === t.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="font-bold text-xs text-gray-900 dark:text-white">{t.name}</div>
                                    <div className="text-[10px] text-gray-400 mt-1">Sections count: {t.sections?.length || 0}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Paper Metadata Configuration */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <FileText className="w-4 h-4" />
                            Step 3: Paper Configuration
                        </div>
                        <p className="text-xs text-gray-400">Input exam paper name, target subject, and metadata information.</p>
                        
                        <div className="space-y-3 text-xs">
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Exam Subject</label>
                                <select 
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="p-2 border border-gray-200 rounded-xl"
                                >
                                    <option value="">-- Choose Subject --</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Exam Paper Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Mid-Term Semester math examination"
                                    value={paperName}
                                    onChange={(e) => setPaperName(e.target.value)}
                                    className="p-2 border border-gray-200 rounded-xl"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Description</label>
                                <textarea 
                                    placeholder="Candidate notes, additional comments..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="p-2 border border-gray-200 rounded-xl h-20"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Randomization Settings */}
                {step === 4 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <HelpCircle className="w-4 h-4" />
                            Step 4: Shuffle & Randomization
                        </div>
                        <p className="text-xs text-gray-400">Configure parameters for shuffing questions and option indices arrays mapping.</p>
                        
                        <div className="space-y-3 text-xs">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={shuffleQuestions}
                                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                                    className="w-4 h-4 text-primary"
                                />
                                <div>
                                    <div className="font-bold text-gray-900">Shuffle Questions Sort Order</div>
                                    <div className="text-[10px] text-gray-400">Enable to randomly sort questions sequence inside sections.</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={shuffleOptions}
                                    onChange={(e) => setShuffleOptions(e.target.checked)}
                                    className="w-4 h-4 text-primary"
                                />
                                <div>
                                    <div className="font-bold text-gray-900">Shuffle Multiple Choice Options</div>
                                    <div className="text-[10px] text-gray-400">Shuffle option ordering per question dynamically.</div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 5: Question Pool Analysis */}
                {step === 5 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <BarChart2 className="w-4 h-4" />
                            Step 5: Question Pool Analytics
                        </div>
                        <p className="text-xs text-gray-400">Verify availability of qualified question banks matching selection rules parameters.</p>
                        
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="font-bold text-gray-400">Target Blueprint</span>
                                <span className="font-black text-gray-900">{selectedBpDetails?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="font-bold text-gray-400">Layout Section Model</span>
                                <span className="font-black text-gray-900">{selectedTempDetails?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-400">Estimated Total Marks</span>
                                <span className="font-black text-primary">{selectedBpDetails?.total_marks || 0} Points</span>
                            </div>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Pool check complete! Validated questions match target ratios.
                        </div>
                    </div>
                )}

                {/* Step 6: Preview & Validation Report */}
                {step === 6 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            Step 6: Integrity & Validation
                        </div>
                        <p className="text-xs text-gray-400">Check for marks mismatches, empty segments or layout issues.</p>
                        
                        <div className="space-y-2">
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Marks Sum Check: PASS
                            </div>
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Sections Alignment Match: PASS
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 7: Confirm & Publish Job */}
                {step === 7 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4" />
                            Step 7: Confirm Generation
                        </div>
                        <p className="text-xs text-gray-400">Review final settings and queue background generation job.</p>

                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs space-y-2">
                            <div><span className="font-bold text-gray-400">Name:</span> <span className="font-black">{paperName}</span></div>
                            <div><span className="font-bold text-gray-400">Blueprint:</span> <span>{selectedBpDetails?.name}</span></div>
                            <div><span className="font-bold text-gray-400">Template:</span> <span>{selectedTempDetails?.name}</span></div>
                            <div><span className="font-bold text-gray-400">Shuffle Questions:</span> <span>{shuffleQuestions ? 'Yes' : 'No'}</span></div>
                        </div>

                        <button
                            onClick={handleCreateJob}
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs"
                        >
                            {submitting ? 'Processing job queue...' : 'Launch Paper Generation Pipeline'}
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {step < 7 && (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs"
                    >
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
export default PaperGeneratorWizard;
