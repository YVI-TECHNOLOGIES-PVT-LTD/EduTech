import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlueprint, useBlueprintEditor, useBlueprintValidation } from '../hooks/useBlueprintBuilder';
import { useSubjectsList } from '../../question-bank/hooks/useQuestionBank';
import { ArrowLeft, Plus, Trash2, ShieldCheck, Loader2, Info } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { useToast } from '../../../../components/ui/use-toast';

export const BlueprintEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: subjects } = useSubjectsList();
    const { data: blueprint, isLoading: isLoadingBlueprint } = useBlueprint(id || '');
    const { createBlueprint, updateBlueprint, isCreating, isUpdating } = useBlueprintEditor();
    const { validateBlueprint, isValidating } = useBlueprintValidation();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [totalMarks, setTotalMarks] = useState(100);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [sections, setSections] = useState<any[]>([]);

    const [validationReport, setValidationReport] = useState<any | null>(null);

    useEffect(() => {
        if (blueprint) {
            setName(blueprint.name);
            setDescription(blueprint.description || '');
            setTotalMarks(blueprint.total_marks);
            setSelectedSubjectId(blueprint.subject_id);
            setSections(blueprint.sections || []);
        } else {
            setName('');
            setDescription('');
            setTotalMarks(100);
            setSelectedSubjectId('');
            setSections([
                {
                    section_name: 'Section A',
                    points_per_question: 1,
                    negative_marks: 0,
                    total_questions: 10,
                    sort_order: 1,
                    rules: [{ filter_field: 'difficulty', filter_value: 'EASY', match_operator: 'eq' }]
                }
            ]);
        }
    }, [blueprint]);

    const handleAddSection = () => {
        setSections([...sections, {
            section_name: `Section ${String.fromCharCode(65 + sections.length)}`,
            points_per_question: 1,
            negative_marks: 0,
            total_questions: 5,
            sort_order: sections.length + 1,
            rules: []
        }]);
    };

    const handleRemoveSection = (idx: number) => {
        setSections(sections.filter((_, i) => i !== idx));
    };

    const handleSectionChange = (idx: number, field: string, val: any) => {
        const updated = [...sections];
        updated[idx][field] = val;
        setSections(updated);
    };

    const handleAddRule = (secIdx: number) => {
        const updated = [...sections];
        if (!updated[secIdx].rules) updated[secIdx].rules = [];
        updated[secIdx].rules.push({ filter_field: 'difficulty', filter_value: 'MEDIUM', match_operator: 'eq' });
        setSections(updated);
    };

    const handleRemoveRule = (secIdx: number, ruleIdx: number) => {
        const updated = [...sections];
        updated[secIdx].rules = updated[secIdx].rules.filter((_: any, i: number) => i !== ruleIdx);
        setSections(updated);
    };

    const handleRuleChange = (secIdx: number, ruleIdx: number, field: string, val: any) => {
        const updated = [...sections];
        updated[secIdx].rules[ruleIdx][field] = val;
        setSections(updated);
    };

    // Run real-time validation checks
    const runValidation = async () => {
        if (!selectedSubjectId) return;
        const payload = {
            subject_id: selectedSubjectId,
            name,
            total_marks: totalMarks,
            sections
        };
        try {
            const res = await validateBlueprint(payload);
            setValidationReport(res);
        } catch (err) {}
    };

    useEffect(() => {
        if (selectedSubjectId) {
            runValidation();
        }
    }, [sections, totalMarks, selectedSubjectId]);

    const handleSave = async () => {
        if (!name.trim() || !selectedSubjectId) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please complete name and subject fields.' });
            return;
        }

        const payload = {
            subject_id: selectedSubjectId,
            name: name.trim(),
            description: description.trim() || null,
            total_marks: Number(totalMarks),
            sections
        };

        try {
            if (id) {
                await updateBlueprint({ id, payload });
                toast({ title: 'Success', description: 'Blueprint details updated.' });
            } else {
                await createBlueprint(payload);
                toast({ title: 'Success', description: 'New blueprint drafted successfully.' });
            }
            navigate('/app/assessment/blueprints');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Saving', description: error.message });
        }
    };

    if (id && isLoadingBlueprint) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying blueprint context...</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/app/assessment/blueprints')}
                    className="rounded-xl border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {id ? 'Modify Blueprint Draft' : 'Build Custom Exam Blueprint'}
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Setup sections details, questions marks weights, and filter constraint rules.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                {/* Rules Section editor */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white p-6 space-y-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-3">Header Details</h4>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Blueprint Title</Label>
                                <Input
                                    placeholder="Final Exam Blueprint v1"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-xl border-gray-200 h-10 text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Target Course Subject</Label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                                >
                                    <option value="">Select Target Subject</option>
                                    {subjects?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Total Marks target</Label>
                                <Input
                                    type="number"
                                    value={totalMarks}
                                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                                    className="rounded-xl border-gray-200 h-10 text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Description Remarks</Label>
                                <Input
                                    placeholder="Enter additional remarks..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="rounded-xl border-gray-200 h-10 text-xs font-bold"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Section list builder */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Blueprint Sections</h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddSection}
                                className="h-8 text-[10px] font-black rounded-lg border-gray-200"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
                            </Button>
                        </div>

                        {sections.map((sec, secIdx) => (
                            <Card key={secIdx} className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white p-6 space-y-4 relative group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSection(secIdx)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-destructive h-8 w-8 hover:bg-destructive/5 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4.5 h-4.5" />
                                </Button>

                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase">Section Name</Label>
                                        <Input
                                            value={sec.section_name}
                                            onChange={(e) => handleSectionChange(secIdx, 'section_name', e.target.value)}
                                            className="rounded-xl border-gray-200 h-10 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase">Total Questions</Label>
                                        <Input
                                            type="number"
                                            value={sec.total_questions}
                                            onChange={(e) => handleSectionChange(secIdx, 'total_questions', Number(e.target.value))}
                                            className="rounded-xl border-gray-200 h-10 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase">Points per Question</Label>
                                        <Input
                                            type="number"
                                            value={sec.points_per_question}
                                            onChange={(e) => handleSectionChange(secIdx, 'points_per_question', Number(e.target.value))}
                                            className="rounded-xl border-gray-200 h-10 text-xs font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Rules under section */}
                                <div className="space-y-3 pt-3 border-t border-gray-50">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase">Randomization Rules</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleAddRule(secIdx)}
                                            className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-0.5" /> Add filter rule
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {sec.rules?.map((rule: any, ruleIdx: number) => (
                                            <div key={ruleIdx} className="flex items-center gap-2 bg-slate-50 p-2 border border-gray-100 rounded-xl relative group/rule">
                                                <select
                                                    value={rule.filter_field}
                                                    onChange={(e) => handleRuleChange(secIdx, ruleIdx, 'filter_field', e.target.value)}
                                                    className="h-8 border border-gray-200 rounded-lg text-[10px] font-bold bg-white text-gray-700 px-2 outline-none"
                                                >
                                                    <option value="difficulty">Difficulty</option>
                                                    <option value="bloom_level">Bloom Level</option>
                                                    <option value="course_outcome">Course Outcome</option>
                                                </select>

                                                <Input
                                                    placeholder="Filter Value (e.g. EASY, APPLY, CO1)"
                                                    value={rule.filter_value}
                                                    onChange={(e) => handleRuleChange(secIdx, ruleIdx, 'filter_value', e.target.value)}
                                                    className="h-8 rounded-lg border-gray-200 text-[10px] bg-white"
                                                />

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveRule(secIdx, ruleIdx)}
                                                    className="h-7 w-7 text-gray-400 hover:text-destructive rounded-lg opacity-0 group-hover/rule:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Validation sidebar report */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden p-6 space-y-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-3">
                            <ShieldCheck className="w-4.5 h-4.5 text-primary" /> Validation engine logs
                        </h4>

                        {isValidating ? (
                            <div className="flex items-center justify-center py-6 text-gray-400 gap-1.5">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Checking constraints...
                            </div>
                        ) : !validationReport ? (
                            <p className="text-[10px] text-gray-400 font-bold text-center py-4">No warnings found. All distribution percentages match.</p>
                        ) : (
                            <div className="space-y-3">
                                {validationReport.success ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                                        <ShieldCheck className="w-4 h-4 shrink-0" /> Ready to Submit
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-destructive uppercase">Discrepancies Detected</Label>
                                        {validationReport.errors?.map((err: string, i: number) => (
                                            <div key={i} className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-700 font-bold leading-normal flex gap-1 items-start">
                                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                <span>{err}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {validationReport.warnings && validationReport.warnings.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                        <Label className="text-[9px] font-black text-amber-600 uppercase">Pool Warnings</Label>
                                        {validationReport.warnings.map((warn: string, i: number) => (
                                            <div key={i} className="p-2 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-700 font-bold leading-normal flex gap-1 items-start">
                                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                <span>{warn}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    <Button
                        onClick={handleSave}
                        disabled={isCreating || isUpdating}
                        className="w-full bg-primary text-white rounded-2xl text-xs font-black h-11 shadow-premium-md hover:scale-[1.01] transition-transform"
                    >
                        Save Blueprint Rules
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default BlueprintEditorPage;
