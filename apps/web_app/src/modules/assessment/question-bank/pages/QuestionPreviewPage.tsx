import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuestion, useQuestionFolders } from '../hooks/useQuestionBank';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2, GitPullRequest } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

export const QuestionPreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: question, isLoading, refetch } = useQuestion(id || '');
    const { folders } = useQuestionFolders();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying question details...</span>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h3 className="text-sm font-black text-gray-900 mt-4">Question Not Found</h3>
                <Button onClick={() => navigate('/app/assessment/questions')} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    const folderName = folders.find(f => f.id === question.folder_id)?.name || 'Root Folder';

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/app/assessment/questions')}
                    className="rounded-xl border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Question Audit & Preview</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Verify outcome tags and transition approval states.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                {/* Details Card */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-primary" /> Question Content Preview
                            </CardTitle>
                            <DifficultyBadge difficulty={question.difficulty} />
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-5 bg-slate-50 border border-gray-100 rounded-2xl">
                                <p className="text-sm font-black text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {question.question_text}
                                </p>
                            </div>

                            {/* Option list */}
                            {question.options && question.options.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Choice Options List</h5>
                                    <div className="grid gap-2">
                                        {question.options.map((opt: any, idx: number) => (
                                            <div 
                                                key={opt.id || idx}
                                                className={`flex items-center justify-between p-3.5 border rounded-xl shadow-premium-sm transition-all ${
                                                    opt.is_correct 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' 
                                                        : 'bg-white border-gray-100 text-gray-700'
                                                }`}
                                            >
                                                <span className="text-xs leading-normal">{opt.option_text}</span>
                                                {opt.is_correct && (
                                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {question.explanation && (
                                <div className="space-y-1.5 pt-3 border-t border-gray-50">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Model Explanation</h5>
                                    <p className="text-xs text-gray-500 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                                        {question.explanation}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata tags */}
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-gray-50 p-6">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-primary" /> Curricular Annotations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Subject Classification</span>
                                <p className="text-xs font-bold text-gray-800">UUID: {question.subject_id}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Nested Location</span>
                                <p className="text-xs font-bold text-gray-800">{folderName}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Cognitive Bloom Index</span>
                                <p className="text-xs font-bold text-gray-800">{question.bloom_level}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Course Outcomes Mapping</span>
                                <p className="text-xs font-bold text-gray-800">{question.course_outcome_code || 'Unlinked'}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Positive Marks</span>
                                <p className="text-xs font-bold text-gray-800">{question.points} pts</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Negative Penalty</span>
                                <p className="text-xs font-bold text-gray-800">{question.negative_marks} pts</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Workflow Transition Sidebar Widget */}
                <div className="md:col-span-1 space-y-6">
                    <ApprovalTimeline 
                        questionId={question.id}
                        currentStatus={question.status}
                        onStatusChange={refetch}
                    />

                    {/* Version History Widget shortcut */}
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden p-6 space-y-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-3">
                            <GitPullRequest className="w-4 h-4 text-primary" /> Active Versions
                        </h4>
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>Current Live Version</span>
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-2">v{question.version}</Badge>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/app/assessment/questions/${question.id}/history`)}
                            className="w-full rounded-xl border-gray-200 text-xs font-black"
                        >
                            View Versions Timeline
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default QuestionPreviewPage;
