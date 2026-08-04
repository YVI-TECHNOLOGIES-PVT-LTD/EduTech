import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplatesList, useTemplateEditor, useTemplateAnalytics } from '../hooks/useTemplateBuilder';
import { useSubjectsList } from '../../question-bank/hooks/useQuestionBank';
import { ClipboardList, Plus, FileText, Loader2, Copy, Trash2, ArrowUpRight, BarChart2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useToast } from '../../../../components/ui/use-toast';

export const TemplateDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [selectedSubject, setSelectedSubject] = useState('');
    const [page, setPage] = useState(1);

    const { data: subjects } = useSubjectsList();
    const { data: metrics } = useTemplateAnalytics();

    const { data, isLoading, refetch } = useTemplatesList({
        subjectId: selectedSubject || undefined,
        page,
        limit: 10
    });

    const { cloneTemplate, deleteTemplate } = useTemplateEditor();

    const handleClone = async (id: string, name: string) => {
        try {
            await cloneTemplate(id);
            toast({
                title: 'Template Cloned',
                description: `Successfully duplicated "${name}" as a new draft.`
            });
            refetch();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Clone Failed',
                description: error.message
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to archive this template?')) return;
        try {
            await deleteTemplate(id);
            toast({
                title: 'Template Archived',
                description: 'The template was successfully archived.'
            });
            refetch();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: error.message
            });
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" /> Exam Template Builder
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure reusable rendering contracts, styling metrics, instructions body, and barcode elements.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                    <select
                        value={selectedSubject}
                        onChange={(e) => { setSelectedSubject(e.target.value); setPage(1); }}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 outline-none shrink-0"
                    >
                        <option value="">All Subjects</option>
                        {subjects?.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                    </select>

                    <Button
                        onClick={() => navigate('/app/assessment/templates/new')}
                        className="bg-primary text-white rounded-xl text-xs font-black h-10 shadow-premium-sm hover:scale-[1.01] transition-transform"
                    >
                        <Plus className="w-4 h-4" /> Create Template
                    </Button>
                </div>
            </div>

            {/* Metrics distribution cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Templates</h4>
                    <p className="text-2xl font-black text-gray-900 mt-1">{metrics?.totalTemplates || 0}</p>
                </Card>
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Drafts</h4>
                    <p className="text-2xl font-black mt-1 text-amber-500">{metrics?.statusDistribution?.DRAFT || 0}</p>
                </Card>
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Approved Layouts</h4>
                    <p className="text-2xl font-black mt-1 text-emerald-500">{metrics?.statusDistribution?.APPROVED || 0}</p>
                </Card>
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Published Contracts</h4>
                    <p className="text-2xl font-black mt-1 text-violet-500">{metrics?.statusDistribution?.PUBLISHED || 0}</p>
                </Card>
            </div>

            {/* Templates listing grid */}
            {isLoading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-premium-sm">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-2 text-sm text-gray-500 font-bold">Querying templates registry...</span>
                </div>
            ) : !data || data.data.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-premium-sm">
                    <p className="text-xs text-gray-400 font-bold">No paper templates designed yet. Add one to start formatting.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.data.map(tpl => (
                        <Card key={tpl.id} className="rounded-3xl border border-gray-100 shadow-premium-sm hover:shadow-premium-md transition-all flex flex-col justify-between p-6 bg-white relative group">
                            <div>
                                <div className="flex justify-between items-start">
                                    <Badge className="text-[9px] font-black uppercase rounded-md tracking-wider">
                                        v{tpl.version}
                                    </Badge>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                        tpl.status === 'PUBLISHED' 
                                            ? 'bg-violet-50 text-violet-700 border border-violet-100' 
                                            : tpl.status === 'APPROVED'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                        {tpl.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-gray-900 mt-3 truncate">{tpl.name}</h3>
                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 min-h-[32px]">{tpl.description || 'No description provided.'}</p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-4 justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/app/assessment/templates/${tpl.id}`)}
                                    className="h-8 rounded-lg text-[10px] font-black border-gray-200"
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> View Details
                                </Button>

                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleClone(tpl.id, tpl.name)}
                                        className="h-8 w-8 text-gray-400 hover:text-primary rounded-lg"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    {tpl.status === 'DRAFT' && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(tpl.id)}
                                            className="h-8 w-8 text-gray-400 hover:text-destructive rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
export default TemplateDashboardPage;
