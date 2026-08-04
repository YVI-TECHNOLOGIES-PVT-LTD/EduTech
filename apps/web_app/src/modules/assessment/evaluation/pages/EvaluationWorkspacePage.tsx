import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Eye, Award, CheckCircle, RefreshCw, AlertCircle, 
    CornerDownRight, Plus, HelpCircle, Undo, Save
} from 'lucide-react';
import { useEvaluation } from '../hooks/useEvaluation';

export const EvaluationWorkspacePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { evaluateQuestion, transitionWorkflow } = useEvaluation();

    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Workspace states
    const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
    const [awardedMarks, setAwardedMarks] = useState<number>(0);
    const [remarks, setRemarks] = useState<string>('');
    const [annotations, setAnnotations] = useState<any[]>([]);

    // Annotation toolbar mock states
    const [annotationType, setAnnotationType] = useState<'Highlight' | 'Rectangle' | 'Strike' | 'Text Comment'>('Text Comment');
    const [annotationComment, setAnnotationComment] = useState('');

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchSessionDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:3000/v1/assessment/evaluations/session/${id}`, getHeaders());
            setSession(res.data);
            
            // Set current evaluation scores details if already saved
            const currentQ = res.data.questionEvaluations?.[selectedQuestionIdx];
            setAwardedMarks(currentQ ? Number(currentQ.awarded_marks) : 0);
            setRemarks(currentQ ? currentQ.remarks || '' : '');
            setAnnotations(currentQ?.annotations || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchSessionDetails();
    }, [id, selectedQuestionIdx]);

    const handleSaveQuestionScore = async () => {
        if (!session) return;
        const currentQSnapshot = session.questionEvaluations?.[selectedQuestionIdx] || {
            question_snapshot_id: 'a9b21f3d-9d41-4cf1-88f5-93deec90d1f1', // Mock fallback
            maximum_marks: 10
        };

        try {
            await evaluateQuestion(
                id!,
                currentQSnapshot.question_snapshot_id,
                awardedMarks,
                currentQSnapshot.maximum_marks || 10,
                remarks,
                annotations
            );
            alert('Scoring details successfully saved!');
            fetchSessionDetails();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleAddAnnotation = () => {
        if (!annotationComment.trim()) return;
        const newAnn = {
            type: annotationType,
            coordinates: { x: Math.random() * 200, y: Math.random() * 200 },
            comment_text: annotationComment
        };
        setAnnotations(prev => [...prev, newAnn]);
        setAnnotationComment('');
    };

    const handleFinalize = async () => {
        try {
            await transitionWorkflow(id!, 'FINALIZED');
            alert('Session evaluation marked finalized! Forwarded to Results engine.');
            navigate('/app/assessment/evaluation');
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <div className="text-xs font-bold text-rose-600">{error || 'Session context not found.'}</div>
                <button onClick={() => navigate('/app/assessment/evaluation')} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">
                    Go Back
                </button>
            </div>
        );
    }

    const currentQEval = session.questionEvaluations?.[selectedQuestionIdx];

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto h-full flex flex-col">
            {/* Header toolbar */}
            <div className="flex justify-between items-center bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/assessment/evaluation')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                            Digital Scoring Desk Workspace
                        </h2>
                        <div className="text-[10px] text-gray-400">
                            Attempt UUID: {session.attempt_id} | Status: <span className="font-black text-primary">{session.status}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleFinalize}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-premium-sm"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Finalize & Lock Marks
                    </button>
                </div>
            </div>

            {/* Split view workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-full">
                {/* Left Columns - Script & Annotations overlay */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card border border-gray-200 rounded-3xl p-6 shadow-premium-md space-y-4">
                        <div className="pb-3 border-b border-gray-150 flex justify-between items-center">
                            <span className="font-bold text-xs text-gray-900 uppercase">Question Script Canvas</span>
                            
                            {/* Annotations toolbar selector */}
                            <div className="flex items-center gap-2 text-[10px]">
                                <select 
                                    value={annotationType} 
                                    onChange={(e) => setAnnotationType(e.target.value as any)}
                                    className="p-1 border border-gray-200 rounded"
                                >
                                    <option value="Text Comment">Text Comment</option>
                                    <option value="Highlight">Highlight</option>
                                    <option value="Rectangle">Rectangle</option>
                                    <option value="Strike">Strike</option>
                                </select>
                                <input 
                                    type="text" 
                                    placeholder="Enter comment..." 
                                    value={annotationComment}
                                    onChange={(e) => setAnnotationComment(e.target.value)}
                                    className="p-1 border border-gray-200 rounded w-28"
                                />
                                <button 
                                    onClick={handleAddAnnotation}
                                    className="p-1 bg-primary text-white rounded font-bold"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Student Response Canvas */}
                        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl min-h-[250px] relative space-y-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Student Attempt Answer:</div>
                            
                            <p className="text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
                                {`The primary database normalization stages include:
1. First Normal Form (1NF): Eliminates duplicate attributes, ensures atomic scalar cell formats.
2. Second Normal Form (2NF): Eliminates partial key functional dependencies mappings.
3. Third Normal Form (3NF): Eliminates transitive columns relationship values.`}
                            </p>

                            {/* Render coordinate-based overlay items logs */}
                            {annotations.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
                                    <div className="text-[10px] font-bold text-primary uppercase">Canvas Comment Markers:</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                        {annotations.map((ann, i) => (
                                            <div key={i} className="p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800">
                                                <span className="font-bold uppercase font-mono">[{ann.type}]</span> {ann.comment_text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Columns - Rubric parameters pickers */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card border border-gray-200 rounded-3xl p-6 shadow-premium-md space-y-4">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Scoring & Rubric Selector
                        </h4>

                        <div className="space-y-3 text-xs">
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Awarded Score Marks</label>
                                <input 
                                    type="number" 
                                    step="0.5"
                                    value={awardedMarks}
                                    onChange={(e) => setAwardedMarks(Number(e.target.value))}
                                    className="p-2.5 border border-gray-200 rounded-xl text-xs font-bold font-mono text-primary bg-primary/5"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-400">Evaluator Review Remarks</label>
                                <textarea 
                                    placeholder="Enter criteria remarks feedback..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="p-2.5 border border-gray-200 rounded-xl h-24"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveQuestionScore}
                            className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold transition-all shadow-premium-sm text-xs flex items-center justify-center gap-1.5"
                        >
                            <Save className="w-4 h-4" />
                            Save Score
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EvaluationWorkspacePage;
