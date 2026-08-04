import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlueprintVersions, useBlueprint } from '../hooks/useBlueprintBuilder';
import { BlueprintTimeline } from '../components/BlueprintTimeline';
import { ArrowLeft, Loader2, GitCompare } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../components/ui/dialog';
import { useToast } from '../../../../components/ui/use-toast';
import { BlueprintItem } from '../services/blueprint.api';

export const BlueprintHistoryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: blueprint } = useBlueprint(id || '');
    const { versions, isLoading, restoreVersion, isRestoring } = useBlueprintVersions(id || '');

    const [compareOpen, setCompareOpen] = useState(false);
    const [v1Compare, setV1Compare] = useState<BlueprintItem | null>(null);
    const [v2Compare, setV2Compare] = useState<BlueprintItem | null>(null);

    const handleCompare = (v1: BlueprintItem, v2: BlueprintItem) => {
        setV1Compare(v1);
        setV2Compare(v2);
        setCompareOpen(true);
    };

    const handleRestore = async (versionNumber: number) => {
        if (!confirm(`Are you sure you want to restore this blueprint rules to version ${versionNumber}?`)) return;
        try {
            await restoreVersion(versionNumber);
            toast({
                title: 'Blueprint Restored',
                description: `Successfully rolled back to version ${versionNumber}.`
            });
            navigate(`/app/assessment/blueprints/${id}`);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Restore Failed',
                description: error.message
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying versions list...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/app/assessment/blueprints/${id}`)}
                    className="rounded-xl border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Blueprint History Control</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Audit snapshot version rollbacks and diff section rules changes.
                    </p>
                </div>
            </div>

            <BlueprintTimeline 
                versions={versions}
                onCompare={handleCompare}
                onRestore={handleRestore}
                isRestoring={isRestoring}
            />

            {/* Compare Dialog */}
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
                <DialogContent className="max-w-4xl rounded-3xl p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                            <GitCompare className="w-4.5 h-4.5 text-primary" /> Version Diff Comparison
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-400">
                            Comparing section rules structures side-by-side.
                        </DialogDescription>
                    </DialogHeader>

                    {v1Compare && v2Compare && (
                        <div className="grid md:grid-cols-2 gap-6 pt-4 items-start">
                            {/* Version 1 */}
                            <div className="space-y-4 border border-gray-100 p-5 rounded-2xl bg-slate-50/50">
                                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                                    Version {v1Compare.version} (Active)
                                </h4>
                                <div className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-100 min-h-[40px] leading-relaxed font-bold">
                                    {v1Compare.name} - {v1Compare.total_marks} Marks
                                </div>
                                <div className="space-y-2">
                                    {v1Compare.sections?.map((sec, idx) => (
                                        <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl text-xs">
                                            <div className="font-bold">{sec.section_name} ({sec.total_questions} questions)</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Version 2 */}
                            <div className="space-y-4 border border-gray-100 p-5 rounded-2xl bg-slate-50/50">
                                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                                    Version {v2Compare.version} (Past)
                                </h4>
                                <div className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-100 min-h-[40px] leading-relaxed font-bold">
                                    {v2Compare.name} - {v2Compare.total_marks} Marks
                                </div>
                                <div className="space-y-2">
                                    {v2Compare.sections?.map((sec, idx) => (
                                        <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl text-xs">
                                            <div className="font-bold">{sec.section_name} ({sec.total_questions} questions)</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setCompareOpen(false)}
                            className="rounded-xl text-xs font-bold"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
export default BlueprintHistoryPage;
