import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Plus, Trash2, Save, Send, AlertTriangle, ChevronDown } from 'lucide-react';
import { useUpdateTemplateSections, usePublishTemplate } from '../hooks/useTemplateBuilder';

interface Rule {
    filter_field: 'difficulty' | 'bloom_level' | 'tags' | 'course_outcome' | 'program_outcome';
    filter_value: string;
    match_operator: 'eq' | 'in' | 'like';
}

interface Section {
    section_name: string;
    description: string | null;
    points_per_question: number;
    negative_marks: number;
    total_questions: number;
    sort_order: number;
    rules: Rule[];
}

interface TemplateSectionsDesignerProps {
    template: any;
    onSaveSuccess: () => void;
    onCancel: () => void;
}

export function TemplateSectionsDesigner({ template, onSaveSuccess, onCancel }: TemplateSectionsDesignerProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [publishWarnings, setPublishWarnings] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const updateSectionsMutation = useUpdateTemplateSections(template.id);
    const publishMutation = usePublishTemplate(template.id);

    // Initialize state with template sections if editing
    useEffect(() => {
        if (template.sections && template.sections.length > 0) {
            setSections(
                template.sections.map((s: any) => ({
                    section_name: s.section_name,
                    description: s.description || '',
                    points_per_question: Number(s.points_per_question),
                    negative_marks: Number(s.negative_marks || 0),
                    total_questions: Number(s.total_questions),
                    sort_order: Number(s.sort_order),
                    rules: (s.rules || []).map((r: any) => ({
                        filter_field: r.filter_field,
                        filter_value: r.filter_value,
                        match_operator: r.match_operator || 'eq'
                    }))
                }))
            );
        } else {
            // Add a default section
            setSections([
                {
                    section_name: 'Section A: MCQs',
                    description: 'Multiple choice questions section',
                    points_per_question: 1,
                    negative_marks: 0,
                    total_questions: 10,
                    sort_order: 1,
                    rules: []
                }
            ]);
        }
    }, [template]);

    const handleAddSection = () => {
        const nextSort = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 1;
        setSections([
            ...sections,
            {
                section_name: `Section ${String.fromCharCode(65 + sections.length)}`,
                description: '',
                points_per_question: 1,
                negative_marks: 0,
                total_questions: 5,
                sort_order: nextSort,
                rules: []
            }
        ]);
    };

    const handleRemoveSection = (index: number) => {
        const updated = sections.filter((_, i) => i !== index);
        setSections(updated.map((s, i) => ({ ...s, sort_order: i + 1 })));
    };

    const handleSectionChange = (index: number, key: keyof Section, val: any) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [key]: val };
        setSections(updated);
    };

    const handleAddRule = (sectionIndex: number) => {
        const updated = [...sections];
        updated[sectionIndex].rules = [
            ...updated[sectionIndex].rules,
            { filter_field: 'difficulty', filter_value: 'MEDIUM', match_operator: 'eq' }
        ];
        setSections(updated);
    };

    const handleRemoveRule = (sectionIndex: number, ruleIndex: number) => {
        const updated = [...sections];
        updated[sectionIndex].rules = updated[sectionIndex].rules.filter((_, idx) => idx !== ruleIndex);
        setSections(updated);
    };

    const handleRuleChange = (sectionIndex: number, ruleIndex: number, key: keyof Rule, val: any) => {
        const updated = [...sections];
        updated[sectionIndex].rules[ruleIndex] = { ...updated[sectionIndex].rules[ruleIndex], [key]: val };
        setSections(updated);
    };

    const calculateTotalMarks = () => {
        return sections.reduce((sum, s) => sum + s.points_per_question * s.total_questions, 0);
    };

    const calculateTotalQuestions = () => {
        return sections.reduce((sum, s) => sum + s.total_questions, 0);
    };

    const handleSave = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await updateSectionsMutation.mutateAsync(sections);
            setSuccessMsg('Sections successfully saved.');
            setTimeout(() => onSaveSuccess(), 1000);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.error || e.message || 'Failed to save sections.');
        }
    };

    const handlePublish = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        setPublishWarnings([]);
        try {
            // Save sections first
            await updateSectionsMutation.mutateAsync(sections);
            // Trigger publish
            const res: any = await publishMutation.mutateAsync();
            if (res?.warnings && res.warnings.length > 0) {
                setPublishWarnings(res.warnings);
                setSuccessMsg('Template published successfully with warnings.');
            } else {
                setSuccessMsg('Template successfully published.');
                setTimeout(() => onSaveSuccess(), 1000);
            }
        } catch (e: any) {
            setErrorMsg(e.response?.data?.error || e.message || 'Failed to publish template.');
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header detail */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-lg font-black text-gray-900">Structure Designer — {template.name}</h2>
                    <p className="text-xs text-gray-500">{template.description || 'No description provided'}</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        Status: {template.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 font-bold">Version: {template.version}</p>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
                    {errorMsg}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-green-50 text-green-600 rounded-xl text-xs font-bold">
                    {successMsg}
                </div>
            )}

            {publishWarnings.length > 0 && (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-xs text-amber-700">
                        <AlertTriangle className="w-4 h-4" /> Attention: Insufficient matching questions in Bank
                    </div>
                    <ul className="list-disc pl-5 text-[11px] space-y-1 font-medium">
                        {publishWarnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                        ))}
                    </ul>
                    <Button
                        onClick={onSaveSuccess}
                        size="sm"
                        className="bg-amber-600 text-white rounded-lg text-[10px] font-black h-7 mt-2"
                    >
                        Acknowledge Warnings & Close
                    </Button>
                </div>
            )}

            {/* List of sections */}
            <div className="space-y-6">
                {sections.map((sec, idx) => (
                    <div key={idx} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4 relative">
                        <button
                            onClick={() => handleRemoveSection(idx)}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition"
                            title="Delete Section"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase">Section Name</label>
                                <Input
                                    value={sec.section_name}
                                    onChange={(e) => handleSectionChange(idx, 'section_name', e.target.value)}
                                    placeholder="e.g. Section A: Multiple Choice"
                                    className="h-9 border-gray-200 mt-1 rounded-xl text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase">Points per Question</label>
                                <Input
                                    type="number"
                                    value={sec.points_per_question}
                                    onChange={(e) => handleSectionChange(idx, 'points_per_question', Number(e.target.value))}
                                    className="h-9 border-gray-200 mt-1 rounded-xl text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase">Total Questions</label>
                                <Input
                                    type="number"
                                    value={sec.total_questions}
                                    onChange={(e) => handleSectionChange(idx, 'total_questions', Number(e.target.value))}
                                    className="h-9 border-gray-200 mt-1 rounded-xl text-xs font-bold"
                                />
                            </div>
                        </div>

                        {/* Rules selection */}
                        <div className="pt-3 border-t border-gray-200/60">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Dynamic Question Filters</span>
                                <Button
                                    type="button"
                                    onClick={() => handleAddRule(idx)}
                                    variant="ghost"
                                    className="text-primary text-[10px] font-black h-6 hover:bg-primary/5 px-2 flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Filter Rule
                                </Button>
                            </div>

                            {sec.rules.length === 0 ? (
                                <p className="text-[10px] text-gray-400 italic">No rules configured. All subject questions eligible.</p>
                            ) : (
                                <div className="space-y-2">
                                    {sec.rules.map((rule, rIdx) => (
                                        <div key={rIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                            <select
                                                value={rule.filter_field}
                                                onChange={(e: any) => handleRuleChange(idx, rIdx, 'filter_field', e.target.value)}
                                                className="h-8 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 px-2"
                                            >
                                                <option value="difficulty">Difficulty</option>
                                                <option value="bloom_level">Bloom Level</option>
                                                <option value="course_outcome">Course Outcome</option>
                                                <option value="program_outcome">Program Outcome</option>
                                            </select>

                                            <select
                                                value={rule.match_operator}
                                                onChange={(e: any) => handleRuleChange(idx, rIdx, 'match_operator', e.target.value)}
                                                className="h-8 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 px-2"
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="in">Includes</option>
                                            </select>

                                            <Input
                                                value={rule.filter_value}
                                                onChange={(e) => handleRuleChange(idx, rIdx, 'filter_value', e.target.value)}
                                                placeholder="e.g. MEDIUM, REMEMBER, CO1"
                                                className="h-8 border-gray-200 text-[11px] font-bold flex-grow rounded-lg"
                                            />

                                            <button
                                                onClick={() => handleRemoveRule(idx, rIdx)}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Calculations and Actions summary */}
            <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-100 pt-6 gap-4">
                <div className="flex gap-6 text-sm">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black">Total Questions</span>
                        <p className="text-xl font-black text-gray-900">{calculateTotalQuestions()}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black">Total Marks Weight</span>
                        <p className="text-xl font-black text-primary">{calculateTotalMarks()} pts</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <Button
                        onClick={handleAddSection}
                        variant="outline"
                        className="border-gray-200 rounded-xl text-xs font-black px-4 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Add Section
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        className="text-gray-500 rounded-xl text-xs font-bold px-4"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateSectionsMutation.isPending}
                        className="bg-gray-950 text-white hover:bg-gray-800 rounded-xl text-xs font-black px-4 flex items-center gap-1.5"
                    >
                        <Save className="w-4 h-4" /> Save Draft
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={publishMutation.isPending}
                        className="bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-black px-4 flex items-center gap-1.5"
                    >
                        <Send className="w-4 h-4" /> Publish Template
                    </Button>
                </div>
            </div>
        </div>
    );
}
export default TemplateSectionsDesigner;
