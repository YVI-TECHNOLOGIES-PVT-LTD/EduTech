import React from 'react';
import { useTemplateValidation } from '../hooks/useTemplateBuilder';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { ShieldCheck, Info, Loader2, AlertTriangle } from 'lucide-react';
import { Label } from '../../../../components/ui/label';

interface TemplateValidationPanelProps {
    templateId: string;
}

export const TemplateValidationPanel: React.FC<TemplateValidationPanelProps> = ({ templateId }) => {
    const { data: report, isLoading } = useTemplateValidation(templateId);

    if (isLoading) {
        return (
            <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white p-5 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-[10px] text-gray-400 font-bold">Validating rendering contract...</span>
            </Card>
        );
    }

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden p-5 space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <ShieldCheck className="w-4.5 h-4.5 text-primary" /> Template Verification Panel
            </h4>

            {!report ? (
                <p className="text-[10px] text-gray-400 font-bold text-center py-2">No verification metrics resolved.</p>
            ) : (
                <div className="space-y-3">
                    {report.success ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                            <ShieldCheck className="w-4.5 h-4.5 shrink-0" /> Rendering Contract Active
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black text-destructive uppercase">Discrepancies found</Label>
                            {report.errors?.map((err, i) => (
                                <div key={i} className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-700 font-bold leading-normal flex gap-1 items-start">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {report.warnings && report.warnings.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-gray-50">
                            <Label className="text-[9px] font-black text-amber-600 uppercase">Verification Warnings</Label>
                            {report.warnings.map((warn, i) => (
                                <div key={i} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-bold leading-normal flex gap-1 items-start">
                                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>{warn}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
export default TemplateValidationPanel;
