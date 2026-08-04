import React from 'react';
import { Button } from '../../../../components/ui/button';
import { History, RotateCcw } from 'lucide-react';
import { BlueprintItem } from '../services/blueprint.api';

interface BlueprintTimelineProps {
    versions: BlueprintItem[];
    onCompare: (v1: BlueprintItem, v2: BlueprintItem) => void;
    onRestore: (versionNumber: number) => void;
    isRestoring: boolean;
}

export const BlueprintTimeline: React.FC<BlueprintTimelineProps> = ({
    versions,
    onCompare,
    onRestore,
    isRestoring
}) => {
    return (
        <div className="space-y-4 bg-white dark:bg-card border border-gray-100 p-6 rounded-3xl shadow-premium-sm">
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <History className="w-4.5 h-4.5 text-primary" /> Version History Snapshots
            </h4>

            {versions.length <= 1 ? (
                <p className="text-xs text-gray-400 font-bold text-center py-6">No past versions found. Publishing snapshots creates version records.</p>
            ) : (
                <div className="space-y-4">
                    <div className="relative border-l-2 border-primary/20 ml-3 pl-6 space-y-6">
                        {versions.map((ver, idx) => (
                            <div key={ver.id || idx} className="relative group">
                                <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 bg-white border-2 border-primary rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-[8px] font-black text-primary">{ver.version}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <h5 className="text-xs font-black text-gray-800 leading-tight">
                                            Version {ver.version} <span className="text-[10px] text-gray-400 font-normal">({ver.status})</span>
                                        </h5>
                                        <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[240px]">
                                            {ver.name}
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {idx > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onCompare(versions[0], ver)}
                                                className="h-8 text-[10px] font-black rounded-lg border-gray-200"
                                            >
                                                Compare with Current
                                            </Button>
                                        )}
                                        {ver.version < versions[0].version && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onRestore(ver.version)}
                                                disabled={isRestoring}
                                                className="h-8 text-[10px] font-black rounded-lg border-gray-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Rollback
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default BlueprintTimeline;
