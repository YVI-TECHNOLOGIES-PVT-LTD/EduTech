import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTemplateDetail, useTemplateEditor, useTemplateValidation } from '../hooks/useTemplateBuilder';
import { useSubjectsList } from '../../question-bank/hooks/useQuestionBank';
import { useBlueprints } from '../../blueprint-builder/hooks/useBlueprintBuilder';
import { TemplateHeaderDesigner } from '../components/TemplateHeaderDesigner';
import { TemplateFooterDesigner } from '../components/TemplateFooterDesigner';
import { TemplateLayoutRulesForm } from '../components/TemplateLayoutRulesForm';
import { TemplateLivePreview } from '../components/TemplateLivePreview';
import { TemplateValidationPanel } from '../components/TemplateValidationPanel';
import { ArrowLeft, Plus, Trash2, Loader2, Save, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { useToast } from '../../../../components/ui/use-toast';

export const TemplateEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: subjects } = useSubjectsList();
    const { data: blueprintsData } = useBlueprints({ page: 1, limit: 100 });
    const { data: template, isLoading: isLoadingTemplate } = useTemplateDetail(id);
    const { createTemplate, updateTemplate, saveLayout, isCreating, isUpdating, isSavingLayout } = useTemplateEditor();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
    const [instructions, setInstructions] = useState('');

    const [header, setHeader] = useState<any>({
        institution_logo: true,
        school_name: true,
        exam_name: true,
        subject: true,
        class: true,
        academic_year: true,
        exam_date: true,
        duration: true,
        max_marks: true,
        student_name: true,
        hall_ticket: true,
        signature_block: true,
        qr_code: false,
        barcode: false
    });

    const [footer, setFooter] = useState<any>({
        invigilator_signature: true,
        chief_superintendent: true,
        generated_timestamp: true,
        page_number: true,
        confidential_watermark: false,
        qr_verification: false,
        instructions_footer: true
    });

    const [layoutRules, setLayoutRules] = useState<any[]>([
        { property: 'page_size', value: 'A4' },
        { property: 'orientation', value: 'Portrait' },
        { property: 'font', value: 'Arial' },
        { property: 'columns', value: '1' }
    ]);

    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        if (template) {
            setName(template.name);
            setDescription(template.description || '');
            setSelectedSubjectId(template.subject_id);
            setSelectedBlueprintId(template.blueprint_id || '');
            setInstructions(template.instructions || '');
            setSections(template.sections || []);
            if (template.header) setHeader(template.header);
            if (template.footer) setFooter(template.footer);
            if (template.layoutRules && template.layoutRules.length > 0) {
                setLayoutRules(template.layoutRules);
            }
        }
    }, [template]);

    const handleAddSection = () => {
        setSections([...sections, {
            section_name: `Section ${String.fromCharCode(65 + sections.length)}`,
            description: '',
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

    const handleSave = async () => {
        if (!name.trim() || !selectedSubjectId) {
            toast({ variant: 'destructive', title: 'Input Error', description: 'Name and subject are required.' });
            return;
        }

        const payload = {
            subject_id: selectedSubjectId,
            blueprint_id: selectedBlueprintId || null,
            name: name.trim(),
            description: description.trim() || null,
            instructions: instructions.trim(),
            header,
            footer,
            layoutRules,
            sections
        };

        try {
            if (id) {
                await updateTemplate({ id, payload });
                toast({ title: 'Template Saved', description: 'Layout rules changes applied successfully.' });
            } else {
                const res = await createTemplate(payload);
                toast({ title: 'Template Created', description: 'New paper template created.' });
                navigate(`/app/assessment/templates/${res.id}/edit`);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Saving', description: error.message });
        }
    };

    if (id && isLoadingTemplate) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying template metadata...</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header controls bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/app/assessment/templates')}
                        className="rounded-xl border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                            <Sparkles className="w-5 h-5 text-primary" />
                            {id ? 'Format Rendering Template' : 'Configure Custom Layout Template'}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Set up headers, margins, instructions blocks, and visual formatting rules.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isCreating || isUpdating}
                    className="bg-primary text-white rounded-xl text-xs font-black h-10 shadow-premium-sm hover:scale-[1.01] transition-transform"
                >
                    <Save className="w-4 h-4" /> Save Template
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Left Form: Header, Footer, Page rules, Instructions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Header meta */}
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white p-6 space-y-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-1">
                            <BookOpen className="w-4.5 h-4.5 text-primary" /> General Properties
                        </h4>
                        
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Template Title</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Midterm A4 Portrait Template"
                                    className="rounded-xl h-10 text-xs font-bold border-gray-200"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Description</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe this layout template..."
                                    className="rounded-xl h-10 text-xs font-bold border-gray-200"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Subject Classification</Label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Blueprint Map Contract</Label>
                                <select
                                    value={selectedBlueprintId}
                                    onChange={(e) => setSelectedBlueprintId(e.target.value)}
                                    className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                                >
                                    <option value="">No Blueprint Linked</option>
                                    {blueprintsData?.data?.map(bp => (
                                        <option key={bp.id} value={bp.id}>{bp.name} ({bp.total_marks} Marks)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Instructions to Candidates</Label>
                                <Textarea
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="Enter instructions block..."
                                    className="rounded-xl min-h-[80px] text-xs font-bold border-gray-200"
                                />
                            </div>
                        </div>
                    </Card>

                    <TemplateHeaderDesigner header={header} onChange={setHeader} />
                    <TemplateFooterDesigner footer={footer} onChange={setFooter} />
                    <TemplateLayoutRulesForm rules={layoutRules} onChange={setLayoutRules} />
                </div>

                {/* Middle Form: Section Designer */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Template Sections List</h4>
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
                        <Card key={secIdx} className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white p-5 space-y-4 relative group">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveSection(secIdx)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-destructive h-8 w-8 hover:bg-destructive/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4.5 h-4.5" />
                            </Button>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">Section Name</Label>
                                    <Input
                                        value={sec.section_name}
                                        onChange={(e) => handleSectionChange(secIdx, 'section_name', e.target.value)}
                                        className="h-10 rounded-xl text-xs font-bold border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">Total Questions</Label>
                                    <Input
                                        type="number"
                                        value={sec.total_questions}
                                        onChange={(e) => handleSectionChange(secIdx, 'total_questions', Number(e.target.value))}
                                        className="h-10 rounded-xl text-xs font-bold border-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">Points per Question</Label>
                                    <Input
                                        type="number"
                                        value={sec.points_per_question}
                                        onChange={(e) => handleSectionChange(secIdx, 'points_per_question', Number(e.target.value))}
                                        className="h-10 rounded-xl text-xs font-bold border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">Description / Instruction</Label>
                                    <Input
                                        value={sec.description || ''}
                                        onChange={(e) => handleSectionChange(secIdx, 'description', e.target.value)}
                                        placeholder="Optional instructions..."
                                        className="h-10 rounded-xl text-xs font-bold border-gray-200"
                                    />
                                </div>
                            </div>

                            {/* Section dynamic selection rules */}
                            <div className="space-y-3 pt-3 border-t border-gray-50">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[9px] font-black text-gray-400 uppercase">Section Selection Rules</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddRule(secIdx)}
                                        className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-0.5" /> Add Rule
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
                                                placeholder="Filter value..."
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

                {/* Right sidebar: Live Preview & Validation Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {id && <TemplateLivePreview templateId={id} />}
                    {id && <TemplateValidationPanel templateId={id} />}
                </div>
            </div>
        </div>
    );
};
export default TemplateEditorPage;
