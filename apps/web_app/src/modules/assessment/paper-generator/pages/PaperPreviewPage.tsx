import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Eye, CheckSquare, ListOrdered, FileText, 
    Printer, Award, CornerDownRight, AlertCircle, RefreshCw
} from 'lucide-react';

export const PaperPreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paper, setPaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'candidate' | 'moderator' | 'answer_key'>('candidate');

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const fetchPaper = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:3000/v1/assessment/papers/${id}`, getHeaders());
            setPaper(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPaper();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !paper) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <div className="text-xs font-bold text-rose-600">{error || 'Paper details not found.'}</div>
                <button onClick={() => navigate('/app/assessment/papers')} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/assessment/papers')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            {paper.name}
                        </h1>
                        <p className="text-[10px] text-gray-400 mt-1">
                            Status: <span className="font-bold text-primary">{paper.status}</span> | Marks: {paper.total_marks} | Version: {paper.version}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 text-xs">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold border border-gray-200"
                    >
                        <Printer className="w-4 h-4" />
                        Print Layout
                    </button>
                </div>
            </div>

            {/* Preview toggle tabs */}
            <div className="flex bg-white dark:bg-card p-1.5 rounded-2xl border border-gray-100 max-w-md shadow-premium-sm">
                {(['candidate', 'moderator', 'answer_key'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setPreviewType(type)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            previewType === type 
                                ? 'bg-primary text-white shadow-premium-sm' 
                                : 'text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {type.replace('_', ' ')} copy
                    </button>
                ))}
            </div>

            {/* Exam Paper Sheet */}
            <div className="bg-white dark:bg-card border border-gray-200 rounded-3xl p-8 space-y-6 shadow-premium-md print:border-none print:shadow-none">
                {/* Paper Header / Title Block */}
                <div className="text-center space-y-2 pb-6 border-b-2 border-dashed border-gray-200">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                        EduTrack Examination Services
                    </h2>
                    <h3 className="text-base font-black text-primary">{paper.name}</h3>
                    <div className="flex justify-center gap-6 text-[10px] font-bold text-gray-400">
                        <span>TIME ALLOWED: 3 HOURS</span>
                        <span>MAXIMUM MARKS: {paper.total_marks}</span>
                    </div>
                </div>

                {/* Candidate Instructions */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 text-[10px] space-y-2">
                    <div className="font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        Candidate Instructions:
                    </div>
                    <ul className="list-disc list-inside text-gray-500 space-y-1">
                        <li>Write your registration credentials clearly on the answer sheets.</li>
                        <li>Attempt all questions from each section layout.</li>
                        <li>No reference material, calculators, or smart devices are allowed inside the examination hall.</li>
                    </ul>
                </div>

                {/* Sections and Questions */}
                <div className="space-y-8">
                    {paper.sections?.map((sec: any, sIdx: number) => (
                        <div key={sec.id} className="space-y-4">
                            <div className="pb-2 border-b border-gray-200 flex justify-between items-end">
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                    Section {String.fromCharCode(65 + sIdx)}: {sec.section_name}
                                </h4>
                                <span className="text-[10px] text-gray-400 font-bold">
                                    ({sec.total_questions} Questions × {sec.points_per_question} Points)
                                </span>
                            </div>

                            <div className="space-y-6">
                                {sec.questions?.map((item: any, qIdx: number) => {
                                    const q = item.question;
                                    return (
                                        <div key={item.id} className="space-y-2 text-xs">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="font-bold text-gray-900 dark:text-white">
                                                    Q{qIdx + 1}. {q.question_text}
                                                </div>
                                                <span className="text-[10px] font-mono text-gray-400 shrink-0">
                                                    [{sec.points_per_question} Marks]
                                                </span>
                                            </div>

                                            {/* Options list for multiple choice */}
                                            {q.options && q.options.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                                                    {q.options.map((opt: any, oIdx: number) => {
                                                        const isCorrect = opt.is_correct;
                                                        const letter = String.fromCharCode(65 + oIdx);
                                                        return (
                                                            <div 
                                                                key={opt.id} 
                                                                className={`p-2 rounded-xl border text-[11px] ${
                                                                    previewType === 'answer_key' && isCorrect
                                                                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 font-bold'
                                                                        : 'border-gray-100 bg-gray-50/50'
                                                                }`}
                                                            >
                                                                {letter}. {opt.option_text}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Moderator details */}
                                            {previewType === 'moderator' && (
                                                <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold text-violet-600 bg-violet-50 p-2 rounded-xl border border-violet-100">
                                                    <span className="flex items-center gap-1">
                                                        <Award className="w-3.5 h-3.5" />
                                                        Level: {q.difficulty}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Bloom: {q.bloom_level}</span>
                                                    <span>•</span>
                                                    <span>Outcome: {q.course_outcome_code || 'N/A'}</span>
                                                </div>
                                            )}

                                            {/* Answer Key Explanation */}
                                            {previewType === 'answer_key' && q.explanation && (
                                                <div className="mt-2 p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] text-emerald-800 space-y-1">
                                                    <div className="font-bold flex items-center gap-1">
                                                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-500" />
                                                        Answer Explanation:
                                                    </div>
                                                    <p className="text-emerald-700/80">{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default PaperPreviewPage;
