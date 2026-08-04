import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { useQuestionFolders, useCreateQuestion, useUpdateQuestion } from '../hooks/useQuestionBank';
import { useToast } from '../../../../components/ui/use-toast';
import { Plus, Trash2, Save, X, HelpCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { QuestionItem } from '../services/question.api';

interface QuestionEditorProps {
    editingQuestion: QuestionItem | null;
    subjectId: string;
    academicYearId: string;
    onCancel: () => void;
    onSaveSuccess: () => void;
}

export function QuestionEditor({ editingQuestion, subjectId, academicYearId, onCancel, onSaveSuccess }: QuestionEditorProps) {
    const { folders } = useQuestionFolders();
    const { mutateAsync: createQuestion, isPending: isCreating } = useCreateQuestion();
    const { mutateAsync: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
    const { toast } = useToast();

    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState<QuestionItem['question_type']>('MCQ');
    const [difficulty, setDifficulty] = useState<QuestionItem['difficulty']>('MEDIUM');
    const [bloomLevel, setBloomLevel] = useState<QuestionItem['bloom_level']>('UNDERSTAND');
    const [points, setPoints] = useState(1);
    const [negativeMarks, setNegativeMarks] = useState(0);
    const [explanation, setExplanation] = useState('');
    const [courseOutcome, setCourseOutcome] = useState('');
    const [programOutcome, setProgramOutcome] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [options, setOptions] = useState<{ option_text: string; is_correct: boolean }[]>([]);

    useEffect(() => {
        if (editingQuestion) {
            setQuestionText(editingQuestion.question_text);
            setQuestionType(editingQuestion.question_type);
            setDifficulty(editingQuestion.difficulty);
            setBloomLevel(editingQuestion.bloom_level);
            setPoints(editingQuestion.points);
            setNegativeMarks(editingQuestion.negative_marks);
            setExplanation(editingQuestion.explanation || '');
            setCourseOutcome(editingQuestion.course_outcome_code || '');
            setProgramOutcome(editingQuestion.program_outcome_code || '');
            setSelectedFolderId(editingQuestion.folder_id || '');
            setOptions(editingQuestion.options || []);
        } else {
            setQuestionText('');
            setQuestionType('MCQ');
            setDifficulty('MEDIUM');
            setBloomLevel('UNDERSTAND');
            setPoints(1);
            setNegativeMarks(0);
            setExplanation('');
            setCourseOutcome('');
            setProgramOutcome('');
            setSelectedFolderId('');
            setOptions([
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false }
            ]);
        }
    }, [editingQuestion]);

    const handleAddOption = () => {
        setOptions([...options, { option_text: '', is_correct: false }]);
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, idx) => idx !== index));
    };

    const handleOptionTextChange = (index: number, val: string) => {
        const updated = [...options];
        updated[index].option_text = val;
        setOptions(updated);
    };

    const handleOptionCorrectToggle = (index: number) => {
        const updated = [...options];
        if (questionType === 'MCQ' || questionType === 'TRUE_FALSE') {
            // Only single option correct
            updated.forEach((opt, idx) => {
                opt.is_correct = idx === index;
            });
        } else {
            // Multi-select allowed
            updated[index].is_correct = !updated[index].is_correct;
        }
        setOptions(updated);
    };

    const handleSave = async () => {
        if (!questionText.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Question text cannot be empty.' });
            return;
        }

        if (questionType !== 'SUBJECTIVE') {
            if (options.length === 0) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'At least one option is required.' });
                return;
            }
            const hasCorrect = options.some(o => o.is_correct);
            if (!hasCorrect) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'At least one correct option must be marked.' });
                return;
            }
            const hasEmptyText = options.some(o => !o.option_text.trim());
            if (hasEmptyText) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'All option texts must be populated.' });
                return;
            }
        }

        const payload: any = {
            academic_year_id: academicYearId,
            subject_id: subjectId,
            folder_id: selectedFolderId || null,
            question_text: questionText.trim(),
            question_type: questionType,
            difficulty,
            bloom_level: bloomLevel,
            points: Number(points),
            negative_marks: Number(negativeMarks),
            explanation: explanation.trim() || null,
            course_outcome_code: courseOutcome.trim() || null,
            program_outcome_code: programOutcome.trim() || null,
            options: questionType === 'SUBJECTIVE' ? [] : options
        };

        try {
            if (editingQuestion) {
                await updateQuestion({ id: editingQuestion.id, payload });
                toast({ title: 'Success', description: 'Question updated.' });
            } else {
                await createQuestion(payload);
                toast({ title: 'Success', description: 'Question created.' });
            }
            onSaveSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Saving', description: error.message });
        }
    };

    return (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-sm font-black text-gray-900">
                        {editingQuestion ? `Edit Question (v${editingQuestion.version})` : 'Create Question'}
                    </CardTitle>
                    <CardDescription className="text-[10px] text-gray-400">
                        Configure layout questions, options weighting, and outcome markers.
                    </CardDescription>
                </div>
                <Button onClick={onCancel} variant="outline" size="sm" className="h-8 rounded-xl text-xs flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Question Format</Label>
                        <select
                            value={questionType}
                            onChange={(e) => setQuestionType(e.target.value as any)}
                            disabled={!!editingQuestion && editingQuestion.status === 'APPROVED'}
                            className="w-full h-9 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3"
                        >
                            <option value="MCQ">MCQ (Single Choice)</option>
                            <option value="MULTIPLE_SELECT">Multi-Select (Checkbox)</option>
                            <option value="TRUE_FALSE">True/False</option>
                            <option value="SUBJECTIVE">Essay / Subjective</option>
                            <option value="FILL_BLANKS">Fill in the Blanks</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Difficulty Grade</Label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as any)}
                            className="w-full h-9 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3"
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Bloom Taxonomy Level</Label>
                        <select
                            value={bloomLevel}
                            onChange={(e) => setBloomLevel(e.target.value as any)}
                            className="w-full h-9 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3"
                        >
                            <option value="REMEMBER">Remember</option>
                            <option value="UNDERSTAND">Understand</option>
                            <option value="APPLY">Apply</option>
                            <option value="ANALYZE">Analyze</option>
                            <option value="EVALUATE">Evaluate</option>
                            <option value="CREATE">Create</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Folder Directory</Label>
                        <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full h-9 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3"
                        >
                            <option value="">Unorganized (Root)</option>
                            {folders?.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Points</Label>
                        <Input
                            type="number"
                            step="0.5"
                            value={points}
                            onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
                            className="rounded-xl border-gray-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Negative Marks</Label>
                        <Input
                            type="number"
                            step="0.25"
                            value={negativeMarks}
                            onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                            className="rounded-xl border-gray-200"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Question Content</Label>
                    <Textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Type question content..."
                        className="rounded-xl border-gray-200 min-h-[90px]"
                    />
                </div>

                {/* DYNAMIC OPTIONS */}
                {questionType !== 'SUBJECTIVE' && (
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-xs font-black text-gray-900">Choices & Options Configuration</span>
                            <Button
                                onClick={handleAddOption}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-bold border-dashed flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5 text-primary" /> Add Choice Option
                            </Button>
                        </div>

                        {options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <input
                                    type={questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'}
                                    name="option_correct"
                                    checked={opt.is_correct}
                                    onChange={() => handleOptionCorrectToggle(idx)}
                                    className="rounded border-gray-300 text-primary w-4 h-4"
                                />
                                <Input
                                    type="text"
                                    value={opt.option_text}
                                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                    placeholder={`Option text ${String.fromCharCode(65 + idx)}`}
                                    className="h-8 text-xs rounded-lg border-gray-200 bg-white"
                                />
                                <Button
                                    onClick={() => handleRemoveOption(idx)}
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg border-gray-200 text-red-500 hover:bg-red-50 flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Course Outcome (CO)</Label>
                        <Input
                            type="text"
                            value={courseOutcome}
                            onChange={(e) => setCourseOutcome(e.target.value)}
                            placeholder="e.g. CO-3A"
                            className="rounded-xl border-gray-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Program Outcome (PO)</Label>
                        <Input
                            type="text"
                            value={programOutcome}
                            onChange={(e) => setProgramOutcome(e.target.value)}
                            placeholder="e.g. PO-1"
                            className="rounded-xl border-gray-200"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Explanation & Grading Guidelines</Label>
                    <Textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Add scoring guidelines or detailed explanation..."
                        className="rounded-xl border-gray-200 min-h-[60px]"
                    />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-50 pt-4">
                    <Button onClick={onCancel} variant="outline" className="rounded-xl border-gray-200 text-xs font-bold">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isCreating || isUpdating}
                        className="bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1.5 px-4"
                    >
                        {isCreating || isUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save Question
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
export default QuestionEditor;
