import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlueprints, useBlueprintEditor, useBlueprintAnalytics } from '../hooks/useBlueprintBuilder';
import { useSubjectsList } from '../../question-bank/hooks/useQuestionBank';
import { BlueprintCard } from '../components/BlueprintCard';
import { ClipboardList, Plus, FileText, Loader2, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useToast } from '../../../../components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';

export const BlueprintDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [selectedSubject, setSelectedSubject] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, refetch } = useBlueprints({
        subjectId: selectedSubject || undefined,
        page,
        limit: 10
    });

    const { cloneBlueprint } = useBlueprintEditor();
    const { data: metrics } = useBlueprintAnalytics();
    const { data: subjects } = useSubjectsList();

    const handleClone = async (id: string, name: string) => {
        try {
            const res = await cloneBlueprint({ id, name: `${name} (Copy)` });
            toast({
                title: 'Blueprint Cloned',
                description: `Successfully cloned as ${res.name}.`
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

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" /> Exam Blueprint Builder
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Formulate assessment rule templates, outcomes mappings, difficulty constraints, and randomization pools.
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
                        onClick={() => navigate('/app/assessment/blueprints/new')}
                        className="bg-primary text-white rounded-xl text-xs font-black h-10 shadow-premium-sm hover:scale-[1.01] transition-transform"
                    >
                        <Plus className="w-4 h-4" /> Create Blueprint
                    </Button>
                </div>
            </div>

            {/* Metrics cards widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Active Blueprints</h4>
                    <p className="text-2xl font-black text-gray-900 mt-1">{metrics?.totalBlueprints || 0}</p>
                </Card>
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Draft Rule Layouts</h4>
                    <p className="text-2xl font-black text-gray-900 mt-1">{metrics?.statusDistribution?.DRAFT || 0}</p>
                </Card>
                <Card className="rounded-3xl border border-gray-100 p-5 shadow-premium-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Published Blueprints</h4>
                    <p className="text-2xl font-black text-gray-900 mt-1">{metrics?.statusDistribution?.PUBLISHED || 0}</p>
                </Card>
            </div>

            {/* Blueprints listing grid */}
            {isLoading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-premium-sm">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-2 text-sm text-gray-500 font-bold">Querying blueprints list...</span>
                </div>
            ) : !data || data.data.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-premium-sm">
                    <p className="text-xs text-gray-400 font-bold">No blueprints found. Get started by clicking "Create Blueprint".</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.data.map(bp => (
                        <BlueprintCard
                            key={bp.id}
                            blueprint={bp}
                            onClick={() => navigate(`/app/assessment/blueprints/${bp.id}`)}
                            onClone={() => handleClone(bp.id, bp.name)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
export default BlueprintDashboardPage;
