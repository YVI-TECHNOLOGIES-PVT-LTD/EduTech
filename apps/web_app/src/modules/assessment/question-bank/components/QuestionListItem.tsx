import { useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Edit2, Trash2, Check, HelpCircle, GraduationCap } from 'lucide-react';
import { QuestionItem } from '../services/question.api';
import { useDeleteQuestion } from '../hooks/useQuestionBank';
import { useToast } from '../../../../components/ui/use-toast';

interface QuestionListItemProps {
    question: QuestionItem;
    onEdit: (question: QuestionItem) => void;
}

export function QuestionListItem({ question, onEdit }: QuestionListItemProps) {
    const { mutateAsync: deleteQuestion, isPending: isDeleting } = useDeleteQuestion();
    const { toast } = useToast();
    const [showOptions, setShowOptions] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this question? This will soft delete this version.')) return;
        try {
            await deleteQuestion(question.id);
            toast({ title: 'Success', description: 'Question soft deleted.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'EASY': return 'bg-green-50 text-green-700 border-green-100';
            case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'HARD': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'DRAFT': return 'bg-blue-100 text-blue-800';
            case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
            case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 hover:border-gray-200 transition">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={`text-[9px] font-black rounded-full px-2 ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-black rounded-full px-2 bg-blue-50 text-blue-700 border-blue-100">
                            {question.question_type}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-black rounded-full px-2 bg-purple-50 text-purple-700 border-purple-100">
                            {question.bloom_level}
                        </Badge>
                        {question.course_outcome_code && (
                            <Badge variant="outline" className="text-[9px] font-black rounded-full px-2 bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-0.5">
                                <GraduationCap className="w-2.5 h-2.5" /> {question.course_outcome_code}
                            </Badge>
                        )}
                        <span className="text-[10px] text-gray-400 font-bold">Version {question.version}</span>
                        <Badge className={`text-[9px] font-black rounded-full ${getStatusColor(question.status)}`}>
                            {question.status}
                        </Badge>
                    </div>

                    <p className="text-xs font-black text-gray-900 leading-relaxed pr-2 pt-1">{question.question_text}</p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                    <Button
                        onClick={() => onEdit(question)}
                        size="icon"
                        variant="outline"
                        className="w-7 h-7 rounded-lg text-gray-500 border-gray-200"
                    >
                        <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                        onClick={handleDelete}
                        size="icon"
                        variant="outline"
                        disabled={isDeleting}
                        className="w-7 h-7 rounded-lg text-red-500 border-gray-200 hover:bg-red-50"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Expand Options link */}
            {question.question_type !== 'SUBJECTIVE' && question.options?.length > 0 && (
                <div className="pt-1">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        {showOptions ? 'Hide Option Keys' : `Show Options (${question.options.length})`}
                    </button>

                    {showOptions && (
                        <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-gray-100">
                            {question.options.map((opt, idx) => (
                                <div
                                    key={opt.id || idx}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs ${
                                        opt.is_correct
                                            ? 'bg-green-50 text-green-800 font-bold border border-green-100'
                                            : 'text-gray-600 bg-gray-50'
                                    }`}
                                >
                                    {opt.is_correct ? (
                                        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <span className="w-3.5 text-[10px] text-gray-400 font-bold flex-shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                    )}
                                    <span className="truncate">{opt.option_text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Explanation / Notes */}
            {question.explanation && showOptions && (
                <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50 text-[10px] text-amber-900 leading-normal">
                    <span className="font-black text-amber-800">Explanation:</span> {question.explanation}
                </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold pt-1">
                <span>Subject Index: {question.subject_id}</span>
                <span>Points Weight: {question.points} pt</span>
            </div>
        </div>
    );
}
export default QuestionListItem;
