import React from 'react';
import { GitCommit, RotateCcw, GitCompare, User } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface TemplateVersion {
    id: string;
    version: number;
    schema_snapshot: any;
    created_at: string;
}

interface TemplateTimelineProps {
    versions: TemplateVersion[];
    onCompare: (v1: TemplateVersion, v2: TemplateVersion) => void;
    onRestore: (versionNumber: number) => void;
    isRestoring?: boolean;
}

export const TemplateTimeline: React.FC<TemplateTimelineProps> = ({
    versions,
    onCompare,
    onRestore,
    isRestoring
}) => {
    return (
        <div className="relative border-l border-gray-100 pl-6 space-y-6 ml-3">
            {versions.map((ver, idx) => {
                const dateStr = new Date(ver.created_at).toLocaleString();
                const isActive = idx === 0;

                return (
                    <div key={ver.id} className="relative group">
                        {/* Timeline node dot icon */}
                        <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white transition-colors ${
                            isActive ? 'border-primary' : 'border-gray-200'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-gray-200'}`} />
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-premium-sm hover:shadow-premium-md transition-shadow">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-black text-gray-900">
                                        Snapshot Version v{ver.version}
                                    </h4>
                                    {isActive && (
                                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-md">
                                            Active Contract
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                    <GitCommit className="w-3.5 h-3.5" /> Snapshot timestamp: {dateStr}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {idx < versions.length - 1 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onCompare(versions[0], ver)}
                                        className="h-8 text-[10px] font-black rounded-lg border-gray-200"
                                    >
                                        <GitCompare className="w-3.5 h-3.5 mr-1" /> Compare with Active
                                    </Button>
                                )}

                                {!isActive && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isRestoring}
                                        onClick={() => onRestore(ver.version)}
                                        className="h-8 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg border-gray-200 shrink-0"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore Version
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
export default TemplateTimeline;
